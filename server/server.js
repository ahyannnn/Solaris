// server/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB connected successfully");
})
.catch((error) => {
    console.error("MongoDB connection error:", error);
});

// Routes
const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const iotRoutes = require("./routes/iotRoutes");
const reportRoutes = require("./routes/reportRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const installationRoutes = require("./routes/installationRoutes");
const emailRoutes = require("./routes/emailRoutes"); // Email routes

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/installation", installationRoutes);
app.use("/api/email", emailRoutes); // Email routes

// Test Route
app.get("/", (req, res) => {
    res.send("Solar IoT TPS API is running...");
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});