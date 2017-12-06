const log = console.log;
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '../../.env')
});

const PubSub = require('@google-cloud/pubsub');
// const Datatore = require('@google-cloud/datastore');

const pubsub = PubSub({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_KEY_FILE
});

// const datastore = DataStore({});

const ccurl = require('ccurl.interface.js');
const {
    CCURL_PATH,
    INCOMING_JOBS_TOPIC,
    INCOMING_JOBS_SUBSCRIPTION,
    PROGRESS_JOBS_TOPIC,
    FINISHED_JOBS_TOPIC
} = process.env;

let progressJobsTopic;
let finishedJobsTopic;

async function failJob(err) {}

async function handleAttachToTangle(msg) {
    msg.ack();
    let data;

    try {
        data = JSON.parse(msg.data.toString());
    } catch (e) {
        log('Unable to parse message data: ', msg.data.toString());
        return;
    }

    const { trunkTransaction, branchTransaction, minWeightMagnitude, trytes } = data;
    const job = ccurl(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, CCURL_PATH);

    function publishJobProgress(err, progress) {
        log(progress);
        progressJobsTopic.publish(Buffer.from(JSON.stringify({ id: msg.id, progress })));
    }

    function publishJobComplete(err, res) {
        if (err) {
            log('Error: ', err);
            return;
        }

        finishedJobsTopic.publish(Buffer.from(JSON.stringify({ id: msg.id, res })));
        log('Job complete: ', res);
    }

    job.on('progress', publishJobProgress);
    job.on('done', publishJobComplete);
}

function handleError(err) {
    log(err);
}

async function init() {
    try {
        await pubsub.createTopic(INCOMING_JOBS_TOPIC);
        log(`Created topic ${INCOMING_JOBS_TOPIC}.`);
    } catch (e) {}

    try {
        await pubsub.createTopic(FINISHED_JOBS_TOPIC);
        log(`Created topic ${FINISHED_JOBS_TOPIC}.`);
    } catch (e) {}

    try {
        await pubsub.createTopic(PROGRESS_JOBS_TOPIC);
        log(`Created topic ${PROGRESS_JOBS_TOPIC}.`);
    } catch (e) {}

    finishedJobsTopic = pubsub.topic(FINISHED_JOBS_TOPIC).publisher();
    progressJobsTopic = pubsub.topic(PROGRESS_JOBS_TOPIC).publisher();

    const [subscription] = await pubsub.createSubscription(INCOMING_JOBS_TOPIC, INCOMING_JOBS_SUBSCRIPTION);
    subscription.on('error', handleError);
    subscription.on('message', handleAttachToTangle);
}

init();
