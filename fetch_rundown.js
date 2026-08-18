const fs = require('fs');
const Client = require('ssh2-sftp-client');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim().replace(/"/g, '');
  return acc;
}, {});

const sftp = new Client();
sftp.connect({
  host: env.SPX_SSH_HOST,
  port: 22,
  username: env.SPX_SSH_USER,
  password: env.SPX_SSH_PASS
}).then(() => {
  return sftp.get('/root/SPX_1_2_1_linux64/DATAROOT/TEKS OTOMATIS/data/MISA_NATAL.json');
}).then(data => {
  console.log(data.toString());
  sftp.end();
}).catch(err => {
  console.error(err);
  sftp.end();
});
