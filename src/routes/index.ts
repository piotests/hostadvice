import express from 'express';
import fs from 'fs';
import { screenshotApi, IScreenshotApi } from '../models/screenshotApi.model'
import { takeScreenshot } from '../utils/takeScreenshot';
import { workQueue, redisClient } from "../config/redis";
import config from '../config/general.config';
import connectDB from "../config/database";
const uuid = require('uuid');

// Connect to MongoDB
connectDB();

let proc: typeof process;
const setProcess = (child: typeof process) => {
    if (child) {
        proc = child;
    }
};

const router: express.Router = express.Router();

/**
 * GET task
 */
router.get('/task', async ( _req: express.Request, res: express.Response ) => {
    const screenshotUrl: string = config.website_url;
    const taskId: string = uuid.v4();
    
    try {
        redisClient.get(screenshotUrl, async (err, task) => {
            if (err) throw err;

            if (task) {
                res.status(200).send(
                    `Screenshot taken for an address ${screenshotUrl} in the last 24 hours`
                );
            } else {
                redisClient.setex(screenshotUrl, 86400, screenshotUrl);
                
                proc.send!({
                    url: screenshotUrl,
                    task_id: taskId
                });
        
                workQueue.process( 'saveScreenshot', async (job, done) => {
                    const { url, task_id } = job.data;
        
                    try {
                        const screenshot = await takeScreenshot(url, task_id);
        
                        const imagePath: string = `fs/${task_id}.png`;
                        let resultMessage: string = 'The image has correctly be saved';
                        let state: boolean = true;
        
                        if (!fs.existsSync(`${__dirname}/${imagePath}`)) {
                            state = false;
                            resultMessage = 'The image has not saved';
                        }

                        if (state) {
                            const saveScreenshot: IScreenshotApi = new screenshotApi({
                                url: url,
                                task_id: task_id,
                                image_path: imagePath,
                                status: state
                            });
                            await saveScreenshot.save();
                        }
                        
                        done(null, {
                            status: state,
                            screenshot,
                            resultMessage: resultMessage
                        });
                    } catch(error) {
                        done(error);
                    }
                });
                        
                res.json({
                    task_id: taskId 
                });
            }
        });
    } catch(err) {
        res.status(500).send({
            message: err.message
        });
    }
});

/**
 * Mismatch URL
 */
router.all('*', ( _req: express.Request, res: express.Response ) => {
    res.status(404).send({ 
        error: true, 
        message: 'Check your URL please' 
    });
});
    
export {  router, setProcess };