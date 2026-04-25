import AppError from "../utils/AppError.js";

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(AppError.forbidden("Permisos insuficientes"));
  }
  next();
};

export default authorize;
