
import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// This is required for Vercel deployments
// It specifies the paths to the Chromium binary and its dependencies
const chromiumExecutablePath = async () => {
    if (process.env.VERCEL_ENV === 'production') {
        return await chromium.executablePath();
    }
    // For local development, you'll need to have Chromium installed.
    // Specify the path to your local Chromium installation.
    // e.g. on macOS: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    // on Windows: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    // on Linux: '/usr/bin/google-chrome'
    // You can find the path by typing "chrome://version" in your Chrome browser.
    
    // For MacOS
    if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    // For Windows
    if (process.platform === 'win32') {
        // This is a common path, adjust if your installation is different
        return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }
    // For Linux
    return '/usr/bin/google-chrome'; 
};

export async function POST(request: Request) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const browser = await puppeteer.launch({
      args: process.env.VERCEL_ENV === 'production' ? chromium.args : [],
      executablePath: await chromiumExecutablePath(),
      headless: process.env.VERCEL_ENV === 'production' ? chromium.headless : true,
    });

    const page = await browser.newPage();
    
    // Set a consistent viewport for predictable rendering
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 }); // A4 dimensions at 96 DPI

    // Set the HTML content
    // We wrap the user's HTML in a standard document structure.
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
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Merriweather:wght@400;700&display=swap');
                </style>
            </head>
            <body>
                ${html}
            </body>
        </html>
    `, { waitUntil: 'networkidle0' });

    // Generate the PDF
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

    await browser.close();

    // Return the PDF as a response
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
  }
}
