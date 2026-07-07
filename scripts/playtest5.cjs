// Playtest 5: abilities, mission types, coalition AI, income ledger, mute, archive
const { chromium } = require('playwright');

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:3000/grandstrat_1';
const log = (...a) => console.log('[PT5]', ...a);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 200)));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Launch demo (has veteran squad with abilities)
  for (let i = 0; i < 5; i++) {
    await page.click('text=Quick Demo').catch(() => {});
    const ok = await page.waitForSelector('text=Welcome, Commander', { timeout: 3000 }).catch(() => null);
    if (ok) break;
  }
  // Skip tutorial
  await page.click('text=Skip tutorial');
  await page.waitForTimeout(600);
  log('Demo started, tutorial skipped');

  // Region labels on map?
  const body1 = await page.textContent('body');
  log('Region labels:', body1.includes('North America') ? 'YES' : 'NO');

  // Income ledger tooltip on credits
  await page.hover('.flex.items-center.gap-5 > div >> nth=0');
  await page.waitForTimeout(400);
  // ledger only present after first endTurn; check mute button instead now
  const muteBtn = await page.$('button:has-text("🔊")') || await page.$('button:has-text("🔇")');
  log('Mute button:', muteBtn ? 'YES' : 'NO');

  // End a turn -> income ledger should populate
  await page.click('text=End Turn');
  await page.waitForTimeout(300);
  await page.click('text=Confirm');
  await page.waitForTimeout(1200);
  // handle event modal if it appeared (turn 7)
  const evChoice = await page.$('.space-y-3 button');
  if (evChoice) { await evChoice.click(); await page.waitForTimeout(600); log('Event resolved'); }

  await page.hover('.flex.items-center.gap-5 > div >> nth=0');
  await page.waitForTimeout(500);
  const body2 = await page.textContent('body');
  log('Income ledger tooltip:', body2.includes('Income last turn') ? 'YES' : 'NO');
  await page.screenshot({ path: '/tmp/pt5-ledger.png' });

  // Covert op -> mission types & abilities. Try each source until one has targets.
  let missionType = '';
  for (let srcIdx = 0; srcIdx < 8; srcIdx++) {
    await page.click('text=Covert Op');
    await page.waitForTimeout(500);
    const sources = await page.$$('.max-h-40 button');
    if (srcIdx >= sources.length) { log('No covert op source with targets found'); break; }
    await sources[srcIdx].click();
    await page.waitForTimeout(400);
    const targets = await page.$$('.max-h-40 button');
    if (!targets.length) {
      await page.click('text=✕ Cancel').catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }
    await targets[0].click();
    await page.waitForTimeout(400);
    await page.click('text=Deploy Team');
    await page.waitForTimeout(1500);
    const briefText = await page.textContent('body');
    missionType = briefText.includes('EXTRACTION') ? 'extraction' : briefText.includes('DEFENSE') ? 'defense' : 'assault';
    log('Mission briefing type:', missionType.toUpperCase());
    await page.screenshot({ path: '/tmp/pt5-briefing.png' });
    await page.click('text=DEPLOY TEAM');
    await page.waitForTimeout(1500);
    break;
  }

  // In tactical: select first unit, check ability buttons
  const squadBtns = await page.$$('.space-y-1.max-h-32 button');
  log('Squad size:', squadBtns.length);
  if (squadBtns.length) {
    await squadBtns[0].click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/pt5-abilities.png' });
    const bodyT = await page.textContent('body');
    log('Ability section visible:', bodyT.includes('ABILITIES') || bodyT.includes('Abilities') ? 'YES' : 'NO');

    // Try clicking the first ability button (purple)
    const abilityBtns = await page.$$('.space-y-1 button.w-full.text-left.text-\\[10px\\]');
    log('Ability buttons found:', abilityBtns.length);
    if (abilityBtns.length) {
      const name = await abilityBtns[0].textContent();
      await abilityBtns[0].click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: '/tmp/pt5-ability-targeting.png' });
      const after = await page.textContent('body');
      log(`Clicked ability "${(name||'').trim().slice(0,25)}" — targeting mode or executed:`,
        after.includes('purple-highlighted') || after.includes('surges') || after.includes('vanishes') ? 'YES' : 'check screenshot');
      await page.keyboard.press('Escape');
    }

    // Keyboard: E ends turn
    await page.keyboard.press('e');
    await page.waitForTimeout(1200);
    const turnText = await page.textContent('body');
    log('E key ended turn (Turn 2 shown):', turnText.includes('Turn 2') ? 'YES' : 'check');
    await page.screenshot({ path: '/tmp/pt5-tactical-turn2.png' });
  }

  console.log('\nERRORS:', errors.length);
  errors.forEach(e => console.log(' ', e));
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
