const express = require("express");
const router = express.Router();

// test route
router.get("/", (req, res) => {
    res.send("report route working");
});

module.exports = router;