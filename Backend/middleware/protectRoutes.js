// Middleware to protect routes that require authentication
const protectRoutes = (req, res, next) => {
  // If not authenticated, return 401 Unauthorized
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  return next();
  
  
};

export default protectRoutes; 