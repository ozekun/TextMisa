const Client = require('ssh2-sftp-client');
const fs = require('fs');

const env = {
  SPX_SSH_HOST: "103.146.63.150",
  SPX_SSH_PORT: "22",
  SPX_SSH_USER: "root",
  SPX_SSH_PASS: "C(Vzw)4qw+6{"
};

async function main() {
  const sftp = new Client();
  try {
    console.log('Menghubungkan ke SPX server via SFTP...');
    await sftp.connect({
      host: env.SPX_SSH_HOST,
      port: parseInt(env.SPX_SSH_PORT),
      username: env.SPX_SSH_USER,
      password: env.SPX_SSH_PASS
    });

    // 1. UPDATE SPX_Faith.html
    const htmlPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/SPX_Faith.html';
    const htmlBuffer = await sftp.get(htmlPath);
    let htmlContent = htmlBuffer.toString();

    const targetRegex = /if\s*\(!document\.getElementById\('footer'\)\.innerText\)\s*\{\s*document\.getElementById\('footerZone'\)\.style\.display\s*=\s*'none'\s*\}/;

    const replacement = `if(!document.getElementById('footer').innerText) {
            document.getElementById('footerZone').style.display = 'none';
            document.getElementById('textureZone').classList.add('no-footer');
        } else {
            document.getElementById('footerZone').style.display = '';
            document.getElementById('textureZone').classList.remove('no-footer');
        }`;

    if (targetRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(targetRegex, replacement);
      await sftp.put(Buffer.from(htmlContent, 'utf8'), htmlPath);
      console.log('SPX_Faith.html BERHASIL diupdate dengan class no-footer!');
    } else if (htmlContent.includes("classList.add('no-footer')")) {
      console.log('SPX_Faith.html sudah memiliki logic no-footer.');
    } else {
      console.log('Target regex tidak cocok pada SPX_Faith.html');
    }

    // 2. UPDATE customize.css
    const cssPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css';
    const cssBuffer = await sftp.get(cssPath);
    let cssContent = cssBuffer.toString();

    const marker = '/* PADDING BAWAH KETIKA TIDAK ADA FOOTER F2 (BACAAN) */';
    if (cssContent.includes(marker)) {
      cssContent = cssContent.split(marker)[0].trim();
    }

    const cssAddition = `

${marker}
#textureZone.no-footer,
#textureZone:has(#footerZone[style*="display: none"]) {
    padding-bottom: 3.8em !important;
}
`;

    cssContent = cssContent + cssAddition;
    await sftp.put(Buffer.from(cssContent, 'utf8'), cssPath);
    console.log('customize.css BERHASIL diupdate dengan padding-bottom untuk no-footer!');

    console.log('SEMUA PENGATURAN BERHASIL DITERAPKAN!');

  } catch (err) {
    console.error('Terjadi error:', err);
  } finally {
    await sftp.end();
  }
}

main();
