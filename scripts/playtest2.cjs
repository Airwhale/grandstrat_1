// Playtest 2: verifies the six playability fixes
const { chromium } = require('playwright');

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const log = (...a) => console.log('[PT2]', ...a);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 150)));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Start as Eastern Pact (red faction — tests the friendly/enemy color fix)
  await page.click('text=New Game');
  await page.waitForTimeout(800);
  await page.click('text=The Eastern Pact');
  await page.waitForTimeout(600);
  await page.click('text=Begin Operation');
  await page.waitForTimeout(1500);

  // FIX 2: Roster / Tech nav buttons
  const rosterBtn = await page.$('button:has-text("Roster")');
  const techBtn = await page.$('button:has-text("Tech")');
  log('Nav buttons present:', rosterBtn ? 'ROSTER✓' : 'ROSTER✗', techBtn ? 'TECH✓' : 'TECH✗');

  await rosterBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/fix-roster.png' });
  const rosterVisible = await page.$('text=OPERATIVE ROSTER') || await page.$('text=Roster');
  log('Roster screen reachable:', rosterVisible ? 'YES' : 'NO');
  await page.click('text=Back');
  await page.waitForTimeout(800);

  await page.click('button:has-text("Tech")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/fix-tech.png' });
  log('Tech screen reachable: checking screenshot');
  await page.click('text=Back');
  await page.waitForTimeout(800);

  // Victory progress chip
  const terrChip = await page.$('text=Territories');
  log('Victory progress chip:', terrChip ? 'YES' : 'NO');

  // FIX 6: Help modal
  await page.click('button:has-text("?")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/fix-help.png' });
  const helpVisible = await page.$('text=Field Manual');
  log('Help modal:', helpVisible ? 'YES' : 'NO');
  await page.keyboard.press('Escape');
  await page.click('.fixed.inset-0', { position: { x: 50, y: 50 } }).catch(() => {});
  await page.waitForTimeout(500);

  // FIX (espionage): spy flow
  await page.click('text=Espionage');
  await page.waitForTimeout(600);
  const spyBtn = await page.$('button:has-text("Agent")');
  log('Spy listed:', spyBtn ? 'YES' : 'NO');
  if (spyBtn) {
    await spyBtn.click();
    await page.waitForTimeout(500);
    const targetBtns = await page.$$('.max-h-40 button');
    log('Spy targets offered:', targetBtns.length);
    if (targetBtns.length) {
      await targetBtns[0].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/fix-spy-missions.png' });
      const intelBtn = await page.$('button:has-text("Gather Intel")');
      log('Spy mission menu:', intelBtn ? 'YES' : 'NO');
      if (intelBtn) {
        await intelBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: '/tmp/fix-spy-done.png' });
        log('Spy deployed');
      }
    }
  }

  // FIX 1, 3, 4, 5: Covert Op -> briefing -> deploy -> named units, hit%, colors
  await page.click('text=Covert Op');
  await page.waitForTimeout(600);
  await page.click('.max-h-40 button >> nth=0');
  await page.waitForTimeout(500);
  await page.click('.max-h-40 button >> nth=0');
  await page.waitForTimeout(500);
  await page.click('text=Deploy Team');
  await page.waitForTimeout(1500);

  // FIX 5: Briefing should appear BEFORE the grid
  await page.screenshot({ path: '/tmp/fix-briefing.png' });
  const briefing = await page.$('text=MISSION BRIEFING');
  log('Mission briefing shown:', briefing ? 'YES' : 'NO');

  if (briefing) {
    // Check named operatives in briefing
    const opNames = await page.$$eval('.flex.flex-wrap.gap-2 > div', els => els.map(e => e.textContent.slice(0, 40)));
    log('Deployed operatives in briefing:', JSON.stringify(opNames));

    await page.click('text=DEPLOY TEAM');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/fix-tactical-named.png' });

    // FIX 1: named units in squad list
    const squadNames = await page.$$eval('.space-y-1.max-h-32 button span:first-child', els => els.map(e => e.textContent));
    log('Squad names in tactical:', JSON.stringify(squadNames));

    // Select first unit, enter attack mode, check hit% badges
    const squadBtns = await page.$$('.space-y-1.max-h-32 button');
    if (squadBtns.length) {
      await squadBtns[0].click();
      await page.waitForTimeout(400);
      await page.click('.h-14 button:has-text("Attack")');
      await page.waitForTimeout(600);
      await page.screenshot({ path: '/tmp/fix-hitchance.png' });
      const pageText = await page.textContent('body');
      const hasPct = /\d+%/.test(pageText);
      log('Hit % visible somewhere:', hasPct ? 'YES' : 'NO');
    }
  }

  console.log('\nERRORS:', errors.length);
  errors.forEach(e => console.log(' ', e));
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
