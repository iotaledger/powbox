require('../common/env');

const amqp = require('amqplib');
const ccurl = require('ccurl.interface.js');
const { asBuffer, fromBuffer } = require('../common/utils');

const { BROKER_URL, CCURL_PATH, COMPLETED_QUEUE, INCOMING_QUEUE, PROGRESS_QUEUE } = process.env;

const publishJobProgress = (channel, msg) => async (err, res) => {
    await channel.assertQueue(PROGRESS_QUEUE);

    const progress = Math.floor(res * 100).toString();

    return channel.sendToQueue(PROGRESS_QUEUE, asBuffer(progress), {
        messageId: msg.properties.messageId,
        appId: msg.properties.appId
    });
};

const publishJobComplete = (channel, msg) => async (err, res) => {
    channel.ack(msg);

    if (err) {
        console.error('Error: ', err);
        throw err;
    }

    await channel.assertQueue(COMPLETED_QUEUE);

    return channel.sendToQueue(COMPLETED_QUEUE, asBuffer(res), {
        messageId: msg.properties.messageId,
        appId: msg.properties.appId
    });
};

async function listen() {
    const conn = await amqp.connect(BROKER_URL);
    const channel = await conn.createChannel();

    await channel.assertQueue(INCOMING_QUEUE);

    channel.consume(INCOMING_QUEUE, msg => {
        const data = fromBuffer(msg.content);

        console.log(`[${INCOMING_QUEUE}] received message ${msg.properties.messageId}`);

        const { trunkTransaction, branchTransaction, minWeightMagnitude, trytes } = data;
        const job = ccurl(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, CCURL_PATH);

        job.on('progress', publishJobProgress(channel, msg));
        job.on('done', publishJobComplete(channel, msg));
    });

    console.log(`[${INCOMING_QUEUE}] listening for messages`);
}

listen();
