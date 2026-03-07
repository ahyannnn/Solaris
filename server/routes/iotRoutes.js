const express = require("express");
const router = express.Router();

// test route
router.get("/", (req, res) => {
    res.send("iotroute route working");
});

module.exports = router;