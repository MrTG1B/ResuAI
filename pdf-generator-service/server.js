
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateLatex } = require('./latex-generator');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many PDF generation requests. Please try again later.' },
});


/**
 * POST /generate-pdf
 * Accepts JSON resume data, generates a LaTeX document, compiles it with pdflatex,
 * and returns the resulting single-page PDF.
 *
 * Request body: { resumeData: { name, title, email, ... } }
 * Falls back to legacy HTML-to-PDF if only { html } is provided.
 */
app.post('/generate-pdf', pdfLimiter, async (req, res) => {
  const { resumeData, html } = req.body;

  // If resumeData is provided, use the LaTeX route
  if (resumeData) {
    let tmpDir = null;
    try {
      // Create a temp directory for LaTeX compilation
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-'));
      const texFile = path.join(tmpDir, 'resume.tex');
      const pdfFile = path.join(tmpDir, 'resume.pdf');

      // Generate LaTeX from structured data
      const latexContent = generateLatex(resumeData);
      fs.writeFileSync(texFile, latexContent, 'utf-8');

      // Compile LaTeX to PDF
      try {
        execFileSync('pdflatex', [
          '-interaction=nonstopmode',
          '-halt-on-error',
          `-output-directory=${tmpDir}`,
          texFile
        ], { timeout: 30000, stdio: 'pipe' });
      } catch (compileError) {
        // Read the log file for debugging
        const logFile = path.join(tmpDir, 'resume.log');
        if (fs.existsSync(logFile)) {
          const logContent = fs.readFileSync(logFile, 'utf-8');
          const errorLines = logContent.split('\n').filter(line =>
            line.startsWith('!') || line.includes('Error') || line.includes('Undefined')
          ).join('\n');
          console.error('LaTeX compilation errors:', errorLines);
        }
        throw new Error(`LaTeX compilation failed: ${compileError.message}`);
      }

      if (!fs.existsSync(pdfFile)) {
        throw new Error('PDF file was not generated');
      }

      const pdfBuffer = fs.readFileSync(pdfFile);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
      res.send(pdfBuffer);

    } catch (err) {
      console.error('LaTeX PDF Error:', err);
      res.status(500).json({
        error: 'LaTeX PDF generation failed',
        details: err.message
      });
    } finally {
      // Clean up temp directory
      if (tmpDir) {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.error('Cleanup failed:', cleanupErr);
        }
      }
    }
    return;
  }

  // Fallback: Legacy HTML-to-PDF route using Playwright
  if (html) {
    let browser = null;
    try {
      const playwright = require('playwright-core');
      const chromium = require('@sparticuz/chromium');

      browser = await playwright.chromium.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12.7mm',
          right: '12.7mm',
          bottom: '12.7mm',
          left: '12.7mm'
        }
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      console.error('HTML PDF Error:', err);
      if (browser) {
        await browser.close();
      }
      res.status(500).send('PDF generation failed');
    }
    return;
  }

  res.status(400).json({ error: 'Missing resumeData or html in request body' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PDF Generator running on port ${PORT}`);
});
