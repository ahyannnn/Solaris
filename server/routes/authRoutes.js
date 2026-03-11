const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers.js");
const authMiddleware= require('../middleware/authMiddleware.js');

/*
  Route for user registration
*/
router.post("/register", authController.register);

/*
  Route for email and password login
*/
router.post("/login", authMiddleware.verifyToken, authController.login);

/*
  Route for Google authentication
*/
router.post("/google-login", authController.googleLogin);

router.post("/google-register", authController.googleRegister);



/*
  Route for reset password
*/
router.post("/reset-password", authController.resetPassword);

module.exports = router;