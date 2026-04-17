// In your auth routes file
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.json({ exists: true, message: 'Email already registered' });
    }
    
    return res.json({ exists: false, message: 'Email available' });
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});