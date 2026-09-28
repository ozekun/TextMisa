const fs = require('fs');
const Client = require('ssh2-sftp-client');

const env = {
  SPX_SSH_HOST: "103.146.63.150",
  SPX_SSH_PORT: "22",
  SPX_SSH_USER: "root",
  SPX_SSH_PASS: "C(Vzw)4qw+6{"
};

const sftp = new Client();
sftp.connect({
  host: env.SPX_SSH_HOST,
  port: parseInt(env.SPX_SSH_PORT),
  username: env.SPX_SSH_USER,
  password: env.SPX_SSH_PASS
}).then(() => {
  return sftp.get('/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/css/spx_layout.css');
}).then(data => {
  console.log('CONTENT OF spx_layout.css:');
  console.log(data.toString());
  sftp.end();
}).catch(err => {
  console.error(err);
  sftp.end();
});
