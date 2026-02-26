
const express = require('express');
const cors = require('cors');
const playwright = require('playwright-core');
const chromium = require('@sparticuz/chromium');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// A4 at 96 dpi
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

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

    // Set viewport to A4 width so layout matches the editor preview
    await page.setViewportSize({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX });

    // Wrap the HTML fragment in a full document with print-ready styles
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; width: ${A4_WIDTH_PX}px; }
  </style>
</head>
<body>${html}</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    // Measure rendered content height and scale down if it overflows one A4 page
    const contentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (contentHeight > A4_HEIGHT_PX) {
      const scale = A4_HEIGHT_PX / contentHeight;
      await page.evaluate(
        ({ scale, width, height }) => {
          document.body.style.transform = `scale(${scale})`;
          document.body.style.transformOrigin = '0 0';
          document.body.style.width = `${width}px`;
          document.body.style.height = `${height}px`;
          document.body.style.overflow = 'hidden';
        },
        { scale: scale, width: A4_WIDTH_PX / scale, height: A4_HEIGHT_PX / scale }
      );
    }

    const pdfBuffer = await page.pdf({
      width: `${A4_WIDTH_PX}px`,
      height: `${A4_HEIGHT_PX}px`,
      printBackground: true,
      pageRanges: '1',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
