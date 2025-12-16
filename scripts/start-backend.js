const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT || 8000);

function checkAlreadyRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port,
        path: '/api/regions',
        timeout: 600,
      },
      (res) => {
        res.resume();
        resolve(true);
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => resolve(false));
  });
}

async function main() {
  const already = await checkAlreadyRunning(PORT);
  if (already) {
    console.log(`Backend already running on http://localhost:${PORT}/`);
    return;
  }

  const projectRoot = path.resolve(__dirname, '..');
  const nodePath = process.execPath;
  const serverEntry = path.resolve(projectRoot, 'server.js');

  const child = spawn(nodePath, [serverEntry], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: String(PORT),
    },
  });

  child.unref();
  console.log(`Backend started (pid ${child.pid}) -> http://localhost:${PORT}/`);
}

main().catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});
