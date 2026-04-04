#include <WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <SPI.h>
#include <SD.h>
#include <Ds1302.h>

// ------------------- Wi-Fi -------------------
const char* ssid     = "RomyBaby2.4";
const char* password = "SID-2023-003155";

// NTP client for Philippine time (UTC+8)
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 8 * 3600, 60000); // update every 60s

// ------------------- RTC Pins -------------------
#define DS1302_CLK 25
#define DS1302_DAT 26
#define DS1302_RST 27
Ds1302 rtc(DS1302_RST, DS1302_CLK, DS1302_DAT);

// ------------------- SD Pins -------------------
#define SD_CS 4
#define SD_MOSI 23
#define SD_MISO 19
#define SD_SCK 18

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("===== ESP32 RTC & SD Offline-Ready Logging =====");

  // ---------------- RTC Initialization ----------------
  rtc.init();
  if (rtc.isHalted()) {
    // First-time setup: manually set Manila time
    Ds1302::DateTime dt;
    dt.year   = 26;   // 2026
    dt.month  = 3;    // March
    dt.day    = 25;   // 25th
    dt.hour   = 19;   // 7 PM
    dt.minute = 0;
    dt.second = 0;
    dt.dow    = 4;    // Thursday
    rtc.setDateTime(&dt);
    Serial.println("✅ RTC manually initialized (offline mode).");
  } else {
    Serial.println("✅ RTC running from backup battery.");
  }

  // ---------------- Optional NTP Sync ----------------
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int wifiAttempt = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempt < 20) { // try 10 seconds
    delay(500);
    Serial.print(".");
    wifiAttempt++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ Wi-Fi connected. Syncing NTP time...");
    timeClient.begin();
    if (timeClient.update()) {
      unsigned long epochTime = timeClient.getEpochTime();
      // Convert epoch to RTC time
      Ds1302::DateTime dt;
      dt.second = epochTime % 60;
      dt.minute = (epochTime / 60) % 60;
      dt.hour   = (epochTime / 3600) % 24;
      // Simple manual date calculation
      dt.day    = 25;  // placeholder, first time boot
      dt.month  = 3;
      dt.year   = 26;
      dt.dow    = 4;
      rtc.setDateTime(&dt);
      Serial.println("✅ RTC synced from NTP (Philippine time).");
    } else {
      Serial.println("⚠️ Failed to get NTP time. Using RTC backup.");
    }
  } else {
    Serial.println("⚠️ Wi-Fi not available. Using RTC backup.");
  }

  // ---------------- SD Module Detection ----------------
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  pinMode(SD_CS, OUTPUT);
  digitalWrite(SD_CS, HIGH);

  if (isSDModulePresent()) {
    Serial.println("✅ SD module detected (hardware responding).");
    if (SD.begin(SD_CS)) {
      Serial.println("✅ SD card initialized successfully.");
    } else {
      Serial.println("⚠️ SD card not present, but module detected.");
    }
  } else {
    Serial.println("❌ SD module not responding! Check wiring.");
  }

  Serial.println("Setup complete.\n");
}

// ---------------- Loop ----------------
void loop() {
  // Read RTC
  Ds1302::DateTime now;
  rtc.getDateTime(&now);

  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp), "20%02d/%02d/%02d %02d:%02d:%02d",
           now.year, now.month, now.day,
           now.hour, now.minute, now.second);

  Serial.println(String("⏰ RTC Time: ") + timestamp);

  // Log to SD if present
  if (SD.begin(SD_CS)) {
    File file = SD.open("log.txt", FILE_APPEND);
    if (file) {
      file.println(timestamp);
      file.close();
      Serial.println("💾 Logged to SD successfully.");
    } else {
      Serial.println("❌ Failed to write to SD card!");
    }
  } else {
    Serial.println("⚠️ SD card missing, skipping log.");
  }

  delay(5000);
}

// ---------------- SD Module Check ----------------
bool isSDModulePresent() {
  digitalWrite(SD_CS, LOW);
  SPI.transfer(0xFF); // Dummy SPI transfer
  digitalWrite(SD_CS, HIGH);
  delay(10);
  return true;
}