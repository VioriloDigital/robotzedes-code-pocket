const { chromium } = require('playwright');
const fs = require('fs');
const jsQR = require('jsqr') /* npm i jsqr pngjs */; const { PNG } = require('pngjs');
const R = '/home/user/robotzedes-code-pocket/arta-access-map/';
const URL_ = 'https://viorilodigital.github.io/robotzedes-code-pocket/';
const qrjs = fs.readFileSync(R + 'node_modules/qrcode-generator/qrcode.js', 'utf8');
const logo = 'data:image/png;base64,' + fs.readFileSync(R + 'branding/web/icon-512.png').toString('base64');
const html = (poster) => `<html><head><meta charset="utf-8"><style>
  body{margin:0;font-family:system-ui,"Segoe UI",Roboto,sans-serif;background:#fff}
  .p{width:${poster ? 1240 : 800}px;padding:${poster ? '90px 70px' : '40px'};box-sizing:border-box;text-align:center}
  h1{color:#0b5cad;font-size:${poster ? 96 : 56}px;margin:${poster ? '20px 0 10px' : '0 0 6px'}}
  .sub{font-size:${poster ? 40 : 26}px;color:#333;margin:0 auto 40px;max-width:24em;line-height:1.35}
  .qr{position:relative;width:${poster ? 820 : 600}px;margin:0 auto}.qr svg{display:block;width:100%;height:auto}
  .qr img{position:absolute;left:50%;top:50%;width:22%;transform:translate(-50%,-50%);border-radius:18%;outline:10px solid #fff}
  .url{font-size:${poster ? 34 : 24}px;font-weight:600;margin-top:24px;color:#111}
  .top img{width:${poster ? 170 : 0}px;border-radius:24%}
  .foot{font-size:28px;color:#555;margin-top:36px;line-height:1.4}
</style></head><body><div class="p">
  ${poster ? `<div class="top"><img src="${logo}"></div>` : ''}
  <h1>Προσβάσιμη Άρτα</h1>
  <p class="sub">${poster ? 'Ο χάρτης με τα προσβάσιμα σημεία της Άρτας. Σκάναρε με την κάμερα του κινητού σου:' : 'Σκάναρε για να ανοίξεις την εφαρμογή'}</p>
  <div class="qr" id="qr"></div>
  <div class="url">${URL_.replace('https://', '').replace(/\/$/, '')}</div>
  ${poster ? '<p class="foot">Ράμπες • WC ΑμεΑ • Θέσεις στάθμευσης • Δημόσιες υπηρεσίες<br>Πρόσθεσε κι εσύ προσβάσιμα σημεία με φωτογραφία!</p>' : ''}
</div><script>${qrjs}
  const q = qrcode(0,'H'); q.addData(${JSON.stringify(URL_)},'Byte'); q.make();
  document.getElementById('qr').innerHTML = q.createSvgTag({cellSize:8,margin:2,scalable:true});
  const i = new Image(); i.src = ${JSON.stringify(logo)}; document.getElementById('qr').append(i);
</script></body></html>`;
const decode = (f) => { const png = PNG.sync.read(fs.readFileSync(f)); const r = jsQR(new Uint8ClampedArray(png.data), png.width, png.height); return r && r.data; };
(async () => {
  const b = await chromium.launch();
  for (const [poster, out] of [[false, R + 'branding/qr-prosvasimi-arta.png'], [true, R + 'branding/afisa-qr-prosvasimi-arta.png']]) {
    const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: poster ? 1240 : 800, height: 600 } });
    await p.setContent(html(poster)); await p.waitForTimeout(300);
    await p.locator('.p').screenshot({ path: out });
    console.log(out.split('/').pop(), '→', decode(out));
    await p.close();
  }
  await b.close();
})();
