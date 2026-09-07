import assert from 'node:assert/strict';

import { TEST_BASE_URL, withServer } from '../tests/helpers.mjs';

const validCsv = 'nps,satisfaction\n9,5\n8,4\n2,2\n';
const multiCsv = 'nps,satisfaction\n9,5\n8,4\n2,2\n';

async function verifySingleReport() {
  const response = await fetch(`${TEST_BASE_URL}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv: validCsv }),
  });

  const payload = await response.json();
  assert.equal(response.status, 200, 'single event route should succeed');
  assert.equal(payload.success, true, 'single event route should have success: true');
  assert.deepEqual(Object.keys(payload), ['success', 'data', 'meta']);
  assert.ok(payload.data.report, 'single event route should include report data');
  assert.ok(payload.meta, 'single event route should include meta info');
}

async function verifyMultiReport() {
  const response = await fetch(`${TEST_BASE_URL}/api/multi-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        { name: 'Event A', csv: multiCsv },
        { name: 'Event B', csv: multiCsv },
      ],
    }),
  });

  const payload = await response.json();
  assert.equal(response.status, 200, 'multi-event route should succeed');
  assert.equal(payload.success, true, 'multi-event route should have success: true');
  assert.deepEqual(Object.keys(payload), ['success', 'data', 'meta']);
  assert.ok(Array.isArray(payload.data.events), 'multi-event route should include event list');
  assert.ok(payload.data.comparison, 'multi-event route should include comparison');
}

async function verifyFailureSafety() {
  const response = await fetch(`${TEST_BASE_URL}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv: '' }),
  });

  const payload = await response.json();
  assert.equal(response.status, 400, 'empty CSV should reject safely');
  assert.equal(payload.success, false, 'empty CSV should return success: false');
  assert.ok(payload.error, 'error object should be present');
  assert.ok(['VALIDATION', 'PARSE', 'ENGINE', 'SYSTEM'].includes(payload.error.type));
}

await withServer(async () => {
  await verifySingleReport();
  await verifyMultiReport();
  await verifyFailureSafety();
  console.log('API contract verification passed.');
});
