// Middleware to protect routes that require authentication
const protectRoutes = (req, res, next) => {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If not authenticated, return 401 Unauthorized
  res.status(401).json({
    success: false,
    message: 'Not authorized to access this route'
  });
};

export default protectRoutes; 