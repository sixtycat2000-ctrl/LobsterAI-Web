/**
 * Server API Tests
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3001';

describe('Server API Tests', () => {
  let serverProcess: any;

  before(async () => {
    // Start server
    const { spawn } = await import('child_process');
    serverProcess = spawn('npm', ['run', 'server:dev'], {
      stdio: 'inherit',
      detached: true,
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  after(async () => {
    // Stop server
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('GET /health returns ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.timestamp);
  });

  it('GET /api/app/version returns version', async () => {
    const res = await fetch(`${BASE_URL}/api/app/version`);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(data.data);
    assert.ok(data.data.version);
  });
});
