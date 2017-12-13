const Promise = require('bluebird');
const mongoose = require('mongoose');
const uuid = require('uuid');

mongoose.Promise = Promise;

mongoose.connect(process.env.MONGO_CONN, { useMongoClient: true });

const db = mongoose.connection;

db.once('open', () => {
    console.log('mongoose connected to ' + process.env.MONGO_CONN);
});

const jobSchema = mongoose.Schema({
    id: String,
    request: String,
    response: String,
    progress: Number,
    startTime: Number,
    endTime: Number
});

const Job = mongoose.model('Job', jobSchema);

module.exports.createJob = request => {
    const id = uuid.v4();

    const job = new Job({
        id,
        request,
        startTime: Date.now(),
        progress: 0
    });

    return job.save().then(() => id);
};
