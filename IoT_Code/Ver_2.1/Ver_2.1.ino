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
#include <HTTPClient.h>
#include <DHT.h>

// ------------------- LOGGING HELPERS -------------------
void logInfo(String msg) { Serial.println("ℹ️ " + msg); }
void logSuccess(String msg) { Serial.println("✅ " + msg); }
void logError(String msg) { Serial.println("❌ " + msg); }
void logProcess(String msg) { Serial.println("🔄 " + msg); }
void logNetwork(String msg) { Serial.println("🌐 " + msg); }
void logSensor(String msg) { Serial.println("📡 " + msg); }
void logStorage(String msg) { Serial.println("💾 " + msg); }

// ------------------- DEFAULTS -------------------
const char* default_ssid     = "RomyBaby2.4";
const char* default_password = "SID-2023-003155";
String serverURL = "http://192.168.254.115:5000/api/sensor/data";
const char* deviceId = "SOLAR001";

// ------------------- AP -------------------
const char* ap_ssid = "ESP32_Config";
const char* ap_pass = "12345678";
WebServer server(80);
Preferences preferences;

// ------------------- LOGGING TIMERS -------------------
unsigned long lastLogTime = 0;
unsigned long lastUploadTime = 0;
unsigned long logInterval = 900000;      // 15 min
unsigned long uploadInterval = 7200000;  // 2 hours
bool backlogSyncRunning = false;

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

// ------------------- DHT22 -------------------
#define DHTPIN 14
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ------------------- WIFI STORAGE -------------------
String savedSSID;
String savedPASS;

void preTransmission() { digitalWrite(MAX485_DE_RE, HIGH); }
void postTransmission() { digitalWrite(MAX485_DE_RE, LOW); }

// ===================================================
// WIFI CONNECT
// ===================================================
bool connectToWiFi(String ssid, String pass) {
  logNetwork("Connecting to WiFi: " + ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    logSuccess("WiFi connected! IP: " + WiFi.localIP().toString());
    return true;
  } else {
    logError("WiFi connection FAILED");
    return false;
  }
}

// ===================================================
// SEND TO SERVER
// ===================================================
bool sendToServer(String timestamp, float lat, float lon,
                  float irradiance, float temp, float hum) {

  if (WiFi.status() != WL_CONNECTED) {
    logError("Upload skipped (no WiFi)");
    return false;
  }

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"deviceId\":\"" + String(deviceId) + "\",";
  json += "\"timestamp\":\"" + timestamp + "\",";
  json += "\"irradiance\":" + String(irradiance) + ",";
  json += "\"temperature\":" + String(temp) + ",";
  json += "\"humidity\":" + String(hum) + ",";
  json += "\"gps\":{\"latitude\":" + String(lat, 6) + ",\"longitude\":" + String(lon, 6) + "}";
  json += "}";

  int code = http.POST(json);
  http.end();

  if (code > 0 && code < 300) {
    logNetwork("Upload successful");
    return true;
  } else {
    logError("Upload failed, code: " + String(code));
    return false;
  }
}

// ===================================================
// SD LOG WRITER
// ===================================================
void appendLogToSD(String timestamp, float lat, float lon,
                   float irradiance, float temp, float hum) {

  if (!sdAvailable) {
    logError("SD unavailable, skipping log");
    return;
  }

  File file = SD.open("/log.txt", FILE_APPEND);
  if (!file) {
    logError("Failed to open log file");
    return;
  }

  file.printf("%s,%.6f,%.6f,%.2f,%.2f,%.2f,0\n",
              timestamp.c_str(), lat, lon,
              irradiance, temp, hum);

  file.close();
  logStorage("Data logged to SD");
}

// ===================================================
// UPLOAD SINGLE RECORD
// ===================================================
bool uploadSingleRecord(String line) {

  int lastComma = line.lastIndexOf(',');
  String data = line.substring(0, lastComma);

  int p1 = data.indexOf(',');
  int p2 = data.indexOf(',', p1 + 1);
  int p3 = data.indexOf(',', p2 + 1);
  int p4 = data.indexOf(',', p3 + 1);
  int p5 = data.indexOf(',', p4 + 1);

  String timestamp = data.substring(0, p1);
  float lat = data.substring(p1+1, p2).toFloat();
  float lon = data.substring(p2+1, p3).toFloat();
  float irr = data.substring(p3+1, p4).toFloat();
  float temp = data.substring(p4+1, p5).toFloat();
  float hum  = data.substring(p5+1).toFloat();

  return sendToServer(timestamp, lat, lon, irr, temp, hum);
}

// ===================================================
// BACKLOG SYNC
// ===================================================
void syncSDBacklog() {
  if (!sdAvailable || WiFi.status() != WL_CONNECTED) return;
  if (backlogSyncRunning) return;

  backlogSyncRunning = true;
  logProcess("Syncing backlog...");

  File oldFile = SD.open("/log.txt", FILE_READ);
  if (!oldFile) { backlogSyncRunning = false; return; }

  File newFile = SD.open("/temp.txt", FILE_WRITE);
  if (!newFile) { oldFile.close(); backlogSyncRunning = false; return; }

  while (oldFile.available()) {
    String line = oldFile.readStringUntil('\n');
    line.trim();
    if (line.length() < 5) continue;

    if (line.endsWith(",1")) {
      newFile.println(line);
      continue;
    }

    bool success = uploadSingleRecord(line);

    if (success) {
      logSuccess("Backlog record uploaded");
      newFile.println(line.substring(0, line.length() - 1) + "1");
    } else {
      logError("Backlog upload failed");
      newFile.println(line);
      break;
    }

    delay(200);
  }

  oldFile.close();
  newFile.close();
  SD.remove("/log.txt");
  SD.rename("/temp.txt", "/log.txt");

  logSuccess("Backlog sync complete");
  backlogSyncRunning = false;
}

// ===================================================
// RTC SYNC
// ===================================================
void syncRTCwithNTP() {
  logProcess("Syncing RTC with NTP...");

  if (connectToWiFi(default_ssid, default_password)) {
    timeClient.begin();
    timeClient.update();

    time_t rawTime = timeClient.getEpochTime();
    struct tm * timeinfo = gmtime(&rawTime);
    timeinfo->tm_hour += 8;
    mktime(timeinfo);

    Ds1302::DateTime dt;
    dt.year   = timeinfo->tm_year % 100;
    dt.month  = timeinfo->tm_mon + 1;
    dt.day    = timeinfo->tm_mday;
    dt.hour   = timeinfo->tm_hour;
    dt.minute = timeinfo->tm_min;
    dt.second = timeinfo->tm_sec;
    dt.dow    = timeinfo->tm_wday == 0 ? 7 : timeinfo->tm_wday;

    rtc.setDateTime(&dt);

    logSuccess("RTC synced via NTP");
  } else {
    logError("RTC sync FAILED (no WiFi)");
  }
}

// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(115200);
  logInfo("System booting...");

  rtc.init();
  logSuccess("RTC initialized");

  dht.begin();
  logSuccess("DHT22 initialized");

  preferences.begin("config", true);
  savedSSID = preferences.getString("ssid", default_ssid);
  savedPASS = preferences.getString("pass", default_password);
  preferences.end();

  connectToWiFi(savedSSID, savedPASS);

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  sdAvailable = SD.begin(SD_CS);

  if (sdAvailable) logSuccess("SD card mounted");
  else logError("SD card FAILED");

  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
  logSuccess("GPS initialized");

  rs485Serial.begin(9600, SERIAL_8N1, 34, 32);
  logSuccess("RS485 initialized");

  pinMode(MAX485_DE_RE, OUTPUT);
  digitalWrite(MAX485_DE_RE, LOW);

  node.begin(1, rs485Serial);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  logSuccess("Modbus node ready");

  lastLogTime = millis() - logInterval;
  lastUploadTime = millis() - uploadInterval;

  syncRTCwithNTP();
}

// ===================================================
// LOOP
// ===================================================
void loop() {

  Ds1302::DateTime now;
  rtc.getDateTime(&now);

  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp),
           "20%02d-%02d-%02dT%02d:%02d:%02d",
           now.year, now.month, now.day,
           now.hour, now.minute, now.second);

  // GPS
  float lat = 0.0, lon = 0.0;
  while (gpsSerial.available()) gps.encode(gpsSerial.read());
  if (gps.location.isValid()) {
    lat = gps.location.lat();
    lon = gps.location.lng();
  }

  // Irradiance
  float irradiance = -1;
  uint8_t result = node.readHoldingRegisters(0x0000, 2);
  if (result == node.ku8MBSuccess) {
    uint16_t high = node.getResponseBuffer(0);
    uint16_t low  = node.getResponseBuffer(1);
    irradiance = ((high << 16) | low) / 10.0;
  }

  // DHT22
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  if (isnan(temperature)) temperature = -99;
  if (isnan(humidity)) humidity = -99;

  logSensor("Temp: " + String(temperature) + "C | Hum: " + String(humidity) + "%");
  logSensor("Irradiance: " + String(irradiance));

  // LOG every 15 min
  if (millis() - lastLogTime >= logInterval) {
    lastLogTime = millis();
    appendLogToSD(timestamp, lat, lon, irradiance, temperature, humidity);
  }

  // UPLOAD & BACKLOG SYNC every 2 hours
  if (millis() - lastUploadTime >= uploadInterval) {
    lastUploadTime = millis();

    // Upload current reading
    sendToServer(timestamp, lat, lon, irradiance, temperature, humidity);

    // Sync all backlog records
    syncSDBacklog();
  }
}