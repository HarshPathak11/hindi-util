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
import { execSync } from "child_process";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors());
app.use(express.json());

/* ---------- Diagnostics helpers ---------- */

function listPuppeteerCache(cacheDir) {
  console.log(">>> listPuppeteerCache: checking", cacheDir);
  try {
    const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
    console.log(">>> puppeteer cache entries:", entries.map((e) => e.name));
    for (const e of entries) {
      if (e.isDirectory()) {
        const sub = path.join(cacheDir, e.name);
        try {
          console.log(`>>> contents of ${sub}:`, fs.readdirSync(sub));
        } catch (er) {
          console.warn(">>> could not list subdir", sub, er?.message || er);
        }
      }
    }
  } catch (err) {
    console.warn(">>> Could not read puppeteer cache dir:", err?.message || err);
  }
}

/* ---------- Ensure Chrome is installed at runtime ---------- */

/**
 * Try to determine if chrome binary exists at the given path
 */
function pathExists(p) {
  try {
    return !!p && fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * Run puppeteer runtime install if needed.
 * This may take 10-30s on first cold start.
 */
async function ensureChromeInstalled() {
  // Prefer explicitly configured executable path (from Render env var)
  const envExecPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envExecPath && pathExists(envExecPath)) {
    console.log(">>> Found chrome via PUPPETEER_EXECUTABLE_PATH:", envExecPath);
    return envExecPath;
  }

  // Try puppeteer.executablePath() (may throw if not installed)
  let autoPath;
  try {
    autoPath = puppeteer.executablePath();
  } catch (err) {
    autoPath = undefined;
  }
  if (autoPath && pathExists(autoPath)) {
    console.log(">>> Found chrome via puppeteer.executablePath():", autoPath);
    return autoPath;
  }

  // If not found, perform runtime install.
  // Use a cache dir inside /tmp to ensure it's writable and runtime-local.
  const runtimeCache = process.env.PUPPETEER_CACHE_DIR || "/tmp/puppeteer";
  console.log(">>> Chrome not found at candidates. Will attempt runtime install.");
  console.log(">>> Using runtime cache dir:", runtimeCache);

  // Make sure cache dir exists
  try {
    fs.mkdirSync(runtimeCache, { recursive: true });
  } catch (err) {
    console.warn(">>> could not create runtime cache dir:", err?.message || err);
  }

  // Run the install command (synchronous to keep startup simple)
  // NOTE: use a specific puppeteer version if you want, otherwise latest installed is used.
  const installCmd = "npx puppeteer browsers install chrome --silent";
  console.log(">>> Running install command:", installCmd);
  try {
    execSync(installCmd, {
      stdio: "inherit",
      env: {
        ...process.env,
        PUPPETEER_CACHE_DIR: runtimeCache,
      },
      // optionally increase timeout with execSync? rely on default for now
    });
    console.log(">>> puppeteer install command finished.");
  } catch (err) {
    console.error(">>> puppeteer runtime install failed:", err?.message || err);
    throw new Error("Runtime puppeteer install failed: " + (err?.message || err));
  }

  // Re-evaluate executable path after install
  try {
    const newPath = puppeteer.executablePath();
    if (newPath && pathExists(newPath)) {
      console.log(">>> Chrome found after runtime install at:", newPath);
      return newPath;
    } else {
      console.warn(">>> puppeteer.executablePath() returned:", newPath);
      // Also try common location inside the runtime cache
      // Find latest chrome dir under runtimeCache
      try {
        const chromeDir = fs.readdirSync(runtimeCache).find((d) => d.startsWith("chrome"));
        if (chromeDir) {
          const candidate = path.join(runtimeCache, chromeDir);
          console.log(">>> Found candidate chrome dir:", candidate);
        }
      } catch {}
    }
  } catch (err) {
    console.warn(">>> Error calling puppeteer.executablePath() after install:", err?.message || err);
  }

  throw new Error("Chrome binary not found after runtime install.");
}

/* ---------- Robust browser launcher that uses ensureChromeInstalled ---------- */

async function launchBrowser() {
  // Try to ensure chrome is installed and get path
  const cacheDirToLog = process.env.PUPPETEER_CACHE_DIR || "/opt/render/.cache/puppeteer";
  listPuppeteerCache(cacheDirToLog);

  const execPath = await ensureChromeInstalled();
  console.log(">>> Launching puppeteer with executablePath:", execPath);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: execPath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  });

  return browser;
}

/* ---------- Express route ---------- */

app.post("/generate-pdf", async (req, res) => {
  const { headerText, bodyText, footerText } = req.body;

  try {
    const fontPath = path.join(
      __dirname,
      "public",
      "fonts",
      "NotoSansDevanagari-Regular.ttf"
    );

    const html = buildHTML(headerText, bodyText, footerText, fontPath);

    // Attempt to launch browser (will install if needed)
    const browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

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

// listen on dynamic port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`PDF server running on ${PORT}`));
