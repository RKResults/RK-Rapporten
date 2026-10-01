import puppeteer, { type Browser } from "puppeteer-core";

let browserPromise: Promise<Browser> | null = null;

function chromiumPad(): string {
  return (
    process.env.CHROMIUM_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    "/usr/bin/chromium"
  );
}

/** Houdt één browser warm, zodat een preview snel klaar is. */
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: chromiumPad(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    });
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

export async function htmlNaarPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

/** Leest het aantal pagina's uit een pdf die door Chromium is gemaakt. */
export function telPaginas(pdf: Buffer): number {
  const tekst = pdf.toString("latin1");
  const count = tekst.match(/\/Count\s+(\d+)/);
  if (count) return Number(count[1]) || 1;
  const pages = tekst.match(/\/Type\s*\/Page[^s]/g);
  return pages?.length || 1;
}

export async function sluitBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  await browser?.close().catch(() => {});
}
