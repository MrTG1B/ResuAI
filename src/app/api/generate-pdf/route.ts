
import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// This function now consistently uses the bundled chromium executable,
// which works in both production and local development environments.
const getChromiumExecutablePath = async () => {
    // When in a serverless environment (like Vercel production),
    // puppeteer-core needs a specific path to the bundled Chromium.
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        return await chromium.executablePath();
    }
    // For local development, we can use the path provided by the package.
    return chromium.executablePath;
};


export async function POST(request: Request) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await getChromiumExecutablePath(),
      headless: chromium.headless,
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
