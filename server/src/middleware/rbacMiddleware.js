export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

export const checkRequestOwnership = async (req, res, next) => {
  // If student, ensure req.user._id matches request.userId
  // If staff/HOD, ensure user's department matches request department or user is assigned
  // If admin, grant access
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  if (user.role === 'ADMIN') return next();

  // The actual request object check will be performed in controllers where req.request is loaded
  next();
};
