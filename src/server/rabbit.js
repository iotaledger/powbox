const amqp = require('amqplib');

const { job } = require('../common/db');
const log = require('../common/logging');

const { BROKER_URL, COMPLETED_QUEUE, PROGRESS_QUEUE, ERROR_QUEUE } = process.env;

const logComplete = jobId => log.info({ queue: COMPLETED_QUEUE, name: 'job-complete', jobId });
const logProgress = (jobId, progress) =>
    log.info({
        queue: PROGRESS_QUEUE,
        name: 'job-progress',
        jobId,
        message: `Progress ${progress}%`
    });
const logError = (jobId, message) => log.error({ queue: ERROR_QUEUE, name: 'job-error', jobId, message });

module.exports.listen = async () => {
    const conn = await amqp.connect(BROKER_URL);

    const channel = await conn.createChannel();

    await channel.assertQueue(PROGRESS_QUEUE);

    channel.consume(PROGRESS_QUEUE, async msg => {
        const jobId = msg.properties.messageId;

        logProgress(jobId, msg.content);

        await job.update(jobId, msg.content);

        channel.ack(msg);
    });

    log.listen(PROGRESS_QUEUE);

    await channel.assertQueue(COMPLETED_QUEUE);

    channel.consume(COMPLETED_QUEUE, async msg => {
        const jobId = msg.properties.messageId;

        logComplete(jobId);

        await job.complete(jobId, JSON.parse(msg.content.toString()));

        channel.ack(msg);
    });

    await channel.assertQueue(ERROR_QUEUE);

    channel.consume(ERROR_QUEUE, async msg => {
        const jobId = msg.properties.messageId;

        logError(jobId, msg.content.toString());

        await job.error(jobId, msg.content.toString());

        channel.ack(msg);
    });

    log.listen(COMPLETED_QUEUE);
};
