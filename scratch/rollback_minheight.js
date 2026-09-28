const Client = require('ssh2-sftp-client');
const fs = require('fs');

const env = {
  SPX_SSH_HOST: "103.146.63.150",
  SPX_SSH_PORT: "22",
  SPX_SSH_USER: "root",
  SPX_SSH_PASS: "C(Vzw)4qw+6{"
};

async function rollback() {
  const sftp = new Client();
  try {
    console.log('Menghubungkan ke server SPX via SFTP untuk Rollback...');
    await sftp.connect({
      host: env.SPX_SSH_HOST,
      port: parseInt(env.SPX_SSH_PORT),
      username: env.SPX_SSH_USER,
      password: env.SPX_SSH_PASS
    });

    const activePath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css';
    const remoteBackupPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css.bak';
    const localBackupPath = './scratch/backup_customize_before_minheight.css';

    let backupContent = null;
    if (fs.existsSync(localBackupPath)) {
      console.log(`Menggunakan backup lokal dari ${localBackupPath}...`);
      backupContent = fs.readFileSync(localBackupPath);
    } else {
      console.log(`Mengambil backup dari server ${remoteBackupPath}...`);
      backupContent = await sftp.get(remoteBackupPath);
    }

    if (backupContent) {
      console.log('Mengembalikan customize.css ke versi sebelum perubahan...');
      await sftp.put(backupContent, activePath);
      console.log('ROLLBACK BERHASIL! customize.css telah kembali seperti semula.');
    } else {
      console.error('File backup tidak ditemukan!');
    }
  } catch (err) {
    console.error('Error saat rollback:', err);
  } finally {
    await sftp.end();
  }
}

rollback();
