const IOTA = require('iota.lib.js');

const iota = new IOTA({
    host: process.env.IRI_HOST,
    port: process.env.IRI_PORT,
    sandbox: true
});

const attachToTangle = (options, callback) => {
    // do pubsub stuff
    callback(new Error('method not yet implemented'));
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
            attachToTangle(req.body, cb);
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
