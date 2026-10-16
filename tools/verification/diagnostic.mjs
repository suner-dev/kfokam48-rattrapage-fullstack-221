/** Diagnostic rapide : pourquoi la liste ne se remplit-elle pas ? */
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  timeout: 180000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=/tmp/chrome-diag-${process.pid}`],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('console', (m) => console.log('console>', m.type(), m.text().slice(0, 220)));
page.on('pageerror', (e) => console.log('pageerror>', String(e).slice(0, 300)));
page.on('requestfailed', (r) => console.log('reqfail>', r.url(), r.failure()?.errorText));
page.on('response', (r) => {
  if (r.url().includes('/api/')) console.log('resp>', r.status(), r.url());
});

await page.goto('http://127.0.0.1:5173', { waitUntil: 'load', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));
console.log('--- body ---');
console.log((await page.evaluate(() => document.body.innerText)).slice(0, 700));
await browser.close();
