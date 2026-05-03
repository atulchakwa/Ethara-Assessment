const rateLimit = new Map();

const rateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimit.has(key)) {
      rateLimit.set(key, { attempts: [], lastAttempt: now });
    }
    
    const record = rateLimit.get(key);
    
    if (now - record.lastAttempt > windowMs) {
      record.attempts = [];
    }
    
    if (record.attempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later'
      });
    }
    
    record.attempts.push(now);
    record.lastAttempt = now;
    next();
  };
};

const cleanup = () => {
  const now = Date.now();
  for (const [key, record] of rateLimit.entries()) {
    if (now - record.lastAttempt > 60 * 60 * 1000) {
      rateLimit.delete(key);
    }
  }
};

setInterval(cleanup, 60 * 60 * 1000);

module.exports = { rateLimiter };