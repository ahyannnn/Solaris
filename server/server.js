// server/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force IPv4 DNS resolution (helps with ECONNREFUSED SRV errors)
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS

// MongoDB Connection
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 }); // force IPv4
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.log("Attempted URI:", process.env.MONGO_URI);
  }
};
connectMongo();

// Routes
const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const iotRoutes = require("./routes/sensorRoutes");
const reportRoutes = require("./routes/reportRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const installationRoutes = require("./routes/installationRoutes");
const emailRoutes = require("./routes/emailRoutes");
const clientRoutes = require('./routes/clientRoutes');

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');

// New Routes
const freeQuoteRoutes = require('./routes/freeQuoteRoutes');
const preAssessmentRoutes = require('./routes/preAssessmentRoutes');

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/sensor", iotRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/installation", installationRoutes);
app.use("/api/email", emailRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/free-quotes', freeQuoteRoutes);
app.use('/api/pre-assessments', preAssessmentRoutes);
app.use('/api/admin', adminRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("Solar IoT TPS API is running...");
});

// Error handling middleware (optional - add at the end)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));