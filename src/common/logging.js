const error = json => console.error(JSON.stringify(json));
const info = json => console.info(JSON.stringify(json));
const listen = (queue, message) => info({ queue, name: 'listening-for-mesages', message });

module.exports = {
    error,
    info,
    listen
};
