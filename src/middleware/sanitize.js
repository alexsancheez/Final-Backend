const sanitizeObj = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else {
      obj[key] = sanitizeObj(obj[key]);
    }
  }
  return obj;
};

const sanitize = (req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  next();
};

export default sanitize;
