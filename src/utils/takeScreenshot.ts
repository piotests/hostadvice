import fs from 'fs';
const puppeteer = require('puppeteer');

export const takeScreenshot = async (screenshotUrl: string, taskId: string) => {

  // if screenshots directory is not exist then create one
  if (!fs.existsSync('src/fs')) {
    fs.mkdirSync('src/fs');
  }

  let browser: any = '';

  try {
    // launch headless Chromium browser
    browser = await puppeteer.launch({
      headless: true,
    });

    // create new page object
    const page = await browser.newPage();

    // set viewport width and height
    await page.setViewport({
      width: 1440,
      height: 1080,
    });

    await page.goto(screenshotUrl);
    // capture screenshot and store it into screenshots directory.
    await page.screenshot({
      path: `${__dirname}/../fs/${taskId}.png`,
      fullPage: true,
    });
    
    console.log(`${screenshotUrl} screenshots captured.`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
};