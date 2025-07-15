
import type { NextApiRequest, NextApiResponse } from 'next';
import { Browser } from '@puppeteer/browsers';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

// Define a writable cache path within the /tmp directory
const CACHE_DIR = '/tmp/puppeteer_cache';
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function getBrowser() {
    // Correctly instantiate the Browser class for the platform.
    const browser = new Browser({
        path: CACHE_DIR,
        platform: 'linux',
    });

    // If not found, download and install it.
    if (browser.version === 'unknown') {
        console.log("Browser not found, installing...");
        const newBrowser = await browser.install({
            buildId: '126.0.6478.126', // A recent stable version of Chrome
            cacheDir: CACHE_DIR,
        });
        console.log(`Browser installed at ${newBrowser.executablePath}`);
        return newBrowser;
    }
    console.log(`Using cached browser at ${browser.executablePath}`);
    return browser;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let browserInstance;
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }
    
    // Get browser instance (cached or newly installed)
    const installedBrowser = await getBrowser();

    browserInstance = await puppeteer.launch({
      executablePath: installedBrowser.executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browserInstance.newPage();
    
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    await page.setContent(`
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-font-smoothing: antialiased;
                    }
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;700&family=Open+Sans:wght@400;700&display=swap');
                </style>
            </head>
            <body>
                ${html}
            </body>
        </html>
    `, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during PDF generation.";
    res.status(500).json({ error: 'Failed to generate PDF.', details: errorMessage });
  } finally {
      if (browserInstance) {
          await browserInstance.close();
      }
  }
}
