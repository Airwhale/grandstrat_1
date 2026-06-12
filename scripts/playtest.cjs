const { chromium } = require('playwright');

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const log = (...a) => console.log('[PLAYTEST]', ...a);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 150)));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Start game as Eastern Pact (military faction, good for testing combat)
  await page.click('text=New Game');
  await page.waitForTimeout(800);
  await page.click('text=The Eastern Pact');
  await page.waitForTimeout(600);
  await page.click('text=Begin Operation');
  await page.waitForTimeout(1500);
  log('Game started as Eastern Pact');

  // TEST 1: Move Forces flow
  await page.click('text=Move Forces');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/pt-01-move.png' });
  const moveSources = await page.$$eval('.max-h-40 button', els => els.map(e => e.textContent));
  log('Move sources offered:', moveSources.length, '->', (moveSources[0] || 'NONE').slice(0, 50));
  if (moveSources.length > 0) {
    await page.click('.max-h-40 button >> nth=0');
    await page.waitForTimeout(500);
    const targets = await page.$$eval('.max-h-40 button', els => els.map(e => e.textContent));
    log('Move targets offered:', targets.length);
    if (targets.length > 0) {
      await page.click('.max-h-40 button >> nth=0');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/pt-02-move-troops.png' });
      const confirmBtn = await page.$('text=Confirm Move');
      if (confirmBtn) { await confirmBtn.click(); log('Move Forces: COMPLETED'); }
      else log('Move Forces: NO CONFIRM BUTTON');
    } else { log('Move Forces: NO TARGETS - cancelling'); await page.click('text=✕ Cancel').catch(()=>{}); }
  }
  await page.waitForTimeout(500);

  // TEST 2: Attack flow
  await page.click('text=Attack');
  await page.waitForTimeout(600);
  const atkSources = await page.$$eval('.max-h-40 button', els => els.map(e => e.textContent));
  log('Attack sources:', atkSources.length);
  if (atkSources.length > 0) {
    await page.click('.max-h-40 button >> nth=0');
    await page.waitForTimeout(500);
    const atkTargets = await page.$$eval('.max-h-40 button', els => els.map(e => e.textContent));
    log('Attack targets:', atkTargets.length, '->', (atkTargets[0] || 'NONE').slice(0, 60));
    if (atkTargets.length > 0) {
      await page.click('.max-h-40 button >> nth=0');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/pt-03-attack-confirm.png' });
      await page.click('text=Attack!');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/pt-04-attack-result.png' });
      log('Attack: COMPLETED (auto-resolve)');
    } else { await page.click('text=✕ Cancel').catch(()=>{}); }
  }
  await page.waitForTimeout(500);

  // TEST 3: Covert Op (should trigger tactical combat)
  await page.click('text=Covert Op');
  await page.waitForTimeout(600);
  const coSources = await page.$$eval('.max-h-40 button', els => els.map(e => e.textContent));
  log('CovertOp sources:', coSources.length);
  if (coSources.length > 0) {
    await page.click('.max-h-40 button >> nth=0');
    await page.waitForTimeout(500);
    const coTargets = await page.$$eval('.max-h-40 button', els => els.map(e => e.textContent));
    log('CovertOp targets:', coTargets.length);
    if (coTargets.length > 0) {
      await page.click('.max-h-40 button >> nth=0');
      await page.waitForTimeout(500);
      await page.click('text=Deploy Team');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/pt-05-tactical.png' });
      const url = page.url();
      const tacticalVisible = await page.$('text=YOUR TURN');
      log('Tactical combat entered:', tacticalVisible ? 'YES' : 'NO');

      if (tacticalVisible) {
        // Try selecting a unit and attacking
        // Click first squad member in squad list
        const squadBtns = await page.$$('button:has-text("Operative")');
        log('Squad buttons found:', squadBtns.length);
        if (squadBtns.length > 0) {
          await squadBtns[0].click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: '/tmp/pt-06-unit-selected.png' });
          // Try Attack mode
          const atkBtn = await page.$('.h-14 button:has-text("Attack")');
          if (atkBtn) {
            const disabled = await atkBtn.isDisabled();
            log('Attack button disabled?', disabled);
          }
          // End tactical turn
          await page.click('.h-14 button:has-text("End Turn")');
          await page.waitForTimeout(1500);
          await page.screenshot({ path: '/tmp/pt-07-after-enemy-turn.png' });
          log('Enemy turn processed');
        }
      }
    }
  }

  console.log('\\nERRORS:', errors.length);
  errors.forEach(e => console.log(' ', e));
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
