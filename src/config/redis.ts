import redis from 'redis';
import Queue from 'bull';
import config from '../config/general.config';

// Create / Connect to a named work queue
const workQueue = new Queue('work', config.redis_url);
const redisClient = redis.createClient(config.redis_port);

// Log error to the console if any occurs
redisClient.on("error", (err) => {
    console.log(err);
});

export { workQueue, redisClient };