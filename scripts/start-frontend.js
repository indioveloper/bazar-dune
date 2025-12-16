const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.FRONTEND_PORT || 8080);

function checkAlreadyRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port,
        path: '/',
        timeout: 600,
      },
      (res) => {
        // Any HTTP response means something is listening.
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
    console.log(`Frontend already running on http://localhost:${PORT}/`);
    return;
  }

  const projectRoot = path.resolve(__dirname, '..');
  const nodePath = process.execPath;

  // Run webpack-dev-server via webpack-cli directly (no shell, cross-platform).
  const webpackCli = path.resolve(projectRoot, 'node_modules', 'webpack-cli', 'bin', 'cli.js');

  const child = spawn(
    nodePath,
    [webpackCli, 'serve', '--mode', 'development'],
    {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    }
  );

  child.unref();
  console.log(`Frontend started (pid ${child.pid}) -> http://localhost:${PORT}/`);
}

main().catch((err) => {
  console.error('Failed to start frontend:', err);
  process.exit(1);
});
