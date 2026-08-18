const Client = require('ssh2-sftp-client');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
});

const sftp = new Client();
async function main() {
  try {
    const config = {
      host: env.SPX_SSH_HOST,
      port: parseInt(env.SPX_SSH_PORT || '22'),
      username: env.SPX_SSH_USER,
      password: env.SPX_SSH_PASS,
      privateKey: env.SPX_SSH_KEY ? env.SPX_SSH_KEY.replace(/\\n/g, '\n') : undefined
    };
    await sftp.connect(config);
    const cssPath = '/root/SPX_1_2_1_linux64/ASSETS/templates/smartpx/faith/customize.css';
    
    let existingCss = '';
    try {
      const existing = await sftp.get(cssPath);
      existingCss = existing.toString();
    } catch(e) {}
    
    if (!existingCss.includes('FIX UNTUK VMIX')) {
      const newCss = existingCss + `

/* FIX UNTUK VMIX WEB BROWSER */
.f_center {
    left: 0 !important;
    right: 0 !important;
    margin: 0 auto !important;
    transform: none !important;
}
`;
      await sftp.put(Buffer.from(newCss), cssPath);
      console.log("Success! customize.css updated with vMix fix.");
    } else {
      console.log("Fix already applied.");
    }
    
    await sftp.end();
  } catch (err) {
    console.error(err);
  }
}
main();
