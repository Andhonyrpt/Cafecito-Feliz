import createRateLimiter from '../../src/middlewares/rateLimit.js';
import { makeNext, makeReq, makeRes } from '../helpers/express.js';

describe('rateLimit middleware', () => {
    it('allows requests until the limit is exceeded', async () => {
        const limiter = createRateLimiter({
            windowMs: 1000,
            max: 2,
            message: 'Too many requests',
            keyGenerator: () => 'test-key'
        });

        const res1 = makeRes();
        const next1 = makeNext();
        await limiter(makeReq(), res1, next1);

        const res2 = makeRes();
        const next2 = makeNext();
        await limiter(makeReq(), res2, next2);

        const res3 = makeRes();
        const next3 = makeNext();
        await limiter(makeReq(), res3, next3);

        expect(next1).toHaveBeenCalledTimes(1);
        expect(next2).toHaveBeenCalledTimes(1);
        expect(res3.status).toHaveBeenCalledWith(429);
        expect(res3.json).toHaveBeenCalledWith({ message: 'Too many requests' });
        expect(next3).not.toHaveBeenCalled();
    });
});
