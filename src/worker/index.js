require('../common/env');

const log = console.log;

const pubsub = require('../common/pubsub');

// const Datatore = require('@google-cloud/datastore');
// const datastore = DataStore({});

const ccurl = require('ccurl.interface.js');
const {
    CCURL_PATH,
    INCOMING_JOBS_TOPIC,
    INCOMING_JOBS_SUBSCRIPTION,
    PROGRESS_JOBS_TOPIC,
    FINISHED_JOBS_TOPIC
} = process.env;

let jobProgress;
let jobComplete;

function failJob(err) {}

function handleAttachToTangle(msg) {
    log('Starting job: ', msg.id);
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
        jobProgress.publish(Buffer.from(JSON.stringify({ id: msg.id, progress })));
    }

    function publishJobComplete(err, res) {
        if (err) {
            log('Error: ', err);
            return;
        }

        jobComplete.publish(Buffer.from(JSON.stringify({ id: msg.id, res })));
        log('Job complete: ', res);
    }

    job.on('progress', publishJobProgress);
    job.on('done', publishJobComplete);
}

function handleError(err) {
    log(err);
}

async function init() {
    await pubsub.init();

    const client = pubsub.client;

    jobComplete = client.topic(FINISHED_JOBS_TOPIC).publisher();
    jobProgress = client.topic(PROGRESS_JOBS_TOPIC).publisher();

    const [subscription] = await client.createSubscription(INCOMING_JOBS_TOPIC, INCOMING_JOBS_SUBSCRIPTION);

    subscription.on('error', handleError);
    subscription.on('message', handleAttachToTangle);
    log('Sandbox worker initialized, waiting for pubsub messages...');
}

init();
