// server/controllers/applicationController.js
const multer = require('multer');
const path = require('path');
const Application = require('../models/Application');
const githubService = require('../services/githubService');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.apk') {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed'));
    }
  }
});

// Get all applications
const getApplications = async (req, res) => {
  try {
    const apps = await Application.find()
      .sort({ releaseDate: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      apps
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// Get latest published application
const getLatestPublished = async (req, res) => {
  try {
    const app = await Application.findOne({ status: 'published' })
      .sort({ releaseDate: -1 })
      .select('-__v');

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'No published application found'
      });
    }

    res.status(200).json({
      success: true,
      app
    });
  } catch (error) {
    console.error('Error fetching latest published app:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest application'
    });
  }
};

// server/controllers/applicationController.js - Updated createApplication

const createApplication = async (req, res) => {
  try {
    const { version, releaseNotes, status } = req.body;

    // Validate
    if (!version) {
      return res.status(400).json({
        success: false,
        message: 'Version is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'APK file is required'
      });
    }

    // Check if version already exists in DB
    const existingApp = await Application.findOne({ version });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'Version already exists'
      });
    }

    // Clean version - remove spaces and special characters
    const cleanVersion = version.replace(/\s+/g, '').replace(/[^a-zA-Z0-9.-]/g, '');
    const tagName = `v${cleanVersion}`;
    const releaseName = `Version ${cleanVersion}`;
    const isDraft = status !== 'published';
    const isPrerelease = false;

    console.log(`📦 Creating/Getting release for ${tagName}...`);

    // Get or create release with better error handling
    let release;
    try {
      release = await githubService.getOrCreateRelease(
        tagName,
        releaseName,
        isDraft,
        isPrerelease
      );
    } catch (error) {
      // Log the full error
      console.error('❌ GitHub Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Return a user-friendly error
      return res.status(400).json({
        success: false,
        message: `GitHub API Error: ${error.response?.data?.message || error.message}`,
        details: error.response?.data
      });
    }

    console.log(`✅ Release ID: ${release.id}`);

    // Upload APK
    const fileName = `app-${cleanVersion}.apk`;
    console.log(`📤 Uploading ${fileName} (${(req.file.size / (1024 * 1024)).toFixed(2)}MB)...`);

    let asset;
    try {
      asset = await githubService.uploadAsset(
        release.id,
        req.file.buffer,
        fileName
      );
    } catch (error) {
      console.error('❌ Upload Error:', error.response?.data || error.message);
      return res.status(400).json({
        success: false,
        message: `Upload failed: ${error.response?.data?.message || error.message}`
      });
    }

    console.log(`✅ Upload complete: ${asset.browser_download_url}`);

    // If status is 'published', unpublish all other published apps
    if (status === 'published') {
      await Application.updateMany(
        { status: 'published' },
        { status: 'draft' }
      );
    }

    // Create application record
    const app = new Application({
      version: cleanVersion,
      apkUrl: asset.browser_download_url,
      fileName: fileName,
      releaseNotes: releaseNotes || '',
      status: status || 'draft',
      releaseDate: new Date(),
      githubReleaseId: release.id,
      githubAssetId: asset.id
    });

    await app.save();

    res.status(201).json({
      success: true,
      message: 'Application uploaded successfully',
      app
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create application'
    });
  }
};
// Update an application
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { version, releaseNotes, status } = req.body;

    const app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check version uniqueness if changed
    if (version && version !== app.version) {
      const existingApp = await Application.findOne({
        version,
        _id: { $ne: id }
      });
      if (existingApp) {
        return res.status(400).json({
          success: false,
          message: 'Version already exists'
        });
      }
    }

    // If status is 'published', unpublish all other published apps
    if (status === 'published') {
      await Application.updateMany(
        { status: 'published', _id: { $ne: id } },
        { status: 'draft' }
      );
    }

    // Handle version change - create new release
    if (version && version !== app.version) {
      const oldTag = `v${app.version}`;
      const newTag = `v${version}`;

      // Get old release
      const oldRelease = await githubService.getReleaseByTag(oldTag);
      if (oldRelease) {
        // Delete old asset
        const assets = await githubService.getReleaseAssets(oldRelease.id);
        const oldAsset = assets.find(a => a.id === app.githubAssetId);
        if (oldAsset) {
          await githubService.deleteAsset(oldAsset.id);
        }
      }

      // Create new release
      const newRelease = await githubService.getOrCreateRelease(
        newTag,
        `Version ${version}`,
        status !== 'published',
        false
      );

      // Upload new file if provided
      if (req.file) {
        const fileName = `app-${version}.apk`;
        const asset = await githubService.uploadAsset(
          newRelease.id,
          req.file.buffer,
          fileName
        );
        app.apkUrl = asset.browser_download_url;
        app.fileName = fileName;
        app.githubAssetId = asset.id;
        app.githubReleaseId = newRelease.id;
      }
    } else if (req.file) {
      // Same version, just update asset
      const release = await githubService.getReleaseByTag(`v${app.version}`);
      if (release) {
        // Delete old asset
        const assets = await githubService.getReleaseAssets(release.id);
        const oldAsset = assets.find(a => a.id === app.githubAssetId);
        if (oldAsset) {
          await githubService.deleteAsset(oldAsset.id);
        }

        // Upload new asset
        const fileName = `app-${app.version}.apk`;
        const asset = await githubService.uploadAsset(
          release.id,
          req.file.buffer,
          fileName
        );
        app.apkUrl = asset.browser_download_url;
        app.fileName = fileName;
        app.githubAssetId = asset.id;
      }
    }

    // Update fields
    if (version) app.version = version;
    if (releaseNotes !== undefined) app.releaseNotes = releaseNotes;
    if (status) app.status = status;

    await app.save();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      app
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update application'
    });
  }
};

// Delete an application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete from GitHub
    try {
      // Get release by tag
      const release = await githubService.getReleaseByTag(`v${app.version}`);
      if (release) {
        // Delete asset
        const assets = await githubService.getReleaseAssets(release.id);
        const asset = assets.find(a => a.id === app.githubAssetId);
        if (asset) {
          await githubService.deleteAsset(asset.id);
        }
        // Delete release if no more assets
        const remainingAssets = await githubService.getReleaseAssets(release.id);
        if (remainingAssets.length === 0) {
          await githubService.deleteRelease(release.id);
        }
      }
    } catch (error) {
      console.warn('⚠️ GitHub cleanup error:', error.message);
      // Continue with DB deletion even if GitHub cleanup fails
    }

    await app.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application'
    });
  }
};

// Publish an application
const publishApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Unpublish all other published apps
    await Application.updateMany(
      { status: 'published', _id: { $ne: id } },
      { status: 'draft' }
    );

    // Publish the release on GitHub
    try {
      const release = await githubService.getReleaseByTag(`v${app.version}`);
      if (release && release.draft) {
        await githubService.publishRelease(release.id);
      }
    } catch (error) {
      console.warn('⚠️ GitHub publish error:', error.message);
      // Continue even if GitHub publish fails
    }

    app.status = 'published';
    app.releaseDate = new Date();
    await app.save();

    res.status(200).json({
      success: true,
      message: 'Application published successfully',
      app
    });
  } catch (error) {
    console.error('Error publishing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish application'
    });
  }
};

module.exports = {
  getApplications,
  getLatestPublished,
  createApplication,
  updateApplication,
  deleteApplication,
  publishApplication,
  uploadMiddleware: upload.single('apkFile')
};