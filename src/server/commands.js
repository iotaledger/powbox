const amqp = require('amqplib');
const IOTA = require('iota.lib.js');

const { job } = require('../common/db');
const log = require('../common/logging');
const { asBuffer } = require('../common/utils');

const { INCOMING_QUEUE, MWM_LIMIT } = process.env;

const iota = new IOTA({
    provider: process.env.IRI_URL,
    sandbox: true
});

const attachToTangle = async (req, callback) => {
    if (req.body.minWeightMagnitude > MWM_LIMIT) {
        callback(new Error(`Error: 'minWeightMagnitude' exceeds limit of ${MWM_LIMIT}`));
        return;
    }

    const conn = await amqp.connect(process.env.BROKER_URL);

    const channel = await conn.createChannel();

    let messageId;

    try {
        messageId = await job.create(JSON.stringify(req.body));
    } catch (e) {
        console.error(e);

        callback(e);

        return;
    }

    await channel.assertQueue(INCOMING_QUEUE);

    await channel.sendToQueue(INCOMING_QUEUE, asBuffer(req.body), {
        messageId,
        appId: process.env.AMQP_APP_ID
    });

    log.info({
        queue: INCOMING_QUEUE,
        name: 'job-request-ok',
        jobId: messageId
    });

    callback(null, { jobId: messageId });
};

module.exports = (req, res) => {
    const { command } = req.body;

    const cb = (err, result) => {
        if (err) {
            res.status(400);
            res.send(err.message);
        } else {
            res.status(200);
            res.json(result);
        }
    };

    log.info(req.body);

    switch (command) {
        case 'getNodeInfo':
            iota.api.getNodeInfo(cb);
            break;

        case 'getTips':
            iota.api.getTips(cb);
            break;

        case 'findTransactions':
            delete req.body.command;

            iota.api.findTransactions(req.body, cb);
            break;

        case 'getTrytes':
            iota.api.getTrytes(req.body.hashes, cb);
            break;

        case 'getInclusionStates':
            iota.api.getInclusionStates(req.body.transactions, req.body.tips, cb);
            break;

        case 'getBalances':
            iota.api.getBalances(req.body.addresses, req.body.threshold, cb);
            break;

        case 'getTransactionsToApprove':
            iota.api.getTransactionsToApprove(req.body.depth, cb);
            break;

        case 'attachToTangle':
            attachToTangle(req, cb);
            break;

        case 'broadcastTransactions':
            iota.api.broadcastTransactions(req.body.trytes, cb);
            break;

        case 'storeTransactions':
            iota.api.storeTransactions(req.body.trytes, cb);
            break;

        default:
            res.status(400);
            res.send('Invalid command: ', command);
            break;
    }
};
