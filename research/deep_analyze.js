const fs = require('fs');
const content = fs.readFileSync('d:/project/O one/openbot-main.js', 'utf8');

function extractSnippetAround(pattern, length = 600) {
  const index = content.search(pattern);
  if (index === -1) {
    console.log('Not found:', pattern);
    return;
  }
  console.log('=== Snippet around:', pattern, '===');
  console.log(content.slice(Math.max(0, index - 100), index + length));
}

extractSnippetAround(/class ProviderAccountStore/);
extractSnippetAround(/function startCodexSession|function startClaudeSession|runCodex|spawnProvider/);
extractSnippetAround(/preferredProvider|openbot-central-auth/);
extractSnippetAround(/routine_flow_links/);
