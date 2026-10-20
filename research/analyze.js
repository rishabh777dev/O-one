const fs = require('fs');

const content = fs.readFileSync('d:/project/O one/openbot-main.js', 'utf8');
console.log('Total content length:', content.length);

function search(label, re, limit = 5) {
  console.log('\n=== ' + label + ' ===');
  const matches = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    matches.push(m[0].slice(0, 200));
    if (matches.length >= limit) break;
  }
  console.log(matches);
}

// Endpoints
search('OpenBot URLs', /https:\/\/[a-zA-Z0-9.-]*openbot\.run[^\s"'`)]+/g, 10);
search('Cloudflare / Workers / API endpoints', /https:\/\/[a-zA-Z0-9.-]+\/(v[0-9]|api|trpc)[^\s"'`)]+/g, 10);

// Providers
search('ACP / Provider sessions', /class\s+[A-Za-z0-9_]*Provider[A-Za-z0-9_]*/g, 10);
search('Codex / Claude Spawning', /spawn\([^\n]{1,100}(codex|claude|opencode)/g, 10);

// Memory
search('Memory search and FTS', /agent_memory_search[^\n]{1,150}/g, 5);

// Routine / Flow
search('Routine Flow', /routine_flow_[^\n]{1,150}/g, 5);
