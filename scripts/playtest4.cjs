// Playtest 4: demo mode, tutorial, tooltips, territory dossier
const { chromium } = require('playwright');

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:3000/grandstrat_1';
const log = (...a) => console.log('[PT4]', ...a);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 150)));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/pt4-menu.png' });

  // Demo button present?
  const demoBtn = await page.$('text=Quick Demo');
  log('Quick Demo button:', demoBtn ? 'YES' : 'NO');

  // Launch demo (retry for hydration)
  for (let i = 0; i < 5; i++) {
    await page.click('text=Quick Demo').catch(() => {});
    const ok = await page.waitForSelector('text=Welcome, Commander', { timeout: 3000 }).catch(() => null);
    if (ok) break;
  }
  await page.screenshot({ path: '/tmp/pt4-tutorial1.png' });
  log('Tutorial step 1 visible:', (await page.$('text=Welcome, Commander')) ? 'YES' : 'NO');

  // Step through tutorial
  for (let i = 0; i < 7; i++) {
    const next = await page.$('button:has-text("Next")') || await page.$('button:has-text("Begin")');
    if (!next) break;
    if (i === 1) await page.screenshot({ path: '/tmp/pt4-tutorial2.png' });
    await next.click();
    await page.waitForTimeout(400);
  }
  log('Tutorial completed');
  await page.waitForTimeout(500);

  // Demo state: turn 6, veteran roster, news ticker
  const bodyText = await page.textContent('body');
  log('Turn 6 shown:', bodyText.includes('6') ? 'YES' : 'check');
  log('Demo ticker present:', bodyText.includes('DEMO CAMPAIGN') ? 'YES' : 'NO');

  // Hover an action for tooltip
  await page.hover('text=Covert Op');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/pt4-tooltip.png' });
  const tooltipShown = (await page.textContent('body')).includes('PERMANENTLY');
  log('Covert Op tooltip:', tooltipShown ? 'YES' : 'NO');

  // Click a territory -> dossier card in intel panel
  await page.mouse.move(700, 450);
  // Click Ukraine-ish node: use evaluate to click via store instead for determinism
  await page.evaluate(() => {
    const anyWin = window;
    // click first territory node in DOM (they're motion.divs with cursor-pointer)
  });
  // click a node on the map (Eastern US at ~22%,35% of map area; map starts after 256px left panel)
  await page.mouse.click(256 + (1400 - 256 - 256) * 0.22, 48 + (900 - 48 - 100) * 0.35);
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/pt4-dossier.png' });
  const dossier = (await page.textContent('body')).includes('Garrison');
  log('Territory dossier card:', dossier ? 'YES' : 'NO');

  // Roster shows demo veterans with callsigns
  await page.click('button:has-text("Roster")');
  await page.waitForTimeout(1000);
  const rosterText = await page.textContent('body');
  log('Veteran callsign "Specter":', rosterText.includes('Specter') ? 'YES' : 'NO');
  await page.screenshot({ path: '/tmp/pt4-roster.png' });

  console.log('\nERRORS:', errors.length);
  errors.forEach(e => console.log(' ', e));
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
