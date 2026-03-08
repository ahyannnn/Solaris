const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

/*
  Route for user registration
*/
router.post("/register", authController.register);

/*
  Route for email and password login
*/
router.post("/login", authController.login);

/*
  Route for Google authentication
*/
router.post("/google-login", authController.googleLogin);

module.exports = router;