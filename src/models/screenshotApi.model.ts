import { model, Schema, Model, Document } from 'mongoose';

/**
 * Interface to model the ScreenshotApi Schema for TypeScript.
 * @param url:string
 * @param task_id:string
 * @param image_path:string
 * @param status:boolean
 */
interface IScreenshotApi extends Document {
  url: string;
  task_id: string;
  image_path: string;
  status: boolean;
}

const screenshotApiSchema: Schema = new Schema({
  url: { 
    type: String, 
    required: true 
  },
  task_id: { 
    type: String, 
    required: true 
  },
  image_path: { 
    type: String, 
    required: true 
  },
  status: { 
    type: Boolean, 
    required: true 
  }
});

const screenshotApi: Model<IScreenshotApi> = model('screenshotApi', screenshotApiSchema);

export { screenshotApi, IScreenshotApi };