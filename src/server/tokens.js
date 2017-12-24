const jwt = require('jsonwebtoken');

const { Token } = require('../common/db');

module.exports.createOrGetToken = async ({ id, email }) => {
    const existing = await Token.findOne({ githubId: id });

    if (existing) {
        return existing.apikey;
    }

    const apikey = jwt.sign({ id, email }, process.env.API_SECRET, { issuer: 'iota' });

    const token = new Token({
        githubId: id,
        email,
        apikey
    });

    await token.save();

    return apikey;
};

module.exports.validateJwt = token => jwt.verify(token, process.env.API_SECRET);
