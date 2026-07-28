const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HERE = __dirname;
const CREDS = JSON.parse(fs.readFileSync(path.join(HERE, 'credentials.json'), 'utf8'));
const EMAIL = CREDS.recEmail;
const PW = CREDS.recPassword;
const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

function launchOpts() {
  const args = ['--no-sandbox'];
  const caFile = '/root/.ccr/agent-proxy-ca.crt';
  if (fs.existsSync(caFile)) {
    const spki = sh(`openssl x509 -in ${caFile} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).trim();
    args.push('--ssl-version-max=tls1.2', `--ignore-certificate-errors-spki-list=${spki}`, '--dns-over-https-mode=off');
  }
  const opts = { headless: true, args, executablePath: (() => {
    const root = '/opt/pw-browsers';
    for (const d of fs.readdirSync(root).filter(x => x.startsWith('chromium'))) {
      const p = path.join(root, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  })() };
  if (process.env.HTTPS_PROXY) opts.proxy = { server: process.env.HTTPS_PROXY };
  return opts;
}

(async () => {
  const browser = await chromium.launch(launchOpts());
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // Login
  await page.goto('https://www.rec.us/locations', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('button:visible, a:visible').filter({ hasText: /^Log in$/ }).first().click();
  const dlg = page.locator('[role="dialog"]');
  await dlg.locator('input[name="email"]').fill(EMAIL);
  await dlg.locator('input[name="password"]').fill(PW);
  await dlg.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin\//, { timeout: 20000 });
  
  const orgMatch = page.url().match(/\/admin\/o\/([a-f0-9-]+)/);
  const orgId = orgMatch ? orgMatch[1] : null;
  console.log('Org ID:', orgId);

  // Navigate to the daily cashout page
  const url = `https://www.rec.us/admin/o/${orgId}/finance/daily-cashout`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: /don.t show again/i }).click().catch(() => {});
  
  console.log('Final URL:', page.url());
  console.log('\n=== PAGE TEXT ===');
  const text = await page.locator('main').first().innerText().catch(() => page.locator('body').innerText());
  console.log(text);

  // Take screenshot
  await page.screenshot({ path: '/tmp/cashout-page.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/cashout-page.png');

  await browser.close();
})();
