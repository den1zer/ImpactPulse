const path = require('path');
const fs = require('fs');

module.exports = async function(context) {
  if (context.electronPlatformName !== 'linux') return;
  
  const appOutDir = context.appOutDir;
  const executableName = context.packager.executableName;
  const executablePath = path.join(appOutDir, executableName);
  const binPath = path.join(appOutDir, `${executableName}.bin`);
  
  // Rename the actual electron binary
  fs.renameSync(executablePath, binPath);
  
  // Create a wrapper script that forces --no-sandbox
  const wrapperScript = `#!/bin/bash
exec "\$(dirname "\$0")/${executableName}.bin" --no-sandbox "\$@"
`;
  
  fs.writeFileSync(executablePath, wrapperScript);
  fs.chmodSync(executablePath, '755');
};
