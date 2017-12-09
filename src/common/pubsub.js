require('./env');
const PubSub = require('@google-cloud/pubsub');

const pubsub = PubSub({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_KEY_FILE
});

const { INCOMING_JOBS_TOPIC, PROGRESS_JOBS_TOPIC, FINISHED_JOBS_TOPIC } = process.env;

async function init() {
    const results = await pubsub.getTopics();
    const topics = results[0];

    await [INCOMING_JOBS_TOPIC, PROGRESS_JOBS_TOPIC, FINISHED_JOBS_TOPIC].reduce(async (prev, topic) => {
        await prev;

        if (!topics.find(next => next.name.endsWith(topic))) {
            console.log(`Creating pubsub topic ${topic}...`);
            return pubsub.createTopic(topic);
        }

        return Promise.resolve();
    }, Promise.resolve());
}

module.exports = {
    init,
    client: pubsub
};
