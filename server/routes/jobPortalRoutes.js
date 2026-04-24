// routes/jobPortalRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/Users');
const jobPortalService = require('../services/jobPortalService');
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const { verifyToken } = authMiddleware;

// Helper function to normalize email to lowercase
const normalizeEmail = (email) => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

// ============ ADMIN ROUTES ============
// Get all hired applicants from job portal
router.get('/hired-applicants', verifyToken, admin, async (req, res) => {
  try {
    await jobPortalService.connect();
    const hiredApplicants = await jobPortalService.getHiredApplicants();
    
    // Check which applicants are already imported
    const transformedApplicants = await Promise.all(hiredApplicants.map(async (applicant) => {
      // Normalize email for checking
      const normalizedEmail = normalizeEmail(applicant.personalInfo?.email);
      
      // Check if already imported by metadata or email
      let existingUser = await User.findOne({ 
        'metadata.originalApplicantId': applicant._id.toString()
      });
      
      if (!existingUser && normalizedEmail) {
        existingUser = await User.findOne({ 
          email: normalizedEmail 
        });
      }
      
      return {
        id: applicant._id,
        fullName: applicant.personalInfo?.fullName || 'N/A',
        email: normalizedEmail || 'N/A', // Return normalized email
        phone: applicant.personalInfo?.phone || 'N/A',
        position: applicant.personalInfo?.position || 'N/A',
        address: applicant.personalInfo?.address || '',
        dateOfBirth: applicant.personalInfo?.dateOfBirth,
        submittedAt: applicant.submittedAt,
        hasResume: !!applicant.resume?.filename,
        resumeFilename: applicant.resume?.filename,
        imported: !!existingUser
      };
    }));
    
    res.json({
      success: true,
      applicants: transformedApplicants,
      count: transformedApplicants.length
    });
  } catch (error) {
    console.error('Error fetching hired applicants:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch hired applicants',
      error: error.message 
    });
  }
});

// Import single engineer from job portal
router.post('/import-engineer/:applicantId', verifyToken, admin, async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { role = 'engineer' } = req.body;
    
    await jobPortalService.connect();
    const applicant = await jobPortalService.getApplicantById(applicantId);
    
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }
    
    if (applicant.status !== 'hired') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only hired applicants can be imported as engineers' 
      });
    }
    
    // Check if already imported by metadata
    const existingUser = await User.findOne({ 
      'metadata.originalApplicantId': applicantId
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Applicant already imported',
        existingUser: {
          id: existingUser._id,
          name: existingUser.fullName,
          email: existingUser.email
        }
      });
    }
    
    // Normalize email to lowercase
    const normalizedEmail = normalizeEmail(applicant.personalInfo.email);
    
    // Check if email already exists in system (using normalized email)
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists in system. User may have been added manually.',
        existingUser: {
          id: emailExists._id,
          name: emailExists.fullName,
          email: emailExists.email
        }
      });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const fullName = applicant.personalInfo.fullName || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create new engineer user with normalized email
    const newUser = new User({
      email: normalizedEmail, // Store as lowercase
      passwordHash: hashedPassword, // Changed from 'password' to 'passwordHash' to match your schema
      role: role,
      fullName: fullName,
      isActive: true,
      clientInfo: {
        firstName: firstName,
        lastName: lastName,
        contactNumber: applicant.personalInfo.phone || '',
        email: normalizedEmail, // Store as lowercase
        address: applicant.personalInfo.address || '',
        birthday: applicant.personalInfo.dateOfBirth || null,
        position: applicant.personalInfo.position || ''
      },
      metadata: {
        importedFrom: 'job-portal',
        originalApplicantId: applicantId,
        importDate: new Date(),
        position: applicant.personalInfo.position,
        hadResume: !!applicant.resume?.filename
        // Removed tempPassword from metadata for security
      }
    });
    
    await newUser.save();
    
    // Update applicant status in job portal to mark as imported
    await jobPortalService.updateApplicantStatus(applicantId, 'imported');
    
    // TODO: Send email with temporary password
    // await sendWelcomeEmail(normalizedEmail, tempPassword, fullName);
    
    // Log the temporary password for development (remove in production)
    console.log(`✅ Imported engineer: ${fullName}`);
    console.log(`📧 Email: ${normalizedEmail}`);
    console.log(`🔑 Temporary password: ${tempPassword}`);
    
    res.json({
      success: true,
      message: 'Engineer imported successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error('Error importing engineer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk import multiple engineers
router.post('/bulk-import', verifyToken, admin, async (req, res) => {
  try {
    const { applicantIds, role = 'engineer' } = req.body;
    
    if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No applicant IDs provided' 
      });
    }
    
    await jobPortalService.connect();
    const results = { 
      successful: [], 
      failed: [], 
      skipped: [],
      total: applicantIds.length 
    };
    
    for (const applicantId of applicantIds) {
      try {
        const applicant = await jobPortalService.getApplicantById(applicantId);
        
        if (!applicant) {
          results.failed.push({ applicantId, reason: 'Applicant not found' });
          continue;
        }
        
        if (applicant.status !== 'hired') {
          results.skipped.push({ 
            applicantId, 
            name: applicant.personalInfo?.fullName,
            reason: 'Applicant is not marked as hired' 
          });
          continue;
        }
        
        // Check if already imported
        const existing = await User.findOne({ 'metadata.originalApplicantId': applicantId });
        if (existing) {
          results.skipped.push({ 
            applicantId, 
            name: applicant.personalInfo?.fullName, 
            reason: 'Already imported' 
          });
          continue;
        }
        
        // Normalize email to lowercase
        const normalizedEmail = normalizeEmail(applicant.personalInfo.email);
        
        // Check if email exists
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) {
          results.skipped.push({ 
            applicantId, 
            name: applicant.personalInfo?.fullName, 
            reason: 'Email already exists in system' 
          });
          continue;
        }
        
        // Create new user
        const tempPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const fullName = applicant.personalInfo.fullName || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const newUser = new User({
          email: normalizedEmail, // Store as lowercase
          passwordHash: hashedPassword, // Changed from 'password' to 'passwordHash'
          role: role,
          fullName: fullName,
          isActive: true,
          clientInfo: {
            firstName: firstName,
            lastName: lastName,
            contactNumber: applicant.personalInfo.phone || '',
            email: normalizedEmail, // Store as lowercase
            address: applicant.personalInfo.address || '',
            birthday: applicant.personalInfo.dateOfBirth || null,
            position: applicant.personalInfo.position || ''
          },
          metadata: {
            importedFrom: 'job-portal',
            originalApplicantId: applicantId,
            importDate: new Date(),
            position: applicant.personalInfo.position,
            hadResume: !!applicant.resume?.filename
          }
        });
        
        await newUser.save();
        
        // Update applicant status
        await jobPortalService.updateApplicantStatus(applicantId, 'imported');
        
        results.successful.push({
          applicantId,
          name: fullName,
          email: normalizedEmail,
          userId: newUser._id,
          tempPassword: tempPassword // Only for response, not stored
        });
        
        console.log(`✅ Bulk imported: ${fullName} (${normalizedEmail})`);
        
      } catch (error) {
        results.failed.push({ 
          applicantId, 
          reason: error.message 
        });
      }
    }
    
    res.json({
      success: true,
      message: `Bulk import completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      results
    });
    
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get import statistics
router.get('/import-stats', verifyToken, admin, async (req, res) => {
  try {
    await jobPortalService.connect();
    
    const hiredApplicants = await jobPortalService.getHiredApplicants();
    
    // Count imported ones
    let importedCount = 0;
    for (const applicant of hiredApplicants) {
      const normalizedEmail = normalizeEmail(applicant.personalInfo?.email);
      const imported = await User.findOne({ 
        $or: [
          { 'metadata.originalApplicantId': applicant._id.toString() },
          { email: normalizedEmail }
        ]
      });
      if (imported) importedCount++;
    }
    
    res.json({
      success: true,
      stats: {
        totalHired: hiredApplicants.length,
        imported: importedCount,
        pending: hiredApplicants.length - importedCount
      }
    });
    
  } catch (error) {
    console.error('Error getting import stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get details of a specific applicant from job portal
router.get('/applicant/:applicantId', verifyToken, admin, async (req, res) => {
  try {
    const { applicantId } = req.params;
    
    await jobPortalService.connect();
    const applicant = await jobPortalService.getApplicantById(applicantId);
    
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }
    
    res.json({
      success: true,
      applicant: {
        id: applicant._id,
        fullName: applicant.personalInfo?.fullName || 'N/A',
        email: normalizeEmail(applicant.personalInfo?.email) || 'N/A', // Return normalized email
        phone: applicant.personalInfo?.phone || 'N/A',
        position: applicant.personalInfo?.position || 'N/A',
        address: applicant.personalInfo?.address || '',
        dateOfBirth: applicant.personalInfo?.dateOfBirth,
        submittedAt: applicant.submittedAt,
        updatedAt: applicant.updatedAt,
        status: applicant.status,
        hasResume: !!applicant.resume?.filename,
        resumeFilename: applicant.resume?.filename,
        resumePath: applicant.resume?.path,
        interviewSchedule: applicant.interviewSchedule,
        adminNotes: applicant.adminNotes
      }
    });
    
  } catch (error) {
    console.error('Error fetching applicant details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all imported engineers (users imported from job portal)
router.get('/imported-engineers', verifyToken, admin, async (req, res) => {
  try {
    const importedEngineers = await User.find({ 
      'metadata.importedFrom': 'job-portal',
      role: 'engineer'
    }).select('-passwordHash -password').sort({ 'metadata.importDate': -1 }); // Changed from '-password' to '-passwordHash'
    
    res.json({
      success: true,
      engineers: importedEngineers,
      count: importedEngineers.length
    });
    
  } catch (error) {
    console.error('Error fetching imported engineers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sync job portal status (update imported flag)
router.post('/sync-status', verifyToken, admin, async (req, res) => {
  try {
    await jobPortalService.connect();
    
    // Find all users imported from job portal
    const importedUsers = await User.find({ 
      'metadata.importedFrom': 'job-portal',
      'metadata.originalApplicantId': { $exists: true }
    });
    
    let synced = 0;
    let failed = 0;
    
    for (const user of importedUsers) {
      try {
        const applicantId = user.metadata.originalApplicantId;
        const applicant = await jobPortalService.getApplicantById(applicantId);
        
        if (applicant && applicant.status !== 'imported') {
          await jobPortalService.updateApplicantStatus(applicantId, 'imported');
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync applicant ${user.metadata.originalApplicantId}:`, error);
        failed++;
      }
    }
    
    res.json({
      success: true,
      message: `Sync completed: ${synced} updated, ${failed} failed`,
      synced,
      failed
    });
    
  } catch (error) {
    console.error('Error syncing status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this endpoint to fix existing imported users
router.post('/fix-existing-emails', verifyToken, admin, async (req, res) => {
  try {
    // Find all users imported from job portal
    const importedUsers = await User.find({ 
      'metadata.importedFrom': 'job-portal' 
    });
    
    let fixed = 0;
    const fixes = [];
    
    for (const user of importedUsers) {
      let needsSave = false;
      const originalEmail = user.email;
      const normalizedEmail = normalizeEmail(originalEmail);
      
      if (originalEmail !== normalizedEmail) {
        user.email = normalizedEmail;
        needsSave = true;
        fixes.push({
          id: user._id,
          name: user.fullName,
          oldEmail: originalEmail,
          newEmail: normalizedEmail
        });
      }
      
      // Also fix clientInfo.email if it exists
      if (user.clientInfo && user.clientInfo.email) {
        const originalClientEmail = user.clientInfo.email;
        const normalizedClientEmail = normalizeEmail(originalClientEmail);
        if (originalClientEmail !== normalizedClientEmail) {
          user.clientInfo.email = normalizedClientEmail;
          needsSave = true;
        }
      }
      
      // Ensure password is in the correct field
      if (user.password && !user.passwordHash) {
        user.passwordHash = user.password;
        user.password = undefined;
        needsSave = true;
      }
      
      if (needsSave) {
        await user.save();
        fixed++;
      }
    }
    
    res.json({
      success: true,
      message: `Fixed ${fixed} users`,
      fixes: fixes
    });
    
  } catch (error) {
    console.error('Error fixing emails:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;