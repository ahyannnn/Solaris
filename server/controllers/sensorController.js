const SensorData = require("../models/SensorData");

exports.receiveData = async (req, res) => {
  try {
    const { deviceId, irradiance, temperature, humidity, gps, timestamp } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID is required" });
    }

    const data = new SensorData({
      deviceId,
      irradiance,
      temperature,
      humidity,
      gps,          // optional, send only once per device
      timestamp: timestamp ? new Date(timestamp) : undefined
    });

    await data.save();

    res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};