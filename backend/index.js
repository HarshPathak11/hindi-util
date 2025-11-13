import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors());
app.use(express.json());

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

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
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

app.listen(5001, () => console.log("PDF server running on 5001"));
