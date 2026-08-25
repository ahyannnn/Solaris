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
#include "esp_sleep.h"

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
const char* default_serverURL = "https://solaris-34ej.onrender.com/api/sensor/data";
String default_deviceId = "IOT-260409-0020";
String default_bookingRef = "N/A";                     // NEW: bookingReference default

const int default_startHour = 6;
const int default_startMinute = 0;
const int default_endHour = 18;
const int default_endMinute = 0;

// ------------------- AP -------------------
const char* ap_ssid = "ESP32_Config";
const char* ap_pass = "12345678";
WebServer server(80);
Preferences preferences;

// ------------------- CONFIGURABLE SETTINGS -------------------
String savedSSID;
String savedPASS;
String deviceId;
String bookingReference;                               // NEW: bookingReference variable
unsigned long logInterval = 20000;      // 20 sec
unsigned long uploadInterval = 60000;   // 1 min

// Power saving – always enabled
bool powerSavingEnabled = true;
int activeStartHour = default_startHour;
int activeStartMinute = default_startMinute;
int activeEndHour = default_endHour;
int activeEndMinute = default_endMinute;

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

enum GpsState {
  GPS_SEARCHING,
  GPS_ACTIVE,
  GPS_DISABLED
};
GpsState gpsState = GPS_SEARCHING;
unsigned long gpsStartTime = 0;
float lastValidLat = 14.7683166;
float lastValidLon = 120.9418555;
float currentLat = 0.0;
float currentLon = 0.0;

// ------------------- RS485 -------------------
HardwareSerial rs485Serial(2);
ModbusMaster node;
#define RS485_DE 33
#define RS485_RE 13

void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
  digitalWrite(RS485_RE, HIGH);
  delay(2);
}

void postTransmission() {
  digitalWrite(RS485_DE, LOW);
  digitalWrite(RS485_RE, LOW);
  delay(2);
}

// ------------------- DHT22 -------------------
#define DHTPIN 14
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ------------------- GLOBAL LATEST SENSOR VALUES -------------------
float latestIrradiance = -1.0f;
float latestTemperature = -99.0f;
float latestHumidity = -99.0f;
String latestTimestamp = "";

// ===================================================
// WIFI POWER MANAGEMENT (NEW)
// ===================================================
bool wifiOn = false;

void enableWiFi() {
  if (!wifiOn) {
    WiFi.mode(WIFI_AP_STA);               // Both AP and STA
    WiFi.begin(savedSSID.c_str(), savedPASS.c_str());
    logNetwork("Enabling WiFi STA...");
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      logSuccess("WiFi STA connected: " + WiFi.localIP().toString());
      wifiOn = true;
    } else {
      logError("WiFi STA reconnection failed");
      wifiOn = false;
    }
  }
}

void disableWiFi() {
  if (wifiOn) {
    WiFi.disconnect(true);                // Disconnect STA
    WiFi.mode(WIFI_AP);                   // Keep AP active
    wifiOn = false;
    logNetwork("WiFi STA turned OFF, AP remains active");
  }
}

// ===================================================
// WIFI CONNECT (used only in setup)
// ===================================================
bool connectToWiFi(String ssid, String pass) {
  logNetwork("Clearing old WiFi credentials...");
  WiFi.disconnect(true, true);
  delay(1000);

  logNetwork("Connecting to WiFi: " + ssid);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
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
    wifiOn = true;
    return true;
  } else {
    logError("WiFi connection FAILED");
    wifiOn = false;
    return false;
  }
}

// ===================================================
// SEND TO SERVER (with optional WiFi management)
// ===================================================
bool sendToServer(String timestamp, float lat, float lon,
                  float irradiance, float temp, float hum,
                  bool manageWiFi = true) {   // NEW: optional WiFi toggle
  if (manageWiFi) {
    enableWiFi();
  }
  if (!wifiOn || WiFi.status() != WL_CONNECTED) {
    logError("Upload skipped (no WiFi)");
    if (manageWiFi) disableWiFi();   // turn off if we enabled it
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, default_serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(20000);
  String json = "{";
  json += "\"deviceId\":\"" + deviceId + "\",";
  json += "\"bookingReference\":\"" + bookingReference + "\",";
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

  bool success = (code > 0 && code < 300);
  if (success) {
    logSuccess("Upload successful (Cloud)");
  } else {
    logError("Upload failed, code: " + String(code));
  }

  if (manageWiFi) {
    disableWiFi();   // turn off if we enabled it
  }
  return success;
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
// UPLOAD SINGLE RECORD (uses sendToServer with WiFi management)
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
  return sendToServer(timestamp, lat, lon, irr, temp, hum); // manageWiFi = true by default
}

// ===================================================
// UPLOAD SINGLE RECORD WITHOUT TOGGLING WIFI (used during backlog sync)
// ===================================================
bool uploadSingleRecordWithWiFiOn(String line) {
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
  return sendToServer(timestamp, lat, lon, irr, temp, hum, false); // manageWiFi = false
}

// ===================================================
// BACKLOG SYNC (WiFi turned on once for all records)
// ===================================================
void syncSDBacklog() {
  if (!sdAvailable) return;
  if (backlogSyncRunning) return;
  backlogSyncRunning = true;
  logProcess("Syncing backlog...");

  // Turn WiFi ON once
  enableWiFi();
  if (!wifiOn || WiFi.status() != WL_CONNECTED) {
    logError("Backlog sync skipped: no WiFi");
    backlogSyncRunning = false;
    return;
  }

  File oldFile = SD.open("/log.txt", FILE_READ);
  if (!oldFile) { 
    disableWiFi();
    backlogSyncRunning = false; 
    return; 
  }
  File newFile = SD.open("/temp.txt", FILE_WRITE);
  if (!newFile) { 
    oldFile.close(); 
    disableWiFi();
    backlogSyncRunning = false; 
    return; 
  }

  while (oldFile.available()) {
    String line = oldFile.readStringUntil('\n');
    line.trim();
    if (line.length() < 5) continue;
    bool uploaded = line.endsWith(",1");
    if (!uploaded) {
      bool success = uploadSingleRecordWithWiFiOn(line);   // uses already-on WiFi
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

  // Turn WiFi OFF after all records processed
  disableWiFi();
}

// ===================================================
// RTC SYNC (requires WiFi – turns it on temporarily)
// ===================================================
void syncRTCwithNTP() {
  logProcess("Syncing RTC with NTP...");

  enableWiFi();
  if (!wifiOn || WiFi.status() != WL_CONNECTED) {
    logError("RTC sync skipped (no WiFi)");
    return;
  }

  timeClient.begin();
  if (!timeClient.update()) {
    logError("NTP update failed");
    disableWiFi();
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
  disableWiFi();
}

// ===================================================
// DEEP SLEEP HELPER
// ===================================================
void goToDeepSleep(uint32_t seconds) {
  logInfo("Entering deep sleep for " + String(seconds) + " seconds");
  // Turn WiFi off before sleep just in case
  disableWiFi();
  esp_sleep_enable_timer_wakeup(seconds * 1000000ULL);
  esp_deep_sleep_start();
}

// ===================================================
// WEB ENDPOINTS
// ===================================================
void handleCurrentData() {
  String json = "{";
  json += "\"deviceId\":\"" + deviceId + "\",";
  json += "\"timestamp\":\"" + latestTimestamp + "\",";
  json += "\"irradiance\":" + String(latestIrradiance) + ",";
  json += "\"temperature\":" + String(latestTemperature) + ",";
  json += "\"humidity\":" + String(latestHumidity) + ",";
  json += "\"wifiStatus\":\"" + String(wifiOn ? "on" : "off") + "\"";
  json += "}";
  server.send(200, "application/json; charset=utf-8", json);
}

void handleSyncRTC() {
  syncRTCwithNTP();
  server.send(200, "text/plain", "RTC sync attempted. Check serial for status.");
}

// ------------------- handleRoot() (no checkbox, UTF-8) -------------------
void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32 Solar Monitor</title>
  <style>
    body { font-family: Arial; background: #f0f2f5; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: auto; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #1a73e8; margin-bottom: 15px; }
    h3 { color: #333; margin-top: 20px; border-bottom: 2px solid #1a73e8; padding-bottom: 5px; }
    .data-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .data-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .data-row:last-child { border-bottom: none; }
    .data-label { font-weight: bold; color: #555; display: block; }
    .data-value { font-family: monospace; display: block; margin-top: 4px; }
    .btn { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #0c5fcf; }
    .btn-success { background: #28a745; }
    .btn-success:hover { background: #218838; }
    label { font-weight: bold; display: block; margin-top: 15px; color: #555; }
    input[type="text"], input[type="number"] { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    input:focus { outline: none; border-color: #1a73e8; }
    .form-actions { margin-top: 20px; }
    .info { background: #e8f0fe; padding: 10px; border-radius: 6px; margin-top: 20px; font-size: 12px; color: #555; }
    .time-group { margin-top: 10px; }
    .time-group label { font-weight: bold; display: block; margin-top: 5px; }
    .time-group input[type="number"] { width: 80px; display: inline-block; margin-right: 8px; }
    .time-group span { font-size: 14px; }
  </style>
  <script>
    function fetchData() {
      fetch('/api/current')
        .then(response => response.json())
        .then(data => {
          document.getElementById('devId').innerText = data.deviceId;
          document.getElementById('ts').innerText = data.timestamp;
          document.getElementById('irr').innerText = data.irradiance + ' W/m²';
          document.getElementById('temp').innerText = data.temperature + ' °C';
          document.getElementById('hum').innerText = data.humidity + ' %';
          document.getElementById('wifi').innerText = data.wifiStatus;
        })
        .catch(err => console.error('Fetch error:', err));
    }
    function syncRTC() {
      fetch('/syncrtc')
        .then(response => response.text())
        .then(msg => {
          document.getElementById('syncMsg').innerText = msg;
          setTimeout(() => { document.getElementById('syncMsg').innerText = ''; }, 5000);
        })
        .catch(err => alert('Sync failed: ' + err));
    }
    setInterval(fetchData, 3000);
    window.onload = fetchData;
  </script>
</head>
<body>
<div class="container">
  <h2>ESP32 Solar Monitor</h2>
  
  <center><h3>Live Sensor Data</h3></center>
  <div class="data-box">
    <div class="data-row">
      <span class="data-label">Device ID</span>
      <span class="data-value" id="devId">---</span>
    </div>
    <div class="data-row">
      <span class="data-label">Timestamp</span>
      <span class="data-value" id="ts">---</span>
    </div>
    <div class="data-row">
      <span class="data-label">Irradiance</span>
      <span class="data-value" id="irr">---</span>
    </div>
    <div class="data-row">
      <span class="data-label">Temperature</span>
      <span class="data-value" id="temp">---</span>
    </div>
    <div class="data-row">
      <span class="data-label">Humidity</span>
      <span class="data-value" id="hum">---</span>
    </div>
    <div class="data-row">
      <span class="data-label">WiFi Status</span>
      <span class="data-value" id="wifi">---</span>
    </div>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
    <button class="btn btn-success" onclick="syncRTC()">Sync Time</button>
  </div>
  <div id="syncMsg" style="margin-top: 5px; color: #1a73e8;"></div>

  <center><h3>Configuration</h3></center>
  <form action="/save" method="POST">
    <label>WiFi SSID:</label>
    <input type="text" name="ssid" value=")rawliteral" + savedSSID + R"rawliteral(" required>
    <label>WiFi Password:</label>
    <input type="text" name="pass" value=")rawliteral" + savedPASS + R"rawliteral(" required>
    
    <label>Device ID:</label>
    <input type="text" name="deviceId" value=")rawliteral" + deviceId + R"rawliteral(" required>

    <!-- NEW: bookingReference input field -->
    <label>Booking Reference:</label>
    <input type="text" name="bookingRef" value=")rawliteral" + bookingReference + R"rawliteral(" required>

    <label>Logging Interval (minutes):</label>
    <input type="number" name="logInt" value=")rawliteral" + String(logInterval / 60000) + R"rawliteral(" required min="1">
    <label>Upload Interval (minutes):</label>
    <input type="number" name="uploadInt" value=")rawliteral" + String(uploadInterval / 60000) + R"rawliteral(" required min="1">

    <center><h3>Power Saving</h3></center>
    <div class="time-group">
      <label>Start Time</label>
      <input type="number" name="startHour" min="0" max="23" value=")rawliteral" + String(activeStartHour) + R"rawliteral(" style="width:80px;"> <span>hours</span>
    </div>
    <div class="time-group">
      <label>End Time</label>
      <input type="number" name="endHour" min="0" max="23" value=")rawliteral" + String(activeEndHour) + R"rawliteral(" style="width:80px;"> <span>hours</span>
    </div>
    <p style="font-size:12px; color:#888;">Set both to 0:00 to run 24/7</p>

    <div class="form-actions">
      <center><button type="submit" class="btn btn-success">Save</button></center>
    </div>
  </form>
  <div class="info">
    Server URL is fixed: )rawliteral" + String(default_serverURL) + R"rawliteral(
  </div>
</div>
</body>
</html>
)rawliteral";
  server.send(200, "text/html; charset=utf-8", html);
}

// ------------------- handleSave() (no checkbox, message only) -------------------
void handleSave() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  String newSSID = server.arg("ssid");
  String newPASS = server.arg("pass");
  String newDeviceId = server.arg("deviceId");
  String newBookingRef = server.arg("bookingRef");   // NEW: read bookingReference from form
  if (newBookingRef.length() == 0) newBookingRef = "N/A";

  unsigned long newLogMin = server.arg("logInt").toInt();
  unsigned long newUploadMin = server.arg("uploadInt").toInt();

  int newStartHour = server.arg("startHour").toInt();
  int newStartMinute = server.arg("startMinute").toInt();
  int newEndHour = server.arg("endHour").toInt();
  int newEndMinute = server.arg("endMinute").toInt();

  if (newSSID.length() == 0 || newPASS.length() == 0 || newDeviceId.length() == 0 ||
      newLogMin == 0 || newUploadMin == 0 ||
      newStartHour < 0 || newStartHour > 23 ||
      newEndHour < 0 || newEndHour > 23) {
    server.send(400, "text/plain", "Invalid input. Check all fields.");
    return;
  }

  preferences.begin("config", false);
  preferences.putString("ssid", newSSID);
  preferences.putString("pass", newPASS);
  preferences.putString("deviceId", newDeviceId);
  preferences.putString("bookingRef", newBookingRef);   // NEW: save bookingReference
  preferences.putULong("logInt", newLogMin * 60000);
  preferences.putULong("uploadInt", newUploadMin * 60000);
  preferences.putInt("startHour", newStartHour);
  preferences.putInt("startMinute", newStartMinute);
  preferences.putInt("endHour", newEndHour);
  preferences.putInt("endMinute", newEndMinute);
  preferences.end();

  // Show a friendly message (no auto-close, no redirect)
  server.send(200, "text/html", 
    "<html><body>"
    "<h2>Settings saved!</h2>"
    "<p>The device will reboot to apply changes.</p>"
    "<p>You may now close this tab.</p>"
    "</body></html>"
  );
  delay(1000);
  ESP.restart();
}

// ===================================================
// GPS HELPERS
// ===================================================
void loadLastGpsLocation() {
  preferences.begin("gps", true);
  lastValidLat = preferences.getFloat("lastLat", 0.0);
  lastValidLon = preferences.getFloat("lastLon", 0.0);
  preferences.end();
  currentLat = lastValidLat;
  currentLon = lastValidLon;
  logInfo("Loaded last GPS location: " + String(lastValidLat,6) + ", " + String(lastValidLon,6));
}

void saveLastGpsLocation(float lat, float lon) {
  if (lat == 0.0 && lon == 0.0) return;
  preferences.begin("gps", false);
  preferences.putFloat("lastLat", lat);
  preferences.putFloat("lastLon", lon);
  preferences.end();
  lastValidLat = lat;
  lastValidLon = lon;
  logSuccess("Saved GPS location: " + String(lat,6) + ", " + String(lon,6));
}

// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(115200);
  logInfo("System booting...");

  preferences.begin("config", true);
  savedSSID = preferences.getString("ssid", default_ssid);
  savedPASS = preferences.getString("pass", default_password);
  deviceId = preferences.getString("deviceId", default_deviceId);
  bookingReference = preferences.getString("bookingRef", default_bookingRef); // NEW: read bookingReference
  logInterval = preferences.getULong("logInt", 900000);
  uploadInterval = preferences.getULong("uploadInt", 7200000);
  activeStartHour = preferences.getInt("startHour", default_startHour);
  activeStartMinute = preferences.getInt("startMinute", default_startMinute);
  activeEndHour = preferences.getInt("endHour", default_endHour);
  activeEndMinute = preferences.getInt("endMinute", default_endMinute);
  preferences.end();

  logInfo("Loaded config:");
  logInfo("  SSID: " + savedSSID);
  logInfo("  Device ID: " + deviceId);
  logInfo("  Booking Ref: " + bookingReference);   // NEW: log bookingReference
  logInfo("  Log Interval: " + String(logInterval/60000) + " min");
  logInfo("  Upload Interval: " + String(uploadInterval/60000) + " min");
  logInfo("  Power Saving: ON (always enabled)");
  logInfo("  Active window: " + String(activeStartHour) + ":" + String(activeStartMinute) + " - " + String(activeEndHour) + ":" + String(activeEndMinute));

  loadLastGpsLocation();

  // Start AP mode
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_pass);
  WiFi.setSleep(false);
  apStartTime = millis();
  apRunning = true;
  logNetwork("AP Started (30 min window) | IP: " + WiFi.softAPIP().toString());
  logNetwork("Connect to WiFi: " + String(ap_ssid) + " | Password: " + String(ap_pass));
  logNetwork("Then open browser to: http://" + WiFi.softAPIP().toString());

  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/api/current", handleCurrentData);
  server.on("/syncrtc", handleSyncRTC);
  server.begin();
  logSuccess("Web server started");

  rtc.init();
  dht.begin();

  // Connect to saved WiFi only if credentials exist, but we'll turn it off after if not needed.
  if (savedSSID.length() > 0 && savedPASS.length() > 0) {
    connectToWiFi(savedSSID, savedPASS);
    // Leave it on if we need NTP sync, but we'll sync RTC once now.
    syncRTCwithNTP(); // This will turn WiFi off after sync
  } else {
    logInfo("No saved WiFi credentials. Use AP mode to configure.");
  }

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  sdAvailable = SD.begin(SD_CS);
  if (sdAvailable) logSuccess("SD card mounted");
  else logError("SD card FAILED");

  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

  rs485Serial.begin(4800, SERIAL_8N1, 34, 32);
  pinMode(RS485_DE, OUTPUT);
  pinMode(RS485_RE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  digitalWrite(RS485_RE, LOW);

  node.begin(1, rs485Serial);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  lastLogTime = millis() - logInterval;
  lastUploadTime = millis() - uploadInterval;

  gpsStartTime = millis();
  logInfo("GPS searching for fix (timeout = 10 minutes)...");
}

// ===================================================
// LOOP
// ===================================================
void loop() {
  server.handleClient();

  Ds1302::DateTime now;
  rtc.getDateTime(&now);

  // ----- RTC VALIDATION & FALLBACK -----
  bool rtcValid = (now.year >= 0 && now.year <= 99) &&
                  (now.month >= 1 && now.month <= 12) &&
                  (now.day >= 1 && now.day <= 31) &&
                  (now.hour >= 0 && now.hour <= 23) &&
                  (now.minute >= 0 && now.minute <= 59) &&
                  (now.second >= 0 && now.second <= 59);

  if (!rtcValid) {
    logError("RTC time invalid, attempting NTP sync...");
    syncRTCwithNTP();                 // tries to set RTC from internet
    rtc.getDateTime(&now);            // read again
    // re-check after sync
    rtcValid = (now.year >= 0 && now.year <= 99) &&
               (now.month >= 1 && now.month <= 12) &&
               (now.day >= 1 && now.day <= 31) &&
               (now.hour >= 0 && now.hour <= 23) &&
               (now.minute >= 0 && now.minute <= 59) &&
               (now.second >= 0 && now.second <= 59);
  }

  if (rtcValid) {
    char timestamp[32];
    snprintf(timestamp, sizeof(timestamp),
             "20%02d-%02d-%02dT%02d:%02d:%02d",
             now.year, now.month, now.day,
             now.hour, now.minute, now.second);
    latestTimestamp = String(timestamp);
  } else {
    // Fallback to a fixed default (won't cause a server error)
    latestTimestamp = "2000-01-01T00:00:00Z";
    logError("RTC still invalid, using fallback timestamp: " + latestTimestamp);
  }

  // ---------- POWER SAVING CHECK (always enabled) ----------
  if (!apRunning) {
    int currentMin = now.hour * 60 + now.minute;
    int startMin = activeStartHour * 60 + activeStartMinute;
    int endMin = activeEndHour * 60 + activeEndMinute;

    // If start == end == 0, treat as 24/7 (always active)
    bool alwaysActive = (startMin == endMin && startMin == 0);
    bool inWindow = alwaysActive || (currentMin >= startMin && currentMin < endMin);

    if (!inWindow) {
      uint32_t secondsToSleep;
      if (currentMin < startMin) {
        secondsToSleep = (startMin - currentMin) * 60 - now.second;
      } else {
        secondsToSleep = (24 * 60 - currentMin + startMin) * 60 - now.second;
      }
      if (secondsToSleep <= 0) secondsToSleep = 60;
      logInfo("Outside active window. Sleeping for " + String(secondsToSleep) + " seconds.");
      goToDeepSleep(secondsToSleep);
    }
  }

  // ---------- GPS ----------
  // GPS remains powered (no hardware switch) but we only process data while awake.
  // We keep GPS on for simplicity.
  if (gpsState == GPS_SEARCHING) {
    while (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
    }
    if (gps.location.isValid()) {
      currentLat = gps.location.lat();
      currentLon = gps.location.lng();
      saveLastGpsLocation(currentLat, currentLon);
      gpsState = GPS_ACTIVE;
      logSuccess("GPS fix obtained! Switching to active mode.");
    } else if (millis() - gpsStartTime >= 600000UL) {
      gpsState = GPS_DISABLED;
      logError("GPS timeout: no fix after 10 minutes. Using last saved location.");
    }
  }
  else if (gpsState == GPS_ACTIVE) {
    while (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
    }
    if (gps.location.isValid()) {
      currentLat = gps.location.lat();
      currentLon = gps.location.lng();
      saveLastGpsLocation(currentLat, currentLon);
    }
  }

  // ---------- SENSORS ----------
  float irradiance = -1.0f;
  logSensor("Reading pyranometer...");
  uint8_t result = node.readHoldingRegisters(0x0000, 1);
  if (result == node.ku8MBSuccess) {
    uint16_t raw = node.getResponseBuffer(0);
    irradiance = (float)raw;
    logSuccess("Irradiance: " + String(irradiance) + " W/m²");
  } else {
    logError("Pyranometer read FAILED, Modbus error: " + String(result));
  }
  latestIrradiance = irradiance;

  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  if (isnan(temperature)) temperature = -99;
  if (isnan(humidity)) humidity = -99;
  latestTemperature = temperature;
  latestHumidity = humidity;

  // ---------- LOGGING ----------
  if (millis() - lastLogTime >= logInterval) {
    lastLogTime = millis();
    appendLogToSD(latestTimestamp, currentLat, currentLon, irradiance, temperature, humidity);
  }

  // ---------- UPLOAD & BACKLOG ----------
  if (millis() - lastUploadTime >= uploadInterval) {
    lastUploadTime = millis();
    syncSDBacklog(); // This will enable WiFi, send all, then disable it
  }

  // ---------- AP TIMEOUT ----------
  if (apRunning && millis() - apStartTime >= AP_DURATION) {
    WiFi.softAPdisconnect(true);
    apRunning = false;
    logNetwork("AP stopped after 30 minutes");
  }
}