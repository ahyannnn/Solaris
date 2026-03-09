const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController");

router.post("/data", sensorController.receiveData);

module.exports = router;