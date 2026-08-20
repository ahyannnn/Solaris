// server/server.js

const http = require("http");
const { Server } = require("socket.io");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

require("dotenv").config();

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Disable COOP for development to allow popup interactions
app.use((req, res, next) => {
  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );

  res.setHeader(
    "Cross-Origin-Embedder-Policy",
    "unsafe-none"
  );

  next();
});

// ======================================================
// DNS
// ======================================================

// Force IPv4 DNS resolution
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

// ======================================================
// MONGODB CONNECTION
// ======================================================

const connectMongo = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI,
      {
        family: 4,
      }
    );

    console.log(
      "MongoDB connected successfully"
    );
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error.message
    );

    console.log(
      "Attempted URI:",
      process.env.MONGO_URI
    );
  }
};

connectMongo();

// ======================================================
// ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const iotRoutes = require("./routes/sensorRoutes");

const emailRoutes = require("./routes/emailRoutes");
const clientRoutes = require("./routes/clientRoutes");
const solarInvoiceRoutes = require("./routes/solarInvoiceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const fileRoutes = require("./routes/fileRoutes");

const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");
const maintenanceRoutes = require("./routes/maintenanceRoutes");

// Admin Routes
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const bankTransferRoutes = require("./routes/bankTransferRoutes");

// New Routes
const freeQuoteRoutes = require("./routes/freeQuoteRoutes");
const preAssessmentRoutes = require("./routes/preAssessmentRoutes");
const iotDataRoutes = require("./routes/iotDataRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const jobPortalRoutes = require("./routes/jobPortalRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ======================================================
// ROUTES
// ======================================================

app.use(
  "/api/schedules",
  scheduleRoutes
);

app.use(
  maintenanceMiddleware
);

app.use(
  "/api/maintenance",
  maintenanceRoutes
);

// API Routes

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/receipts",
  receiptRoutes
);

app.use(
  "/api/job-portal",
  jobPortalRoutes
);

app.use(
  "/api/sensor",
  iotRoutes
);

app.use(
  "/api/iot-data",
  iotDataRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/email",
  emailRoutes
);

app.use(
  "/api/clients",
  clientRoutes
);

app.use(
  "/api/free-quotes",
  freeQuoteRoutes
);

app.use(
  "/api/pre-assessments",
  preAssessmentRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/solar-invoices",
  solarInvoiceRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/payments/bank-transfer",
  bankTransferRoutes
);

app.use(
  "/api/audit",
  auditRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/files",
  fileRoutes
);

// Static uploads
app.use(
  "/uploads",
  express.static("uploads")
);

// ======================================================
// MAINTENANCE PAGE
// ======================================================

app.get(
  "/maintenance",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "public",
        "maintenance.html"
      )
    );
  }
);

// ======================================================
// TEST ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.send(
    "Solar IoT TPS API is running..."
  );
});

// ======================================================
// ERROR HANDLING
// ======================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "Error:",
      err
    );

    res.status(
      err.status || 500
    ).json({
      success: false,
      message:
        err.message ||
        "Internal Server Error",
    });
  }
);

// ======================================================
// HTTP SERVER
// ======================================================

const server =
  http.createServer(app);

// ======================================================
// SOCKET.IO SERVER
// ======================================================

const io = new Server(
  server,
  {
    cors: {
      origin: "*",
      methods: [
        "GET",
        "POST",
      ],
    },
  }
);

// ======================================================
// CONNECT SOCKET.IO TO socket.js
// ======================================================

// IMPORTANT:
// server.js is inside:
// backend/server/server.js
//
// socket.js is inside:
// backend/socket.js
//
// Therefore we use ../socket

const { setIO } =
  require("./socket");

setIO(io);

// ======================================================
// SOCKET CONNECTION
// ======================================================

io.on(
  "connection",
  (socket) => {
    console.log(
      "🔌 Socket connected:",
      socket.id
    );

    // --------------------------------------------------
    // USER JOINS PERSONAL ROOM
    // --------------------------------------------------

    socket.on(
      "joinUser",
      (userId) => {
        if (!userId) {
          console.log(
            "⚠️ joinUser called without userId"
          );

          return;
        }

        const room =
          `user:${userId}`;

        socket.join(room);

        console.log(
          `👤 User ${userId} joined ${room}`
        );
      }
    );

    // --------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔌 Socket disconnected:",
          socket.id,
          "Reason:",
          reason
        );
      }
    );
  }
);

// ======================================================
// PORT
// ======================================================

const PORT =
  process.env.PORT || 5000;

// IMPORTANT:
// Use server.listen(), NOT app.listen()
// because Socket.IO is attached to server.

server.listen(
  PORT,
  () => {
    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      "🔔 Socket.IO is ready"
    );
  }
);