// middleware/maintenanceMiddleware.js
const Maintenance = require('../models/Maintenance');

const maintenanceMiddleware = async (req, res, next) => {
  try {
    // ✅ FIRST: Skip for ALL maintenance API routes (not just status)
    if (req.path.startsWith('/api/maintenance')) {
      return next();
    }
    
    // Get maintenance settings
    let maintenance = await Maintenance.findOne();
    
    // If no maintenance record exists, create default
    if (!maintenance) {
      maintenance = new Maintenance();
      await maintenance.save();
    }
    
    // If not under maintenance, proceed normally
    if (!maintenance.isUnderMaintenance) {
      return next();
    }
    
    // ✅ CRITICAL: Check if user is admin FIRST - Admins ALWAYS bypass maintenance
    if (req.user && req.user.role === 'admin') {
      console.log('✅ Admin access granted during maintenance');
      return next();
    }
    
    // Check if route is whitelisted
    const isWhitelisted = maintenance.whitelistedRoutes && maintenance.whitelistedRoutes.some(route => 
      req.path.startsWith(route)
    );
    
    if (isWhitelisted) {
      return next();
    }
    
    // Check if user IP is allowed
    const clientIP = req.ip || 
                     req.connection?.remoteAddress || 
                     req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.socket?.remoteAddress;
    
    const isAllowedIP = maintenance.allowedIPs && maintenance.allowedIPs.includes(clientIP);
    
    if (isAllowedIP) {
      console.log(`✅ IP ${clientIP} is whitelisted, access granted`);
      return next();
    }
    
    // Check if user role is allowed (for engineer/customer during maintenance)
    const userRole = req.user?.role;
    const isAllowedRole = maintenance.allowedRoles && maintenance.allowedRoles.includes(userRole);
    
    if (isAllowedRole) {
      return next();
    }
    
    // For API requests, return JSON
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({
        success: false,
        message: maintenance.message,
        title: maintenance.title,
        isUnderMaintenance: true,
        estimatedDuration: maintenance.estimatedDuration,
        contactEmail: maintenance.contactEmail,
        contactPhone: maintenance.contactPhone
      });
    }
    
    // For page requests, return HTML maintenance page
    return res.status(503).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${maintenance.title}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .maintenance-container {
              text-align: center;
              padding: 50px 40px;
              background: white;
              border-radius: 20px;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .maintenance-icon {
              font-size: 80px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 32px;
              color: #2c3e50;
              margin-bottom: 16px;
            }
            p {
              font-size: 16px;
              color: #7f8c8d;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .contact-info {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ecf0f1;
            }
            .contact-info a {
              color: #3498db;
              text-decoration: none;
            }
            @media (max-width: 600px) {
              .maintenance-container { padding: 30px 20px; }
              h1 { font-size: 24px; }
              .maintenance-icon { font-size: 60px; }
            }
          </style>
        </head>
        <body>
          <div class="maintenance-container">
            <div class="maintenance-icon">🔧</div>
            <h1>${maintenance.title}</h1>
            <p>${maintenance.message}</p>
            <div class="contact-info">
              <p>Need assistance? Contact us at <a href="mailto:${maintenance.contactEmail}">${maintenance.contactEmail}</a></p>
            </div>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Maintenance middleware error:', error);
    next();
  }
};

module.exports = maintenanceMiddleware;