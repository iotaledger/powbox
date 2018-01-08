const moment = require('moment');

const { RateLimiter } = require('../common/db');
const { validateJwt } = require('./tokens');

const errors = {
    RL01: 'Rate Limit exceeded. Please wait and try again',
    RL02: 'Invalid or expired token.'
};

const defaultRateLimiterOptions = {
    maxRequests: 5,
    per: { minutes: 1 }
};

/**
 * type RateLimiterOptions = {
 *      maxRequests: number,
 *      per: moment.Duration,
 * }
 *
 * @param RateLimiterOptions options Defaults to 5 requests per minute
 */
module.exports = (options = defaultRateLimiterOptions) => {
    const { maxRequests, per } = options;
    const limitDuration = moment.duration(per);

    const startNewLimitPeriod = async ipAddress => {
        const now = moment();
        const newLimit = new RateLimiter({
            ipAddress,
            count: 1,
            limit: maxRequests,
            lastRequest: now.toISOString(),
            firstRequest: now.toISOString(),
            expires: now.add(limitDuration)
        });

        await newLimit.save();

        return true;
    };

    const checkRateLimit = async ipAddress => {
        const limit = await RateLimiter.findOne({ ipAddress }).sort('-expires');

        // New limit required (previous limit expired)
        if (!limit || moment() > moment(limit.expires)) {
            await startNewLimitPeriod(ipAddress);

            return true;
        }

        // Rate limit exceeded
        if (limit.count >= limit.limit) {
            return false;
        }

        // Update count and proceed
        await limit.update({ count: limit.count + 1, lastRequest: moment().toISOString() }).exec();

        return true;
    };

    return async (req, res, next) => {
        if (req.headers.authorization) {
            if (validateJwt(req.headers.authorization)) {
                // Token is OK - proceed
                return next();
            }

            // Invalid token - block
            const code = 'RL02';

            res.status(401);
            return res.json({ code, message: errors[code] });
        }

        if (await checkRateLimit(req.ip)) {
            // Rate limit not yet reached - proceed
            return next();
        }

        // Rate limit exceeded - block
        const code = 'RL01';

        res.status(401);
        return res.json({ code, message: errors[code] });
    };
};
