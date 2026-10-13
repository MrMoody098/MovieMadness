const { spawn } = require('node:child_process');
const path = require('node:path');

const appDir = process.cwd();
const children = [];

let stopping = false;
function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    children.forEach(child => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); });
    process.exitCode = code;
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

async function start() {
    let bridgeRunning = false;
    try {
        const response = await fetch('http://127.0.0.1:3001/health', {
            headers: { Origin: `http://localhost:${process.env.PORT || 3000}` },
            signal: AbortSignal.timeout(1000)
        });
        const health = await response.json();
        bridgeRunning = response.ok && health.service === 'moviemadness-downloads';
    } catch (_) { /* The bridge needs to be started. */ }
    if (stopping) return;
    if (!bridgeRunning) {
        const bridge = spawn(process.execPath, [path.join(__dirname, 'torlnk-bridge.js')], { stdio: 'inherit' });
        children.push(bridge);
    } else {
        console.log('MovieMadness downloads are already running.');
    }
    const site = spawn(process.execPath, [require.resolve('react-scripts/bin/react-scripts', { paths: [appDir] }), 'start'], {
        cwd: appDir,
        stdio: 'inherit',
        env: process.env
    });
    children.push(site);
    children.forEach(child => {
        child.on('error', error => { console.error(error); stop(1); });
        child.on('exit', (code, signal) => { if (!stopping) stop(code || (signal ? 1 : 0)); });
    });
}

start().catch(error => { console.error(error); stop(1); });
