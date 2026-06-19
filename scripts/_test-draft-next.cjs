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
    const state = {
      form: {
        entityName: "Test Brand",
        entityType: "organization",
        reportCategory: "commercial",
        reportMetadata: { orgType: "brand", country: "syria", city: "damascus", address: "Area" },
        entityRole: "brand",
        allegationDescription: "desc",
        allegationPeriod: "",
        allegationLocation: "",
        allegationClassification: "",
        sourceLinks: [],
        sourceFiles: [],
        submitterEmail: "",
        submitterName: "",
        isAnonymous: true,
      },
      currentStep: "report-details",
      dirty: true,
      visited: ["report-category","entity-type-name","location-info","report-details"],
      completed: ["report-category","entity-type-name","location-info"],
      entityChosen: true,
    };
    await page.goto('https://hlshajara.com/ar/submit', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate((s) => sessionStorage.setItem('hls.submit.draft.v1', JSON.stringify(s)), state);
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    console.log('after reload:', page.url());

    // click resume draft button by text
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent && el.textContent.includes('استئناف'));
      if (b) b.click();
    });
    await sleep(2000);
    console.log('after resume:', page.url());

    // click next
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent && el.textContent.includes('التالي'));
      if (b) b.click();
    });
    await sleep(3000);
    console.log('after next:', page.url());
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
