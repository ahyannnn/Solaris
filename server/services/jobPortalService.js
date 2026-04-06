// services/jobPortalService.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

class JobPortalService {
  constructor() {
    this.connection = null;
    this.Application = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if already connected
      if (this.isConnected && this.connection) {
        console.log('Already connected to Job Portal Database');
        return true;
      }

      // Connect to job portal database - REMOVED deprecated options
      const jobPortalURI = process.env.JOB_PORTAL_MONGODB_URI || 'mongodb+srv://testuser:admin123@solaris-collab.kegxe3g.mongodb.net/job-portal?retryWrites=true&w=majority';
      
      // Create connection WITHOUT deprecated options
      this.connection = mongoose.createConnection(jobPortalURI);
      
      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        this.connection.once('open', () => {
          console.log('Connected to Job Portal Database');
          this.isConnected = true;
          resolve();
        });
        
        this.connection.on('error', (err) => {
          console.error('Job Portal Database connection error:', err);
          reject(err);
        });
      });

      // Define Application schema (matching your existing schema)
      const ApplicationSchema = new mongoose.Schema({
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        personalInfo: {
          fullName: String,
          email: String,
          phone: String,
          address: String,
          dateOfBirth: Date,
          position: String
        },
        resume: {
          filename: String,
          path: String,
          originalName: String
        },
        status: {
          type: String,
          enum: ['pending', 'interview_scheduled', 'hired', 'rejected', 'imported'],
          default: 'pending'
        },
        interviewSchedule: {
          date: Date,
          time: String,
          location: String,
          notes: String
        },
        adminNotes: String,
        submittedAt: {
          type: Date,
          default: Date.now
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      });

      this.Application = this.connection.model('Application', ApplicationSchema);
      return true;
      
    } catch (error) {
      console.error('Error connecting to Job Portal Database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async getHiredApplicants() {
    try {
      if (!this.Application) {
        await this.connect();
      }
      
      const hiredApplicants = await this.Application.find({ 
        status: 'hired' 
      }).sort({ updatedAt: -1 });
      
      return hiredApplicants;
    } catch (error) {
      console.error('Error fetching hired applicants:', error);
      throw error;
    }
  }

  async getApplicantById(applicantId) {
    try {
      if (!this.Application) {
        await this.connect();
      }
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new Error('Invalid applicant ID format');
      }
      
      const applicant = await this.Application.findById(applicantId);
      return applicant;
    } catch (error) {
      console.error('Error fetching applicant:', error);
      throw error;
    }
  }

  async updateApplicantStatus(applicantId, newStatus) {
    try {
      if (!this.Application) {
        await this.connect();
      }
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new Error('Invalid applicant ID format');
      }
      
      const updated = await this.Application.findByIdAndUpdate(
        applicantId,
        { 
          status: newStatus,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      return updated;
    } catch (error) {
      console.error('Error updating applicant status:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.isConnected = false;
      this.connection = null;
      this.Application = null;
      console.log('Disconnected from Job Portal Database');
    }
  }
}

module.exports = new JobPortalService();