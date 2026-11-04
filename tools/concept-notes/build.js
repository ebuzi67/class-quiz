// 개념노트 + 백지테스트 PDF 만들기
// 사용법: node tools/concept-notes/build.js [단원파일이름...]   (예: 3-1_2 → units/3-1_2.js 만)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const { unitHtml } = require('./engine');

const OUT = path.join(__dirname, '..', '..', 'worksheets', '개념노트');
const only = process.argv.slice(2);
const files = fs.readdirSync(path.join(__dirname, 'units')).filter(f => f.endsWith('.js'))
  .filter(f => !only.length || only.includes(f.replace(/\.js$/, ''))).sort();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cn-'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const f of files) {
    const U = require(path.join(__dirname, 'units', f));
    const html = unitHtml(U);
    const base = `${U.code}_${U.unitNo}단원_${U.unitName.replace(/\s+/g, '')}`;
    for (const [kind, name] of [['note', '개념노트'], ['test', '개념백지테스트']]) {
      const h = path.join(tmp, `${kind}.html`);
      fs.writeFileSync(h, html[kind]);
      await page.goto('file://' + h, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const out = path.join(OUT, `${base}_${name}.pdf`);
      await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
      console.log(out);
    }
  }
  await browser.close();
})();
