const fs = require('fs');
const content = fs.readFileSync('d:/project/O one/openbot-main.js', 'utf8');

function extract(re, len = 500) {
  let m = re.exec(content);
  if (m) {
    console.log('Found:', m[0]);
    console.log(content.slice(m.index, m.index + len));
  } else {
    console.log('Not found:', re);
  }
}

extract(/const AGENT_PROVIDERS\s*=/);
extract(/central-auth/);
extract(/openbot-team-server/);
extract(/function spawn|class.*ClientSession|startSession/);
