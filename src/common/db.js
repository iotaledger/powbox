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
        progress: String,
        endTime: Number
    },
    {
        timestamps: true
    }
);

const Job = mongoose.model('Job', jobSchema);

module.exports.createJob = async request => {
    const job = new Job({
        request,
        progress: '0'
    });

    await job.save();

    return job.id;
};

module.exports.updateJob = async (_id, progress) => {
    await Job.findOneAndUpdate({ _id }, { progress });

    return;
};

module.exports.finishJob = async (_id, response) => {
    await Job.findOneAndUpdate({ _id }, { progress: '100', response });

    return;
};
