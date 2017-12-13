require('../common/env');

const amqp = require('amqplib');
const ccurl = require('ccurl.interface.js');
const { asBuffer, fromBuffer } = require('../common/utils');

const { CCURL_PATH } = process.env;

const publishJobComplete = (channel, msg) => async (err, res) => {
    channel.ack(msg);

    if (err) {
        console.error('Error: ', err);
        throw err;
    }

    await channel.assertQueue(process.env.COMPLETED_QUEUE);

    return channel.sendToQueue(process.env.COMPLETED_QUEUE, asBuffer(res), {
        messageId: msg.properties.messageId,
        appId: msg.properties.appId
    });
};

async function listen() {
    const conn = await amqp.connect(process.env.BROKER_URL);

    const channel = await conn.createChannel();

    await channel.assertQueue(process.env.INCOMING_QUEUE);

    console.log('Worker listening for messages on queue: ', process.env.INCOMING_QUEUE);

    channel.consume(process.env.INCOMING_QUEUE, msg => {
        const data = fromBuffer(msg.content);

        console.log('Data received: ', data.trunkTransaction);

        const { trunkTransaction, branchTransaction, minWeightMagnitude, trytes } = data;
        const job = ccurl(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, CCURL_PATH);

        function publishJobProgress(err, progress) {
            console.log(progress);
        }

        job.on('progress', publishJobProgress);
        job.on('done', publishJobComplete(channel, msg));
    });
}

listen();
