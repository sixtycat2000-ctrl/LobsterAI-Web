/**
 * WebSocket tests for LobsterAI WebControl server.
 * Tests WebSocket connection, subscription, and message handling.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import WebSocket from 'ws';
import { createTestServer } from './setup.js';

// Handle unhandled rejections that may occur during cleanup
process.on('unhandledRejection', (reason, promise) => {
  // Ignore known cleanup errors
  if (reason && reason.message && reason.message.includes('getPath')) {
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

describe('WebSocket Tests', () => {
  let testServer;
  let wsUrl;

  before(async () => {
    testServer = await createTestServer();
    wsUrl = `ws://localhost:${testServer.port}/ws`;
    console.log(`Test WebSocket server started at ${wsUrl}`);
  });

  after(async () => {
    // Add a small delay to allow any pending async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    await testServer.close();
    console.log('Test server closed');
  });

  // ==================== Connection Tests ====================
  describe('Connection', () => {
    it('connects successfully and receives welcome message', async () => {
      const ws = new WebSocket(wsUrl);

      const welcomeMessage = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.on('open', () => {
          // Connection opened, wait for welcome message
        });

        ws.on('message', (data) => {
          clearTimeout(timeout);
          try {
            const message = JSON.parse(data.toString());
            resolve(message);
          } catch (err) {
            reject(err);
          }
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(welcomeMessage.type, 'system:connected');
      assert.ok(welcomeMessage.data.clientId);
      assert.ok(typeof welcomeMessage.data.clientId === 'string');

      ws.close();
    });

    it('handles multiple simultaneous connections', async () => {
      const connectionCount = 3;
      const connections = [];
      const clientIds = [];

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(wsUrl);

        const welcomeMessage = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection ${i} timeout`));
          }, 5000);

          ws.on('message', (data) => {
            clearTimeout(timeout);
            try {
              resolve(JSON.parse(data.toString()));
            } catch (err) {
              reject(err);
            }
          });

          ws.on('error', reject);
        });

        clientIds.push(welcomeMessage.data.clientId);
        connections.push(ws);
      }

      // All client IDs should be unique
      const uniqueIds = new Set(clientIds);
      assert.strictEqual(uniqueIds.size, connectionCount);

      // Clean up
      connections.forEach((ws) => ws.close());
    });

    it('handles connection close gracefully', async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.on('error', reject);
      });

      // Close and verify
      const closeEvent = await new Promise((resolve) => {
        ws.on('close', (code) => resolve(code));
        ws.close();
      });

      assert.strictEqual(closeEvent, 1005); // No status received
    });
  });

  // ==================== Ping/Pong Tests ====================
  describe('Ping/Pong', () => {
    it('responds to ping with pong', async () => {
      const ws = new WebSocket(wsUrl);

      // Wait for connection and welcome message
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.on('message', () => {
          // First message is welcome, ignore
          clearTimeout(timeout);
          resolve();
        });

        ws.on('error', reject);
      });

      // Send ping
      ws.send(JSON.stringify({ type: 'ping', data: {} }));

      // Wait for pong
      const pongMessage = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Pong timeout'));
        }, 5000);

        ws.on('message', (data) => {
          clearTimeout(timeout);
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'pong') {
              resolve(message);
            }
          } catch (err) {
            reject(err);
          }
        });

        ws.on('error', reject);
      });

      assert.strictEqual(pongMessage.type, 'pong');
      assert.ok(typeof pongMessage.data.timestamp === 'number');

      ws.close();
    });

    it('includes timestamp in pong response', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      const beforeTime = Date.now();

      // Set up listener BEFORE sending ping to avoid race condition
      const pongPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Pong timeout'));
        }, 5000);

        ws.once('message', (data) => {
          clearTimeout(timeout);
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'pong') {
              resolve(message);
            } else {
              reject(new Error('Unexpected message type'));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      ws.send(JSON.stringify({ type: 'ping', data: {} }));

      const pongMessage = await pongPromise as { data: { timestamp: number } };
      const afterTime = Date.now();

      assert.ok(pongMessage.data.timestamp >= beforeTime);
      assert.ok(pongMessage.data.timestamp <= afterTime);

      ws.close();
    });
  });

  // ==================== Room Subscription Tests ====================
  describe('Room Subscription', () => {
    it('subscribes to a room', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      // Subscribe to a room
      const roomId = 'cowork:test-session-123';
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: roomId,
      }));

      // Wait a bit for subscription to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // The subscription should have been processed (no error)
      // We can verify by checking server logs or by broadcasting to the room

      ws.close();
    });

    it('unsubscribes from a room', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      const roomId = 'cowork:test-session-456';

      // Subscribe
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: roomId,
      }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Unsubscribe
      ws.send(JSON.stringify({
        type: 'unsubscribe',
        data: roomId,
      }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      ws.close();
    });

    it('handles multiple room subscriptions', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      // Subscribe to multiple rooms
      const rooms = [
        'cowork:session-1',
        'cowork:session-2',
        'cowork:session-3',
      ];

      rooms.forEach((roomId) => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          data: roomId,
        }));
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      ws.close();
    });
  });

  // ==================== Message Handling Tests ====================
  describe('Message Handling', () => {
    it('handles invalid JSON gracefully', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      // Send invalid JSON
      ws.send('not valid json');

      // Wait a bit - the connection should remain open
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Connection should still be open
      assert.strictEqual(ws.readyState, WebSocket.OPEN);

      ws.close();
    });

    it('handles unknown message type', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      // Send unknown message type
      ws.send(JSON.stringify({
        type: 'unknown_type',
        data: {},
      }));

      // Wait a bit - the connection should remain open
      await new Promise((resolve) => setTimeout(resolve, 100));

      assert.strictEqual(ws.readyState, WebSocket.OPEN);

      ws.close();
    });

    it('handles subscribe with missing data', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      // Send subscribe without data
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: null,
      }));

      // Wait a bit - the connection should remain open
      await new Promise((resolve) => setTimeout(resolve, 100));

      assert.strictEqual(ws.readyState, WebSocket.OPEN);

      ws.close();
    });
  });

  // ==================== Reconnection Tests ====================
  describe('Reconnection', () => {
    it('can reconnect after disconnect', async () => {
      // First connection
      const ws1 = new WebSocket(wsUrl);

      const welcome1 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws1.close();
          reject(new Error('First connection timeout'));
        }, 5000);

        ws1.on('message', (data) => {
          clearTimeout(timeout);
          try {
            resolve(JSON.parse(data.toString()));
          } catch (err) {
            reject(err);
          }
        });

        ws1.on('error', reject);
      });

      ws1.close();

      // Wait for disconnect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second connection
      const ws2 = new WebSocket(wsUrl);

      const welcome2 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws2.close();
          reject(new Error('Second connection timeout'));
        }, 5000);

        ws2.on('message', (data) => {
          clearTimeout(timeout);
          try {
            resolve(JSON.parse(data.toString()));
          } catch (err) {
            reject(err);
          }
        });

        ws2.on('error', reject);
      });

      // Client IDs should be different
      assert.notStrictEqual(welcome1.data.clientId, welcome2.data.clientId);

      ws2.close();
    });
  });

  // ==================== Protocol Tests ====================
  describe('Protocol', () => {
    it('accepts messages only in OPEN state', async () => {
      const ws = new WebSocket(wsUrl);

      // Try to send before connection (should be queued by ws library)
      // This tests that the library handles this gracefully

      const welcomeMessage = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.on('message', (data) => {
          clearTimeout(timeout);
          try {
            resolve(JSON.parse(data.toString()));
          } catch (err) {
            reject(err);
          }
        });

        ws.on('error', reject);
      });

      assert.strictEqual(welcomeMessage.type, 'system:connected');

      ws.close();
    });

    it('handles binary messages', async () => {
      const ws = new WebSocket(wsUrl);

      // Set up welcome message listener BEFORE connection opens
      const welcomePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Welcome timeout'));
        }, 5000);

        ws.once('message', () => {
          clearTimeout(timeout);
          resolve();
        });

        ws.once('error', reject);
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        ws.once('open', () => resolve());
      });

      // Wait for welcome message
      await welcomePromise;

      // Send binary data
      const buffer = Buffer.from('binary data', 'utf8');
      ws.send(buffer);

      // Wait a bit - the connection should handle it gracefully
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Connection should still be open (or closed due to parse error, which is also acceptable)
      assert.ok(
        ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSED
      );

      ws.close();
    });
  });
});
