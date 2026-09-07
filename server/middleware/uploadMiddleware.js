const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET;
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️ Cloudinary not configured, using local storage only');
}

// Ensure upload directories exist (for local storage)
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

// Size limits based on file type
const getFileSizeLimit = (file) => {
  if (file.fieldname === 'sitePhotos' || file.fieldname === 'photos') {
    return 15 * 1024 * 1024; // 15MB for photos
  } else if (file.fieldname === 'report' || file.fieldname === 'quotation' || file.fieldname === 'document') {
    return 25 * 1024 * 1024; // 25MB for documents
  } else {
    return 10 * 1024 * 1024; // 10MB default
  }
};

// Multer configuration with memory storage
const memoryStorage = multer.memoryStorage();

// Create multer instance
const upload = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // Default 10MB, will be overridden by getFileSizeLimit in controller if needed
  },
  fileFilter: fileFilter
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder, publicId, mimeType) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `solar-tps/${folder}`,
      public_id: publicId,
      resource_type: mimeType === 'application/pdf' ? 'raw' : 'image'
    };

    // Add transformations for images
    if (mimeType.startsWith('image/')) {
      uploadOptions.transformation = [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Helper function to save file locally
const saveLocally = async (file, folder) => {
  return new Promise((resolve, reject) => {
    let uploadPath = `uploads/${folder}/`;
    ensureDirectoryExists(uploadPath);
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${name}-${uniqueSuffix}${ext}`;
    const fullPath = path.join(uploadPath, filename);
    
    // Write file to disk
    fs.writeFile(fullPath, file.buffer, (err) => {
      if (err) reject(err);
      else {
        resolve({
          url: `/uploads/${folder}/${filename}`,
          publicId: filename,
          filename: filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          storageType: 'local',
          path: fullPath
        });
      }
    });
  });
};

// Process uploaded file (upload to Cloudinary if configured, otherwise save locally)
const processUpload = async (req, file, folder, customPublicId = null) => {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    // Upload to Cloudinary
    try {
      const publicId = customPublicId || `${Date.now()}-${file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-')}`;
      const result = await uploadToCloudinary(file.buffer, folder, publicId, file.mimetype);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        filename: result.public_id.split('/').pop(),
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storageType: 'cloudinary'
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local storage if Cloudinary fails
      console.log('Falling back to local storage...');
      return await saveLocally(file, folder);
    }
  } else {
    // Save locally
    return await saveLocally(file, folder);
  }
};

// Helper function to delete file from storage
const deleteFile = async (fileUrl, publicId = null, storageType = null) => {
  try {
    if (isCloudinaryConfigured() && (publicId || storageType === 'cloudinary')) {
      // Delete from Cloudinary
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log('Deleted from Cloudinary:', publicId);
      }
    } else if (fileUrl && fileUrl.startsWith('/uploads/')) {
      // Delete local file
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted local file:', filePath);
      }
    }
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to get full file URL
const getFileUrl = (req, fileInfo) => {
  if (fileInfo.storageType === 'cloudinary') {
    return fileInfo.url;
  } else {
    // Local file
    return `${req.protocol}://${req.get('host')}${fileInfo.url}`;
  }
};

// Avatar upload (profile photos): memory storage, images only, 2MB max.
// Wrapped so multer errors return JSON instead of HTML.
const avatarUploadMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed'), false);
  }
}).single('photo');

const avatarUploadHandler = (req, res, next) => {
  avatarUploadMulter(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    next();
  });
};

// Export all functions and the upload instance
module.exports = { 
  upload,
  avatarUploadHandler,
  processUpload,
  getFileUrl, 
  deleteFile,
  isCloudinaryConfigured
};