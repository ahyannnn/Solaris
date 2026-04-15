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
// server/server.js - Add this middleware
app.use((req, res, next) => {
  // Disable COOP for development to allow popup interactions
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});
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
const receiptRoutes = require("./routes/receiptRoutes");
const iotRoutes = require("./routes/sensorRoutes");

const emailRoutes = require("./routes/emailRoutes");
const clientRoutes = require('./routes/clientRoutes');
const solarInvoiceRoutes = require('./routes/solarInvoiceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
// New Routes
const freeQuoteRoutes = require('./routes/freeQuoteRoutes');
const preAssessmentRoutes = require('./routes/preAssessmentRoutes');
const iotDataRoutes = require('./routes/iotDataRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const jobPortalRoutes = require('./routes/jobPortalRoutes');
// Use new routes
app.use('/api/schedules', scheduleRoutes);
app.use(maintenanceMiddleware);
app.use('/api/maintenance', maintenanceRoutes);
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/job-portal", jobPortalRoutes);
app.use("/api/sensor", iotRoutes);
app.use("/api/iot-data", iotDataRoutes);
app.use('/api/payments', paymentRoutes);
app.use("/api/email", emailRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/free-quotes', freeQuoteRoutes);
app.use('/api/pre-assessments', preAssessmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/solar-invoices', solarInvoiceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/uploads', express.static('uploads'));

app.get('/maintenance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
});
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