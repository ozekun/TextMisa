const fs = require('fs');
const Client = require('ssh2-sftp-client');

const env = {
  SPX_SSH_HOST: "103.146.63.150",
  SPX_SSH_PORT: "22",
  SPX_SSH_USER: "root",
  SPX_SSH_PASS: "C(Vzw)4qw+6{"
};

const sftp = new Client();
async function run() {
  try {
    await sftp.connect({
      host: env.SPX_SSH_HOST,
      port: parseInt(env.SPX_SSH_PORT),
      username: env.SPX_SSH_USER,
      password: env.SPX_SSH_PASS
    });

    const defaultPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/css/customize_Default.css';
    const activePath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css';

    console.log(`Reading default template: ${defaultPath}`);
    const defaultData = await sftp.get(defaultPath);

    console.log(`Writing default content to active template: ${activePath}`);
    await sftp.put(defaultData, activePath);

    console.log("Success! Active customize.css has been restored to customize_Default.css.");
  } catch (err) {
    console.error("Error during restoration:", err);
  } finally {
    await sftp.end();
  }
}

run();
