import express from 'express';
import cluster from 'cluster';
import process from 'process';
import Queue from 'bull';
import { router, setProcess } from './routes';
import config from './config/general.config';

// Create / Connect to a named work queue
const workQueue = new Queue('work', config.redis_url);

process.on('unhandledRejection', (rejectionErr) => {
    console.log('unhandledRejection Err::', rejectionErr);
});

process.on('uncaughtException', (uncaughtExc) => {
    console.log('uncaughtException Err::', uncaughtExc);
    console.log('uncaughtException Stack::', JSON.stringify(uncaughtExc.stack));
});

const app: express.Application = express();

let workers: any[] = [];

/**
 * Setup number of worker processes to share port which will be defined while setting up server
 */
const setupWorkerProcesses = () => {
    // read number of cores on system
    let numCores: number = require('os').cpus().length;
    console.log('Master cluster setting up ' + numCores + ' workers');

    for(let i: number = 0; i < numCores; i++) {
        // creating workers and pushing reference in an array
        workers.push(cluster.fork());

        // receive messages from worker process
        workers[i].on('message', async (message) => {
            console.log(message);
            if (message) {
                await workQueue.add('saveScreenshot', {
                    url: message.url,
                    task_id: message.task_id
                });
            }
        });
    }

    // process is clustered on a core and process id is assigned
    cluster.on('online', (worker) => {
        console.log('Worker ' + worker.process.pid + ' is listening');
    });

    // if any of the worker process dies then start a new one by simply forking another one
    cluster.on('exit', (worker, code, signal) => {
        // exitedAfterDisconnect ensures that it is not killed by master cluster or manually
        if (code !== 0 && !worker.exitedAfterDisconnect) {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');
            workers.push(cluster.fork());
            // receive messages from worker process
            workers[workers.length-1].on('message', function(message) {
                console.log(message);
            });
        }
    });
};

/**
 * Setup an express server and define port to listen all incoming requests for this application
 */
const setupExpress = () => {
    // parse application/json
    app.use( express.json() );
    app.use( express.urlencoded( { extended: false } ) );
    
    app.disable('x-powered-by');

    setProcess(process);
    // routes
    app.use(router);

    // start server
    app.listen(config.server_port, () => {
        console.log(`Started server on => http://localhost:${config.server_port} for Process Id ${process.pid}`);
    });
};

/**
 * Setup server either with clustering or without it
 * @param isClusterRequired
 * @constructor
 */
const setupServer = (isClusterRequired) => {

    // if it is a master process then call setting up worker process
    if(isClusterRequired && cluster.isMaster) {
        setupWorkerProcesses();
    } else {
        // to setup server configurations and share port address for incoming requests
        setupExpress();
    }
};

setupServer(true);

module.exports = { app };