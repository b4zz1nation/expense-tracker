#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const projectRoot = path.resolve(__dirname, '..');

function sdkCandidates() {
  if (process.platform === 'win32') {
    return [
      process.env.ANDROID_HOME,
      process.env.ANDROID_SDK_ROOT,
      path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
      path.join(projectRoot, '.android-sdk'),
    ].filter(Boolean);
  }

  return [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(projectRoot, '.android-sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);
}

function adbName() {
  return process.platform === 'win32' ? 'adb.exe' : 'adb';
}

function findAndroidSdk() {
  return sdkCandidates().find((sdk) =>
    fs.existsSync(path.join(sdk, 'platform-tools', adbName()))
  );
}

const env = { ...process.env };

// On Windows with newer Node versions, localhost can resolve to IPv6 (::1)
// first. Expo then advertises exp://127.0.0.1:8081 to the emulator, but
// Metro is only listening on ::1, so Expo Go fails with "failed to download
// remote update". Prefer IPv4 so localhost mode binds to 127.0.0.1.
if (process.platform === 'win32' && !String(env.NODE_OPTIONS || '').includes('--dns-result-order=')) {
  env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --dns-result-order=ipv4first`.trim();
}

const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
const currentPath = env[pathKey] || env.PATH || '';
const sdk = findAndroidSdk();
if (sdk) {
  env.ANDROID_HOME = sdk;
  env.ANDROID_SDK_ROOT = sdk;
  env[pathKey] = `${path.join(sdk, 'platform-tools')}${path.delimiter}${currentPath}`;
} else {
  console.warn('Warning: Android SDK with adb was not found. Expo may be unable to open the emulator.');
}

const extraArgs = process.argv.slice(2);
const hostArgs = extraArgs.length ? extraArgs : ['--localhost'];
const npxCmd = process.platform === 'win32'
  ? path.join(path.dirname(process.execPath), 'npx.cmd')
  : 'npx';

const expoArgs = ['expo', 'start', ...hostArgs, '--android'];
const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npxCmd;
const args = process.platform === 'win32'
  ? ['/d', '/c', 'call', npxCmd, ...expoArgs]
  : expoArgs;

const child = spawn(command, args, {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
