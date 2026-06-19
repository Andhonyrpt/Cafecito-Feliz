const createRateLimiter = ({ windowMs, max, message, keyGenerator }) => {
    const hits = new Map();

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        const current = hits.get(key);

        if (!current || now > current.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        current.count += 1;

        if (current.count > max) {
            return res.status(429).json({ message });
        }

        return next();
    };
};

export const loginRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Try again later.',
    keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.body?.employeeId || '').toUpperCase()}`
});

export const verifyPinRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many PIN attempts. Try again later.',
    keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.body?.employeeId || req.user?.employeeId || '').toUpperCase()}`
});

export const checkRoleRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many role checks. Try again later.',
    keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.params?.employeeId || '').toUpperCase()}`
});

export const refreshRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many refresh attempts. Try again later.',
    keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.body?.refreshToken || '')}`
});

export default createRateLimiter;
