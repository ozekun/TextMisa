const Client = require('ssh2-sftp-client');
const fs = require('fs');

const env = {
  SPX_SSH_HOST: "103.146.63.150",
  SPX_SSH_PORT: "22",
  SPX_SSH_USER: "root",
  SPX_SSH_PASS: "C(Vzw)4qw+6{"
};

async function applySpacing() {
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
    const remoteBackupPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css.bak';
    const localBackupPath = './scratch/backup_customize_before_spacing.css';

    const existingBuffer = await sftp.get(activePath);
    const existingContent = existingBuffer.toString();

    // Simpan backup lokal
    fs.writeFileSync(localBackupPath, existingContent, 'utf8');
    await sftp.put(existingBuffer, remoteBackupPath);

    // Hapus marker lama jika ada
    let cleanContent = existingContent;
    const markers = [
      '/* FIX UNTUK VMIX WEB BROWSER',
      '/* JARAK ANTARA KOTAK KUNING & TEKS F1 */',
      '/* JARAK ANTARA KOTAK KUNING, TEKS F1, DAN FOOTER F2 */',
      '/* CUSTOM MIN-HEIGHT & PADDING',
      '/* PADDING BAWAH KETIKA TIDAK ADA FOOTER F2 (BACAAN) */',
      '/* JARAK DIANTARA TEKS F1 & FOOTER F2 */'
    ];

    for (const m of markers) {
      if (cleanContent.includes(m)) {
        cleanContent = cleanContent.split(m)[0].trim();
      }
    }

    const cssAddition = `

/* FIX UNTUK VMIX WEB BROWSER + NAIKKAN POSISI DARI BAWAH AGAR TEKS F2 TIDAK TERPOTONG */
.f_center {
    left: 0 !important;
    right: 0 !important;
    margin: 0 auto var(--window-margin-v, 86px) auto !important;
    margin-bottom: var(--window-margin-v, 86px) !important;
    transform: none !important;
}

/* JARAK ANTARA KOTAK KUNING & TEKS F1 */
#textureZone {
    padding-top: 3.8em !important;
}

/* JARAK DIANTARA TEKS F1 & FOOTER F2 */
#footerZone {
    margin-top: 2em !important;
}

/* KETIKA TIDAK ADA FOOTER F2 (BACAAN), SEIMBANGKAN PADDING BAWAH AGAR TEKS F1 DI TENGAH */
#textureZone.no-footer,
#textureZone:has(#footerZone[style*="display: none"]) {
    padding-bottom: 3.8em !important;
}
`;

    const newContent = cleanContent + cssAddition;
    await sftp.put(Buffer.from(newContent, 'utf8'), activePath);
    console.log('BERHASIL! Posisi box dinaikkan dengan margin-bottom 86px sehingga f2 tidak terpotong.');
  } catch (err) {
    console.error('Terjadi error:', err);
  } finally {
    await sftp.end();
  }
}

applySpacing();
