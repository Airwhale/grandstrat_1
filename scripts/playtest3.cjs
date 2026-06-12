// Playtest 3: full combat — move into range, verify hit %, fight to the end
const { chromium } = require('playwright');

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const log = (...a) => console.log('[PT3]', ...a);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 150)));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Retry New Game until faction select appears (hydration can swallow early clicks)
  for (let i = 0; i < 5; i++) {
    await page.click('text=New Game').catch(() => {});
    const ok = await page.waitForSelector('text=SELECT YOUR FACTION', { timeout: 3000 }).catch(() => null);
    if (ok) break;
  }
  await page.click('text=The Eastern Pact');
  await page.waitForSelector('text=Begin Operation', { timeout: 10000 });
  await page.click('text=Begin Operation');
  await page.waitForSelector('text=STRATEGIC PHASE', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Covert op into tactical
  await page.click('text=Covert Op');
  await page.waitForTimeout(600);
  await page.click('.max-h-40 button >> nth=0');
  await page.waitForTimeout(400);
  await page.click('.max-h-40 button >> nth=0');
  await page.waitForTimeout(400);
  await page.click('text=Deploy Team');
  await page.waitForTimeout(1200);
  await page.click('text=DEPLOY TEAM');
  await page.waitForTimeout(1500);

  // Fight up to 15 rounds: each round, move every unit toward enemies then attack what's in range
  for (let round = 0; round < 15; round++) {
    const state = await page.evaluate(() => {
      // grab unit positions from the store via window — not exposed; use DOM instead
      return null;
    });

    // For each squad member: select, try attack first (if % badge appears, click target), else move toward enemies
    const squadBtns = await page.$$('.space-y-1.max-h-32 button');
    for (const btn of squadBtns) {
      const txt = await btn.textContent();
      if (!txt || txt.includes('0/')) continue;
      await btn.click();
      await page.waitForTimeout(200);

      // Attack mode — look for % badges on enemies
      await page.click('.h-14 button:has-text("Attack")').catch(() => {});
      await page.waitForTimeout(300);
      let badges = await page.$$('.font-mono.font-bold.pointer-events-none');
      if (badges.length > 0) {
        // click the enemy unit under the first badge: badge parent is the unit div
        const unitDiv = await badges[0].evaluateHandle(el => el.parentElement);
        await unitDiv.asElement().click({ force: true });
        await page.waitForTimeout(400);
        if (round === 0 || badges.length) log(`round ${round}: attacked (badges: ${badges.length})`);
      } else {
        // Move toward the enemies: click a move tile far down
        await page.click('.h-14 button:has-text("Move")').catch(() => {});
        await page.waitForTimeout(300);
        // pick lowest highlighted move tile: tiles with bg #1a2a4e
        const moveTiles = await page.$$eval('div[style*="rgb(26, 42, 78)"]', els =>
          els.map((e, i) => ({ i, top: e.getBoundingClientRect().top, left: e.getBoundingClientRect().left }))
        );
        if (moveTiles.length) {
          const lowest = moveTiles.reduce((a, b) => (b.top > a.top ? b : a));
          const handles = await page.$$('div[style*="rgb(26, 42, 78)"]');
          await handles[lowest.i].click({ force: true }).catch(() => {});
          await page.waitForTimeout(250);
        }
      }
    }

    // Check for mission complete
    const done = await page.$('button:has-text("Continue")');
    if (done) {
      await page.screenshot({ path: '/tmp/pt3-mission-end.png' });
      const victory = await page.$('button:has-text("VICTORY")');
      log('MISSION COMPLETE:', victory ? 'VICTORY' : 'DEFEAT', 'on round', round);
      await done.click();
      await page.waitForTimeout(1500);
      break;
    }
    await page.click('.h-14 button:has-text("End Turn")').catch(() => {});
    await page.waitForTimeout(800);
  }

  // Back on strategic: check ticker for KIA / mission outcome, then look at roster for XP/wounds/memorial
  await page.screenshot({ path: '/tmp/pt3-after-combat.png' });
  await page.click('button:has-text("Roster")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/pt3-roster-after.png' });
  const bodyText = await page.textContent('body');
  log('Roster mentions wounded:', /wounded/i.test(bodyText) ? 'YES' : 'no');
  log('Memorial mentions KIA:', /KIA|killed/i.test(bodyText) ? 'YES' : 'no');

  console.log('\nERRORS:', errors.length);
  errors.forEach(e => console.log(' ', e));
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
