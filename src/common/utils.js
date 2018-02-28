module.exports.asBuffer = object => Buffer.from(JSON.stringify(object));

module.exports.fromBuffer = buffer => JSON.parse(buffer.toString());
