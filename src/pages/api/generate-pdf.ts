
import type { NextApiRequest, NextApiResponse } from 'next';
import chromium from '@sparticuz/chromium';
import playwright from 'playwright-core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  let browser = null;
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    const htmlWithFonts = `
      <!DOCTYPE html>
      <html>
          <head>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Open+Sans:wght@400;700&display=swap" rel="stylesheet" />
              <style>
                  body {
                      margin: 0;
                      padding: 0;
                      -webkit-font-smoothing: antialiased;
                  }
              </style>
          </head>
          <body>
              ${html}
          </body>
      </html>
    `;

    await page.setContent(htmlWithFonts, { waitUntil: 'networkidle' });

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
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during PDF generation.";
    res.status(500).json({ error: 'Failed to generate PDF.', details: errorMessage });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
