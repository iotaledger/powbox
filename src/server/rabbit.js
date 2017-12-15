const amqp = require('amqplib');

const { job } = require('../common/db');

const { BROKER_URL, COMPLETED_QUEUE, PROGRESS_QUEUE } = process.env;

module.exports.listen = async () => {
    const conn = await amqp.connect(BROKER_URL);

    const channel = await conn.createChannel();

    await channel.assertQueue(COMPLETED_QUEUE);

    channel.consume(COMPLETED_QUEUE, async msg => {
        console.log(`[${COMPLETED_QUEUE}] received message ${msg.properties.messageId}`);

        await job.complete(msg.properties.messageId, msg.content.toString());

        channel.ack(msg);
    });

    console.log(`[${COMPLETED_QUEUE}] listening for messages`);

    await channel.assertQueue(PROGRESS_QUEUE);

    channel.consume(PROGRESS_QUEUE, async msg => {
        console.log(`[${PROGRESS_QUEUE}] received message ${msg.properties.messageId}`);

        await job.update(msg.properties.messageId, msg.content.toString());

        channel.ack(msg);
    });

    console.log(`[${PROGRESS_QUEUE}] listening for messages`);
};
