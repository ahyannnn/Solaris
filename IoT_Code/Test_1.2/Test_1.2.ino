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
NTPClient timeClient(ntpUDP, "pool.ntp.org", 8 * 3600, 60000);

// ------------------- RTC Pins -------------------
#define DS1302_CLK 25
#define DS1302_DAT 26
#define DS1302_RST 27
Ds1302 rtc(DS1302_RST, DS1302_CLK, DS1302_DAT);

// ------------------- SD Pins -------------------
#define SD_CS   4
#define SD_MOSI 23
#define SD_MISO 19
#define SD_SCK  18

// ------------------- Flags -------------------
bool sdAvailable = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("===== ESP32 RTC & SD Logger =====");

  // ---------------- RTC ----------------
  rtc.init();

  if (rtc.isHalted()) {
    Ds1302::DateTime dt;
    dt.year   = 26;   // 2026
    dt.month  = 3;
    dt.day    = 25;
    dt.hour   = 19;
    dt.minute = 0;
    dt.second = 0;
    dt.dow    = 4;
    rtc.setDateTime(&dt);
    Serial.println("✅ RTC initialized manually.");
  } else {
    Serial.println("✅ RTC running.");
  }

  // ---------------- Wi-Fi + NTP ----------------
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi connected");

    timeClient.begin();
    if (timeClient.update()) {
      unsigned long epoch = timeClient.getEpochTime();

      // Convert epoch → time
      Ds1302::DateTime dt;
      dt.second = epoch % 60;
      dt.minute = (epoch / 60) % 60;
      dt.hour   = (epoch / 3600) % 24;

      // NOTE: Simple fallback date (kept from your version)
      dt.day    = 25;
      dt.month  = 3;
      dt.year   = 26;
      dt.dow    = 4;

      rtc.setDateTime(&dt);
      Serial.println("✅ RTC synced (time only).");
    } else {
      Serial.println("⚠️ NTP failed.");
    }
  } else {
    Serial.println("⚠️ No WiFi. Using RTC.");
  }

  // ---------------- SD INIT (ONLY ONCE) ----------------
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);

  if (SD.begin(SD_CS)) {
    Serial.println("✅ SD initialized.");
    sdAvailable = true;

    // Create file if not exists
    if (!SD.exists("/log.txt")) {
      File file = SD.open("/log.txt", FILE_WRITE);
      if (file) {
        file.println("Timestamp");
        file.close();
        Serial.println("📄 Created log.txt");
      }
    }

  } else {
    Serial.println("❌ SD init failed.");
  }

  Serial.println("Setup done.\n");
}

// ---------------- LOOP ----------------
void loop() {
  // Get RTC time
  Ds1302::DateTime now;
  rtc.getDateTime(&now);

  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp),
           "20%02d/%02d/%02d %02d:%02d:%02d",
           now.year, now.month, now.day,
           now.hour, now.minute, now.second);

  Serial.println(String("⏰ ") + timestamp);

  // ---------------- LOGGING ----------------
  if (sdAvailable) {
    File file = SD.open("/log.txt", FILE_APPEND);

    if (file) {
      file.println(timestamp);
      file.close();
      Serial.println("💾 Logged.");
    } else {
      Serial.println("❌ Write failed.");
    }
  }

  delay(5000);
}