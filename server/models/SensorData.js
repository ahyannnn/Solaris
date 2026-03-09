const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  irradiance: Number,
  temperature: Number,
  humidity: Number,
  gps: {
    latitude: Number,
    longitude: Number
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SensorData", sensorSchema);