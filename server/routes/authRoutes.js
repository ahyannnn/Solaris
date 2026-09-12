const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers.js");
const authMiddleware = require('../middleware/authMiddleware.js');
// Strict brute-force cap on credential/password endpoints.
const { authLimiter } = require("../middleware/rateLimitMiddleware.js");

/*
  Route for user registration
*/
router.post("/register", authLimiter, authController.register);

/*
  Route for email and password login
*/
router.post("/login", authLimiter, authController.login);
router.get('/lock-status/:email', authController.checkLockStatus);

/*
  Current authenticated user (header/photo refresh, all roles)
*/
router.get("/me", authMiddleware.verifyToken, authController.getMe);

/*
  Route for Google authentication
*/
router.post("/google-login", authLimiter, authController.googleLogin);
router.post("/google-register", authLimiter, authController.googleRegister);

/*
  Route for reset password
*/
router.post("/reset-password", authLimiter, authController.resetPassword);

/*
  Route to check if email already exists
*/
router.post("/check-email", authLimiter, authController.checkEmail);



module.exports = router;