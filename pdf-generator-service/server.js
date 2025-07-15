
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send('Missing HTML content');
  }

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
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

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF Error:', err);
    if (browser) {
      await browser.close();
    }
    res.status(500).send('PDF generation failed');
  }
});

const PORT = process.env.PORT || 3001; // Using 3001 to avoid conflict with Next.js dev server
app.listen(PORT, () => {
  console.log(`PDF Generator running on port ${PORT}`);
});
