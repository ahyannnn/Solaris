const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// Create Google OAuth client using the client ID from environment variables
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


/*
  EMAIL AND PASSWORD LOGIN
  This function authenticates a user using their email and password.
*/
exports.login = async (req, res) => {
  try {

    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if a user with the provided email exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // Create a JWT token for authenticated access
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    // Return login success response
    res.json({
      message: "Login successful",
      token: token,
      user: user
    });

  } catch (error) {

    // Handle unexpected errors
    res.status(500).json({
      error: error.message
    });

  }
};


/*
  GOOGLE LOGIN
  This function verifies the Google ID token sent from the frontend.
  If the user does not exist in the database, a new account is created.
*/
exports.googleLogin = async (req, res) => {

  try {

    // Get Google ID token from request
    const { token } = req.body;

    // Verify the token using Google OAuth client
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    // Extract user information from Google payload
    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    // Check if user already exists
    let user = await User.findOne({ email });

    // If the user does not exist, create a new user
    if (!user) {

      user = new User({
        fullName: name,
        email: email,
        provider: "google",
        googleId: googleId,
        role: "user"
      });

      await user.save();
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    // Send success response
    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: user
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};