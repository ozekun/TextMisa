const Client = require('ssh2-sftp-client');
const fs = require('fs');

const env = {
  SPX_SSH_HOST: "103.146.63.150",
  SPX_SSH_PORT: "22",
  SPX_SSH_USER: "root",
  SPX_SSH_PASS: "C(Vzw)4qw+6{"
};

async function applyLargeBox() {
  const sftp = new Client();
  try {
    console.log('Menghubungkan ke SPX server via SFTP...');
    await sftp.connect({
      host: env.SPX_SSH_HOST,
      port: parseInt(env.SPX_SSH_PORT),
      username: env.SPX_SSH_USER,
      password: env.SPX_SSH_PASS
    });

    const activePath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css';
    const existingBuffer = await sftp.get(activePath);
    let content = existingBuffer.toString();

    // Hapus marker lama jika ada
    const marker = '/* ========================================================';
    if (content.includes(marker)) {
      content = content.split(marker)[0].trim();
    }

    const cssAddition = `

/* ========================================================
   CUSTOM LARGE BOX (1500px), FONTS (85px), & EXTRA SPACING
   ======================================================== */

:root {
    --box-width-centr: 1500px;
}

/* FIX ALIGNMENT UNTUK VMIX + NAIKKAN POSISI AGAR TEKS F2 TIDAK TERPOTONG */
.f_center {
    width: var(--box-width-centr, 1500px) !important;
    left: 0 !important;
    right: 0 !important;
    margin: 0 auto var(--window-margin-v, 86px) auto !important;
    margin-bottom: var(--window-margin-v, 86px) !important;
    transform: none !important;
}

/* FONT HEADLINE / KOTAK KUNING (F0) */
.HEADLINE {
    font-size: 64px !important;
    line-height: 48px !important;
}

/* FONT UTAMA / LIRIK / BACAAN (F1) - 85px */
.txtitem {
    font-size: 85px !important;
    line-height: 90px !important;
}

/* FONT FOOTER (F2) */
.FOOTERBOX {
    font-size: 46px !important;
}

/* JARAK LEGA ANTARA KOTAK KUNING (F0) & TEKS UTAMA (F1) */
#textureZone {
    padding-top: 5.4em !important;
    padding-bottom: 2.8em !important;
}

/* JARAK LEGA DIANTARA TEKS UTAMA (F1) & FOOTER (F2) */
#footerZone {
    margin-top: 3.2em !important;
}

/* KETIKA TIDAK ADA FOOTER F2 (BACAAN), SEIMBANGKAN PADDING BAWAH AGAR TEKS F1 DI TENGAH */
#textureZone.no-footer,
#textureZone:has(#footerZone[style*="display: none"]) {
    padding-bottom: 5.4em !important;
}
`;

    const newContent = content + cssAddition;
    await sftp.put(Buffer.from(newContent, 'utf8'), activePath);
    console.log('BERHASIL! Jarak ekstra antara f0-f1 dan f1-f2 telah diterapkan ke server SPX.');

  } catch (err) {
    console.error('Terjadi error:', err);
  } finally {
    await sftp.end();
  }
}

applyLargeBox();
