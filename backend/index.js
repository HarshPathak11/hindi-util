// import express from "express";
// import cors from "cors";
// import puppeteer from "puppeteer";
// import path from "path";
// import { fileURLToPath } from "url";

// const app = express();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(cors());
// app.use(express.json());

// app.post("/generate-pdf", async (req, res) => {
//   const { headerText, bodyText, footerText } = req.body;

//   try {
//     const fontPath = path.join(
//       __dirname,
//       "..",
//       "public",
//       "fonts",
//       "NotoSansDevanagari-Regular.ttf"
//     );

//     const html = buildHTML(headerText, bodyText, footerText, fontPath);

//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//     });

//     await browser.close();

//     res.setHeader("Content-Type", "application/pdf");
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "PDF generation failed" });
//   }
// });

// function escape(str = "") {
//   return str
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;");
// }

// function buildHTML(header, body, footer, fontPath) {
//   return `
// <!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8" />
// <style>
//   @font-face {
//     font-family: "NotoDeva";
//     src: url("file://${fontPath}");
//   }
//   body {
//     margin: 0;
//     padding: 0;
//     font-family: "NotoDeva", sans-serif;
//   }
//   .page {
//     width: 210mm;
//     height: 297mm;
//     padding: 20mm;
//     position: relative;
//   }
//   .header {
//     position: absolute;
//     top: 20mm;
//     left: 20mm;
//     font-size: 12pt;
//     white-space: pre-wrap;
//   }
//   .body {
//     margin-top: 50mm;
//     font-size: 14pt;
//     line-height: 1.7;
//     white-space: pre-wrap;
//     text-align: justify;
//   }
//   .footer {
//     position: absolute;
//     right: 20mm;
//     bottom: 20mm;
//     font-size: 12pt;
//     white-space: pre-wrap;
//   }
// </style>
// </head>
// <body>
//   <div class="page">
//     <div class="header">${escape(header)}</div>
//     <div class="body">${escape(body)}</div>
//     <div class="footer">${escape(footer)}</div>
//   </div>
// </body>
// </html>
//   `;
// }

// app.listen(5001, () => console.log("PDF server running on 5001"));

import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors());
app.use(express.json());

/**
 * Diagnostic: list cache dir contents (helps debug Render installs)
 */
function listPuppeteerCache() {
  const cacheDir = process.env.PUPPETEER_CACHE_DIR || "/opt/render/.cache/puppeteer";
  console.log(">>> PUPPETEER_CACHE_DIR:", cacheDir);
  try {
    const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
    console.log(">>> puppeteer cache dir entries:", entries.map((e) => e.name));
    for (const e of entries) {
      if (e.isDirectory()) {
        const sub = path.join(cacheDir, e.name);
        try {
          const subEntries = fs.readdirSync(sub);
          console.log(`>>> contents of ${sub}:`, subEntries);
        } catch (err) {
          console.warn(">>> could not list subdir", sub, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.warn(">>> Could not read puppeteer cache dir:", err?.message || err);
  }
}

/**
 * Robust puppeteer launcher:
 * - prefers PUPPETEER_EXECUTABLE_PATH env
 * - falls back to puppeteer.executablePath() if available
 * - checks paths exist and logs diagnostics
 */
async function launchBrowser() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  let autoPath;
  try {
    autoPath = puppeteer.executablePath();
  } catch (err) {
    autoPath = undefined;
  }

  console.log(">>> PUPPETEER_EXECUTABLE_PATH (env):", envPath);
  console.log(">>> puppeteer.executablePath():", autoPath);

  const candidates = [envPath, autoPath].filter(Boolean);

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        console.log(">>> Chrome binary exists at:", p);
        return await puppeteer.launch({
          headless: "new",
          executablePath: p,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote",
            "--single-process",
          ],
        });
      } else {
        console.warn(">>> Candidate path does not exist:", p);
      }
    } catch (err) {
      console.warn(">>> Error checking candidate path:", p, err?.message || err);
    }
  }

  // Final fallback: try default launch (may still fail)
  console.warn(">>> No valid chrome binary found in candidates, trying default puppeteer.launch()");
  return await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  });
}

app.post("/generate-pdf", async (req, res) => {
  const { headerText, bodyText, footerText } = req.body;

  try {
    const fontPath = path.join(
      __dirname,
      "..",
      "public",
      "fonts",
      "NotoSansDevanagari-Regular.ttf"
    );

    const html = buildHTML(headerText, bodyText, footerText, fontPath);

    // Diagnostics: show cache contents so we can see the installed chrome
    listPuppeteerCache();

    // Launch browser using robust helper
    const browser = await launchBrowser();

    // If launchBrowser returned undefined or null (shouldn't), throw
    if (!browser) {
      throw new Error("Failed to launch browser (no browser instance returned).");
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Puppeteer returns a Uint8Array; convert to Buffer for safe sending
    const rawPdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    const pdfBuffer = Buffer.from(rawPdf);

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error?.message || error);
    // include stack in logs for debugging, but send generic error to client
    console.error(error?.stack || "");
    res.status(500).json({ error: "PDF generation failed" });
  }
});

function escape(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHTML(header, body, footer, fontPath) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  @font-face {
    font-family: "NotoDeva";
    src: url("file://${fontPath}");
  }
  body {
    margin: 0;
    padding: 0;
    font-family: "NotoDeva", sans-serif;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 20mm;
    position: relative;
  }
  .header {
    position: absolute;
    top: 20mm;
    left: 20mm;
    font-size: 12pt;
    white-space: pre-wrap;
  }
  .body {
    margin-top: 50mm;
    font-size: 14pt;
    line-height: 1.7;
    white-space: pre-wrap;
    text-align: justify;
  }
  .footer {
    position: absolute;
    right: 20mm;
    bottom: 20mm;
    font-size: 12pt;
    white-space: pre-wrap;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">${escape(header)}</div>
    <div class="body">${escape(body)}</div>
    <div class="footer">${escape(footer)}</div>
  </div>
</body>
</html>
  `;
}

// Use dynamic PORT for Render / cloud providers
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`PDF server running on ${PORT}`));
