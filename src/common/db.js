const mongoose = require('mongoose');
const uuid = require('uuid');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_CONN, { useMongoClient: true });

const db = mongoose.connection;

db.once('open', () => {
    console.log('mongoose connected to ' + process.env.MONGO_CONN);
});

const jobSchema = mongoose.Schema(
    {
        request: String,
        response: String,
        progress: String
    },
    {
        timestamps: true
    }
);

const Job = mongoose.model('Job', jobSchema);

module.exports.job = {
    create: async request => {
        const job = new Job({
            request,
            progress: '0'
        });

        await job.save();

        return job.id;
    },

    get: async id => {
        const job = await Job.findById(id);

        return job;
    },

    update: async (_id, progress) => {
        await Job.findOneAndUpdate({ _id }, { progress });
    },

    complete: async (_id, response) => {
        await Job.findOneAndUpdate({ _id }, { progress: '100', response });
    }
};

const rateLimiterSchema = mongoose.Schema(
    {
        ipAddress: String,
        count: Number,
        limit: Number,
        lastRequest: Date,
        firstRequest: Date,
        expires: Date
    },
    {
        collection: 'ratelimiter'
    }
);

module.exports.RateLimiter = mongoose.model('RateLimit', rateLimiterSchema);

module.exports.limit = async (ipAddress, token) => {
    const data = await RateLimiter.findOne({ ipAddress });

    return false;
};
