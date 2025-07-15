
import { NextResponse } from 'next/server';
import { Browser } from '@puppeteer/browsers';
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

// Define a cache path for the browser
const CACHE_DIR = path.resolve(process.cwd(), '.cache', 'puppeteer');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function getBrowser() {
    // Attempt to find a locally installed browser.
    const browser = await Browser.create({
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

export async function POST(request: Request) {
  let browserInstance;
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
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
                    }
                    /* Inject Google Fonts link if any are used in the HTML */
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

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during PDF generation.";
    return NextResponse.json({ error: 'Failed to generate PDF.', details: errorMessage }, { status: 500 });
  } finally {
      if (browserInstance) {
          await browserInstance.close();
      }
  }
}
