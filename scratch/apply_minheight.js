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
    console.log('Connecting to SPX server via SFTP...');
    await sftp.connect({
      host: env.SPX_SSH_HOST,
      port: parseInt(env.SPX_SSH_PORT),
      username: env.SPX_SSH_USER,
      password: env.SPX_SSH_PASS
    });

    const activePath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css';
    const remoteBackupPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css.bak';
    const localBackupPath = './scratch/backup_customize_before_minheight.css';

    console.log(`Downloading current customize.css from ${activePath}...`);
    const existingBuffer = await sftp.get(activePath);
    const existingContent = existingBuffer.toString();

    // 1. Simpan backup lokal
    fs.writeFileSync(localBackupPath, existingContent, 'utf8');
    console.log(`[Backup Lokal] Tersimpan di: ${localBackupPath}`);

    // 2. Simpan backup remote di server
    await sftp.put(existingBuffer, remoteBackupPath);
    console.log(`[Backup Remote] Tersimpan di server: ${remoteBackupPath}`);

    // 3. Tambahkan aturan min-height dan padding jika belum ada
    const marker = '/* CUSTOM MIN-HEIGHT & PADDING (BACAAN & 1-LINE FIX) */';
    let newContent = existingContent;

    if (newContent.includes(marker)) {
      // Hapus versi lama jika ada untuk diganti dengan yang terbaru
      const parts = newContent.split(marker);
      newContent = parts[0].trim();
    }

    const cssAddition = `

${marker}
#textureZone {
    min-height: 180px;
    padding-top: 3.8em !important;
    padding-bottom: 2.5em !important;
}

#textZone {
    min-height: 90px !important;
}
`;

    newContent = newContent + cssAddition;

    console.log('Mengunggah customize.css yang telah diperbarui ke server...');
    await sftp.put(Buffer.from(newContent, 'utf8'), activePath);
    console.log('BERHASIL! customize.css di server telah diperbarui dengan min-height dan padding baru.');

  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    await sftp.end();
  }
}

main();
