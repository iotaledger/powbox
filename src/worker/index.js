require('../common/env');

const amqp = require('amqplib');
const ccurl = require('ccurl.interface.js');
const log = require('../common/logging');
const { asBuffer, fromBuffer } = require('../common/utils');

const {
    BROKER_URL,
    CCURL_PATH,
    COMPLETED_QUEUE,
    INCOMING_QUEUE,
    PROGRESS_QUEUE,
    ERROR_QUEUE,
    JOB_TIMEOUT
} = process.env;
const DEFAULT_JOB_TIMEOUT = 300;

/**
 * LOGGING UTILITIES
 */

const errorCodes = {
    RECEIVED: 'job-received-error',
    PROGRESS: 'job-progress-error',
    COMPLETE: 'job-complete-error',
    TIMEOUT: 'job-timeout-error'
};

const infoCodes = {
    RECEIVED: 'job-received-ok',
    PROGRESS: 'job-progress-ok',
    COMPLETE: 'job-complete-ok'
};

const logInfo = (jobId, name, message) =>
    log.info({
        queue: INCOMING_QUEUE,
        name,
        jobId,
        message
    });

const exitWithError = (name, jobId, error, exitCode) => {
    const note = {
        queue: INCOMING_QUEUE,
        name,
        jobId
    };

    if (typeof error === 'string') {
        note.message = error;
    } else {
        note.message = error.message;
        note.stack = error.stack;
    }

    log.error(note);
    process.exit(exitCode || 1);
};

const exitWithSuccess = jobId => {
    log.info({
        queue: INCOMING_QUEUE,
        name: infoCodes.COMPLETE,
        jobId
    });

    process.exit(0);
};

/**
 * MESSAGE HANDLERS
 */

const publishJobProgress = (channel, msg) => async (err, res) => {
    const jobId = msg.properties.messageId;

    if (err) {
        exitWithError(errorCodes.PROGRESS, jobId, err);
        return;
    }

    await channel.assertQueue(PROGRESS_QUEUE);

    const progress = Math.floor(res * 100);

    await channel.sendToQueue(
        PROGRESS_QUEUE,
        asBuffer(progress),
        {
            messageId: msg.properties.messageId,
            appId: msg.properties.appId
        },
        () => logInfo(jobId, infoCodes.PROGRESS, `Progress ${progress}%`)
    );
};

const publishJobComplete = (channel, msg) => async (err, res) => {
    const jobId = msg.properties.messageId;

    if (err) {
        exitWithError(errorCodes.COMPLETE, jobId, err);
        return;
    }

    await channel.assertQueue(COMPLETED_QUEUE);

    channel.sendToQueue(
        COMPLETED_QUEUE,
        asBuffer(res),
        {
            messageId: jobId,
            appId: msg.properties.appId
        },
        () => exitWithSuccess(jobId)
    );
};

const publishTimeout = (channel, timeout, jobId, appId) => async () => {
    const errorMessage = `Job timed out after ${timeout} seconds`;

    await channel.assertQueue(ERROR_QUEUE);

    channel.sendToQueue(
        ERROR_QUEUE,
        Buffer.from(errorMessage),
        {
            messageId: jobId,
            appId
        },
        () => {
            exitWithError(errorCodes.TIMEOUT, jobId, errorMessage, 2);
        }
    );
};

/**
 * Listen for a new message.
 * This is the entry point for the `attach-to-tangle` worker.
 *
 * @param {*} timeout The time in seconds to wait before killing the process
 */
async function listen(timeout) {
    const conn = await amqp.connect(BROKER_URL);
    const channel = await conn.createConfirmChannel();

    await channel.assertQueue(INCOMING_QUEUE);

    channel.consume(INCOMING_QUEUE, msg => {
        const { appId, messageId: jobId } = msg.properties;

        logInfo(jobId, infoCodes.RECEIVED);

        try {
            const data = fromBuffer(msg.content);
            const { trunkTransaction, branchTransaction, minWeightMagnitude, trytes } = data;
            const job = ccurl(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, CCURL_PATH);

            job.on('progress', publishJobProgress(channel, msg));
            job.on('done', publishJobComplete(channel, msg));
            job.start();
        } catch (err) {
            channel.nack(msg);
            exitWithError(errorCodes.RECEIVED, jobId, err);
            return;
        }

        channel.ack(msg);
        setTimeout(publishTimeout(channel, timeout, jobId, appId), timeout * 1000);
    });

    log.listen(INCOMING_QUEUE, `Timeout set to ${timeout} seconds`);
}

listen(JOB_TIMEOUT || DEFAULT_JOB_TIMEOUT);
