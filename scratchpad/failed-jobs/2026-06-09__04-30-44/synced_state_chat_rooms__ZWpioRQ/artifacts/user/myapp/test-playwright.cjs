const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome', 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }).catch(() => null);

  if (!browser) {
    console.log("Could not launch playwright with default chromium. Trying to install or use puppeteer...");
    process.exit(1);
  }

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/chat/general');
  
  await page.waitForSelector('[data-testid="clear-btn"]');
  await page.click('[data-testid="clear-btn"]');
  await page.waitForTimeout(500);
  
  await page.fill('[data-testid="chat-input"]', 'hello redwood');
  await page.click('[data-testid="send-btn"]');
  await page.waitForTimeout(500);
  
  const messages = await page.$$eval('[data-testid="chat-message"]', els => els.map(el => el.textContent));
  console.log('Messages in general:', messages);

  await page.goto('http://localhost:5173/chat/other');
  await page.waitForSelector('[data-testid="clear-btn"]');
  await page.click('[data-testid="clear-btn"]');
  await page.waitForTimeout(500);

  const messagesOther = await page.$$eval('[data-testid="chat-message"]', els => els.map(el => el.textContent));
  console.log('Messages in other:', messagesOther);

  await browser.close();
})();