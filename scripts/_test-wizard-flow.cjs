const puppeteer = require('puppeteer');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) console.log('navigated:', frame.url()); });
  page.on('load', () => console.log('load:', page.url()));
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  try {
    await page.goto('https://hlshajara.com/ar/submit', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1000);
    console.log('start url:', page.url());

    const clickByText = async (text) => {
      const clicked = await page.evaluate((txt) => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const b = btns.find(el => el.textContent && el.textContent.includes(txt));
        if (b) { b.click(); return true; }
        return false;
      }, text);
      console.log('click', text, clicked);
      return clicked;
    };

    const cards1 = await page.$$('.choice-card');
    if (cards1[0]) { await cards1[0].click(); await sleep(500); }
    await clickByText('التالي');
    await sleep(1500);
    console.log('after cat next:', page.url());

    const cards2 = await page.$$('.choice-card');
    if (cards2[0]) { await cards2[0].click(); await sleep(500); }
    await clickByText('التالي');
    await sleep(1500);
    console.log('after subtype next:', page.url());

    const inputs = await page.$$('input.ds-input');
    for (let i=0; i<Math.min(inputs.length, 4); i++) await inputs[i].type('test');
    await clickByText('التالي');
    await sleep(1500);
    console.log('after location next:', page.url());

    const cards3 = await page.$$('.choice-card');
    if (cards3[0]) { await cards3[0].click(); await sleep(500); }
    await clickByText('التالي');
    await sleep(2500);
    console.log('after report-details next:', page.url());
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
