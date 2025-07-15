
const express = require('express');
const cors = require('cors');
const playwright = require('playwright-core');
const chromium = require('@sparticuz/chromium');

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
    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    
    // The HTML content already has fonts from the editor's display.
    // We just need to set the content.
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1inch',
        right: '1inch',
        bottom: '1inch',
        left: '1inch'
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PDF Generator running on port ${PORT}`);
});
