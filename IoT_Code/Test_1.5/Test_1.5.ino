#include <WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <SPI.h>
#include <SD.h>
#include <Ds1302.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <ModbusMaster.h>
#include <WebServer.h>
#include <Preferences.h>

// ------------------- DEFAULT WIFI -------------------
const char* default_ssid     = "RomyBaby2.4";
const char* default_password = "SID-2023-003155";

// ------------------- AP -------------------
const char* ap_ssid = "ESP32_Config";
const char* ap_pass = "12345678";

WebServer server(80);
Preferences preferences;

// ------------------- LOGGING INTERVAL -------------------
unsigned long lastLogTime = 0;
unsigned long logInterval = 900000; // default 15 min

// ------------------- NTP -------------------
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 8 * 3600, 60000);

// ------------------- RTC -------------------
#define DS1302_CLK 25
#define DS1302_DAT 26
#define DS1302_RST 27
Ds1302 rtc(DS1302_RST, DS1302_CLK, DS1302_DAT);

// ------------------- SD -------------------
#define SD_CS   4
#define SD_MOSI 23
#define SD_MISO 19
#define SD_SCK  18
bool sdAvailable = false;

// ------------------- GPS -------------------
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);

// ------------------- RS485 -------------------
HardwareSerial rs485Serial(2);
ModbusMaster node;
#define MAX485_DE_RE 33

// ------------------- WIFI STORAGE -------------------
String savedSSID;
String savedPASS;
bool newCredentialsReceived = false;

// ===================================================
// RS485 CONTROL
// ===================================================
void preTransmission() { digitalWrite(MAX485_DE_RE, HIGH); }
void postTransmission() { digitalWrite(MAX485_DE_RE, LOW); }

// ===================================================
// WEB SERVER
// ===================================================
void handleRoot() {
  server.send(200, "text/html",
    "<h2>ESP32 Setup</h2>"
    "<form action='/save'>"

    "WiFi SSID:<br><input name='ssid'><br>"
    "WiFi Password:<br><input name='pass'><br><br>"

    "Logging Interval (minutes):<br><input name='interval'><br><br>"

    "<input type='submit' value='Save'>"
    "</form>"
  );
}

void handleSave() {
  savedSSID = server.arg("ssid");
  savedPASS = server.arg("pass");

  String intervalStr = server.arg("interval");
  int minutes = intervalStr.toInt();

  // Default to 15 if invalid
  if (minutes <= 0) minutes = 15;

  logInterval = (unsigned long)minutes * 60000;

  preferences.begin("config", false);
  preferences.putString("ssid", savedSSID);
  preferences.putString("pass", savedPASS);
  preferences.putUInt("interval", minutes);
  preferences.end();

  newCredentialsReceived = true;

  server.send(200, "text/html", "Saved! Reconnecting...");
}

void startAccessPoint() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_pass);

  Serial.println("📡 AP MODE");
  Serial.println(WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/save", handleSave);
  server.begin();
}

// ===================================================
// WIFI CONNECT
// ===================================================
bool connectToWiFi(String ssid, String pass) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  Serial.print("Connecting WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  return WiFi.status() == WL_CONNECTED;
}

// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("===== MULTI SENSOR LOGGER =====");

  // RTC
  rtc.init();

  // LOAD SAVED CONFIG
  preferences.begin("config", true);

  savedSSID = preferences.getString("ssid", default_ssid);
  savedPASS = preferences.getString("pass", default_password);

  int savedInterval = preferences.getUInt("interval", 15);
  if (savedInterval <= 0) savedInterval = 15;

  logInterval = (unsigned long)savedInterval * 60000;

  preferences.end();

  Serial.print("⏱ Log Interval: ");
  Serial.print(savedInterval);
  Serial.println(" minutes");

  // CONNECT WIFI
  if (connectToWiFi(savedSSID, savedPASS)) {
    Serial.println("✅ WiFi connected");

    timeClient.begin();
    if (timeClient.update()) {
      unsigned long epoch = timeClient.getEpochTime();

      Ds1302::DateTime dt;
      dt.second = epoch % 60;
      dt.minute = (epoch / 60) % 60;
      dt.hour   = (epoch / 3600) % 24;
      dt.day = 30; dt.month = 3; dt.year = 26; dt.dow = 1;

      rtc.setDateTime(&dt);
    }
  } else {
    Serial.println("⚠️ WiFi failed → AP mode");
    startAccessPoint();
  }

  // SD
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (SD.begin(SD_CS)) {
    sdAvailable = true;
  }

  // GPS
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

  // RS485
  pinMode(MAX485_DE_RE, OUTPUT);
  digitalWrite(MAX485_DE_RE, LOW);

  rs485Serial.begin(9600, SERIAL_8N1, 34, 32);
  node.begin(1, rs485Serial);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  Serial.println("Setup done.\n");
}

// ===================================================
// LOOP
// ===================================================
void loop() {

  server.handleClient();

  if (newCredentialsReceived) {
    WiFi.softAPdisconnect(true);

    if (!connectToWiFi(savedSSID, savedPASS)) {
      startAccessPoint();
    }

    newCredentialsReceived = false;
  }

  // TIME
  Ds1302::DateTime now;
  rtc.getDateTime(&now);

  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp),
           "20%02d/%02d/%02d %02d:%02d:%02d",
           now.year, now.month, now.day,
           now.hour, now.minute, now.second);

  // GPS
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  float latitude = gps.location.isValid() ? gps.location.lat() : 0.0;
  float longitude = gps.location.isValid() ? gps.location.lng() : 0.0;

  // PYRANOMETER
  uint8_t result;
  float irradiance = -1;

  result = node.readHoldingRegisters(0x0000, 2);

  if (result == node.ku8MBSuccess) {
    uint16_t high = node.getResponseBuffer(0);
    uint16_t low  = node.getResponseBuffer(1);
    irradiance = ((high << 16) | low) / 10.0;
  }

  // LOG TIMER
  if (millis() - lastLogTime >= logInterval) {
    lastLogTime = millis();

    Serial.println("🕒 Logging triggered");

    if (sdAvailable) {
      File file = SD.open("/log.txt", FILE_APPEND);

      if (file) {
        file.print(timestamp); file.print(",");
        file.print(latitude, 6); file.print(",");
        file.print(longitude, 6); file.print(",");
        file.println(irradiance);
        file.close();

        Serial.println("💾 Logged");
      }
    }
  }
}