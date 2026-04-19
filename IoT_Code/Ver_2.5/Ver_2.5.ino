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
#include <WiFiClientSecure.h>
#include <DHT.h>

// ------------------- AP TIMER -------------------
unsigned long apStartTime = 0;
bool apRunning = false;
const unsigned long AP_DURATION = 1800000; // 30 minutes

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
String default_serverURL = "https://solaris-34ej.onrender.com/api/sensor/data";
const char* deviceId = "IOT-260409-0020";

// ------------------- AP -------------------
const char* ap_ssid = "ESP32_Config";
const char* ap_pass = "12345678";
WebServer server(80);
Preferences preferences;

// ------------------- CONFIGURABLE SETTINGS -------------------
String savedSSID;
String savedPASS;
unsigned long logInterval = 20000;      // 20 sec (adjust as needed)
unsigned long uploadInterval = 60000;   // 1 min
String serverURL = default_serverURL;

// ------------------- LOGGING TIMERS -------------------
unsigned long lastLogTime = 0;
unsigned long lastUploadTime = 0;
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

// ------------------- RS485 (separate DE & RE) -------------------
HardwareSerial rs485Serial(2);
ModbusMaster node;
#define RS485_DE 33   // Driver enable (active HIGH)
#define RS485_RE 13   // Receiver enable (active LOW)

void preTransmission() {
  digitalWrite(RS485_DE, HIGH);   // Driver ON
  digitalWrite(RS485_RE, HIGH);   // Receiver OFF (disable)
  delay(2);
}

void postTransmission() {
  digitalWrite(RS485_DE, LOW);    // Driver OFF
  digitalWrite(RS485_RE, LOW);    // Receiver ON (enable)
  delay(2);
}

// ------------------- DHT22 -------------------
#define DHTPIN 14
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ===================================================
// WIFI CONNECT
// ===================================================
bool connectToWiFi(String ssid, String pass) {
  logNetwork("Clearing old WiFi credentials...");
  WiFi.disconnect(true, true);
  delay(1000);

  logNetwork("Connecting to WiFi: " + ssid);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
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
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(20000);
  String json = "{";
  json += "\"deviceId\":\"" + String(deviceId) + "\",";
  json += "\"timestamp\":\"" + timestamp + "\",";
  json += "\"irradiance\":" + String(irradiance) + ",";
  json += "\"temperature\":" + String(temp) + ",";
  json += "\"humidity\":" + String(hum) + ",";
  json += "\"gps\":{\"latitude\":" + String(lat, 6) + ",\"longitude\":" + String(lon, 6) + "}";
  json += "}";
  logNetwork("Sending to Render...");
  int code = http.POST(json);
  String response = http.getString();
  logNetwork("Response code: " + String(code));
  logNetwork("Response: " + response);
  http.end();
  if (code > 0 && code < 300) {
    logSuccess("Upload successful (Cloud)");
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
    bool uploaded = line.endsWith(",1");
    if (!uploaded) {
      bool success = uploadSingleRecord(line);
      if (success) {
        logSuccess("Backlog record uploaded");
        int lastComma = line.lastIndexOf(',');
        String baseData = line.substring(0, lastComma);
        line = baseData + ",1";
      } else {
        logError("Backlog upload failed, will retry later");
      }
    }
    newFile.println(line);
    delay(50);
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

  if (WiFi.status() != WL_CONNECTED) {
    logError("RTC sync skipped (no WiFi)");
    return;
  }

  timeClient.begin();
  if (!timeClient.update()) {
    logError("NTP update failed");
    return;
  }

  time_t rawTime = timeClient.getEpochTime();
  struct tm * timeinfo = gmtime(&rawTime);

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
}

// ------------------- WEB CONFIGURATION PAGE -------------------
void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32 Setup</title>
  <style>
    body { font-family: Arial; background: #f0f2f5; }
    .container { max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 12px; }
    h2 { text-align: center; color: #1a73e8; }
    label { font-weight: bold; display: block; margin-top: 15px; }
    input { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 6px; }
    button { background: #1a73e8; color: white; border: none; padding: 12px; margin-top: 25px; width: 100%; border-radius: 6px; }
    button:hover { background: #0c5fcf; }
  </style>
</head>
<body>
<div class="container">
  <h2>ESP32 Setup</h2>
  <form action="/save" method="POST">
    <label>WiFi SSID:</label>
    <input type="text" name="ssid" value=")rawliteral" + savedSSID + R"rawliteral(" required>
    <label>WiFi Password:</label>
    <input type="password" name="pass" value=")rawliteral" + savedPASS + R"rawliteral(" required>
    <label>Logging Interval (minutes):</label>
    <input type="number" name="logInt" value=")rawliteral" + String(logInterval / 60000) + R"rawliteral(" required>
    <label>Upload Interval (minutes):</label>
    <input type="number" name="uploadInt" value=")rawliteral" + String(uploadInterval / 60000) + R"rawliteral(" required>
    <label>Server URL:</label>
    <input type="url" name="serverURL" value=")rawliteral" + serverURL + R"rawliteral(" required>
    <button type="submit">Save</button>
  </form>
</div>
</body>
</html>
)rawliteral";
  server.send(200, "text/html", html);
}

void handleSave() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  String newSSID = server.arg("ssid");
  String newPASS = server.arg("pass");
  unsigned long newLogMin = server.arg("logInt").toInt();
  unsigned long newUploadMin = server.arg("uploadInt").toInt();
  String newServerURL = server.arg("serverURL");

  // Validate
  if (newSSID.length() == 0 || newPASS.length() == 0 || newLogMin == 0 || newUploadMin == 0 || newServerURL.length() == 0) {
    server.send(400, "text/plain", "Invalid input. All fields required.");
    return;
  }

  // Save to Preferences
  preferences.begin("config", false);
  preferences.putString("ssid", newSSID);
  preferences.putString("pass", newPASS);
  preferences.putULong("logInt", newLogMin * 60000);
  preferences.putULong("uploadInt", newUploadMin * 60000);
  preferences.putString("serverURL", newServerURL);
  preferences.end();

  server.send(200, "text/html", "<html><body><h2>Settings saved! Rebooting...</h2></body></html>");
  delay(1000);
  ESP.restart();
}

// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(115200);
  logInfo("System booting...");

  // Load all settings from Preferences
  preferences.begin("config", true);
  savedSSID = preferences.getString("ssid", default_ssid);
  savedPASS = preferences.getString("pass", default_password);
  logInterval = preferences.getULong("logInt", 900000);   // 15 min default
  uploadInterval = preferences.getULong("uploadInt", 7200000); // 2h default
  serverURL = preferences.getString("serverURL", default_serverURL);
  preferences.end();

  logInfo("Loaded config: SSID=" + savedSSID + " logInt(min)=" + String(logInterval/60000) + " uploadInt(min)=" + String(uploadInterval/60000));

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(ap_ssid, ap_pass);
  WiFi.setSleep(false);
  apStartTime = millis();
  apRunning = true;
  logNetwork("AP Started (30 min window) | IP: " + WiFi.softAPIP().toString());

  // Web server routes
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
  logSuccess("Web server started");

  rtc.init();
  dht.begin();

  // Try to connect to saved WiFi (if any)
  connectToWiFi(savedSSID, savedPASS);

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  sdAvailable = SD.begin(SD_CS);
  if (sdAvailable) logSuccess("SD card mounted");
  else logError("SD card FAILED");

  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
  
  // RS485: baud rate 4800 (factory default), RX=GPIO34, TX=GPIO32
  rs485Serial.begin(4800, SERIAL_8N1, 34, 32);

  pinMode(RS485_DE, OUTPUT);
  pinMode(RS485_RE, OUTPUT);
  // Start in receive mode
  digitalWrite(RS485_DE, LOW);
  digitalWrite(RS485_RE, LOW);

  node.begin(1, rs485Serial);        // sensor address = 1 (factory default)
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  lastLogTime = millis() - logInterval;
  lastUploadTime = millis() - uploadInterval;

  syncRTCwithNTP();
}

// ===================================================
// LOOP
// ===================================================
void loop() {
  server.handleClient();

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

  // ========== READ SOLAR RADIATION (FIXED) ==========
  float irradiance = -1.0f;
  logSensor("Reading pyranometer...");
  
  uint8_t result = node.readHoldingRegisters(0x0000, 1);   // length = 1
  
  if (result == node.ku8MBSuccess) {
    uint16_t raw = node.getResponseBuffer(0);
    irradiance = (float)raw;   // value is in W/m² (no scaling)
    logSuccess("Irradiance: " + String(irradiance) + " W/m²");
  } else {
    logError("Pyranometer read FAILED, Modbus error: " + String(result));
    switch(result) {
      case 224: Serial.println("  - Invalid slave ID (check sensor address)"); break;
      case 226: Serial.println("  - Response timeout (check wiring, baud rate, power)"); break;
      case 227: Serial.println("  - CRC mismatch (noise or wrong baud rate)"); break;
      default: break;
    }
  }

  // DHT22
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  if (isnan(temperature)) temperature = -99;
  if (isnan(humidity)) humidity = -99;

  // Logging
  if (millis() - lastLogTime >= logInterval) {
    lastLogTime = millis();
    appendLogToSD(timestamp, lat, lon, irradiance, temperature, humidity);
  }

  // Upload & backlog sync
  if (millis() - lastUploadTime >= uploadInterval) {
    lastUploadTime = millis();
    syncSDBacklog();
  }

  // Auto stop AP after 30 minutes
  if (apRunning && millis() - apStartTime >= AP_DURATION) {
    WiFi.softAPdisconnect(true);
    apRunning = false;
    logNetwork("AP stopped after 30 minutes");
  }
}