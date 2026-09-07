import test from 'node:test';
import assert from 'node:assert/strict';

import { TEST_BASE_URL, withServer } from './helpers.mjs';

const validCsv = 'nps,satisfaction\n9,5\n8,4\n2,2\n';
const invalidCsv = 'nps,satisfaction\n9,5\nabc,4\n';
const allInvalidCsv = 'nps,satisfaction\n-1,0\n11,7\n';

function assertErrorEnvelope(payload, expectedType) {
  assert.equal(payload.success, false);
  assert.ok(payload.error);
  assert.ok(typeof payload.error.type === 'string');
  assert.ok(payload.error.message.length > 0);
  assert.ok(payload.error.details !== undefined);
  assert.equal(payload.error.type, expectedType);
}

function assertSuccessEnvelope(payload, expectedDataKeys = ['report']) {
  assert.equal(payload.success, true);
  assert.ok(payload.data);
  assert.ok(payload.meta);
  assert.deepEqual(Object.keys(payload), ['success', 'data', 'meta']);
  assert.deepEqual(Object.keys(payload.data), expectedDataKeys);
}

test('valid CSV input returns stable success envelope', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: validCsv }),
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assertSuccessEnvelope(payload);
    assert.equal(payload.data.report.metadata.totalResponses, 3);
    assert.equal(payload.data.report.totalResponses, 3);
    assert.equal(payload.meta.validRows, 3);
    assert.equal(payload.meta.invalidRows, 0);
  });
});

test('empty CSV input returns structured validation error', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: '' }),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assertErrorEnvelope(payload, 'VALIDATION');
    assert.equal(payload.error.message, 'Empty CSV input.');
  });
});

test('missing csv field returns structured validation error', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assertErrorEnvelope(payload, 'VALIDATION');
  });
});

test('malformed JSON body never crashes and returns validation error', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assertErrorEnvelope(payload, 'VALIDATION');
  });
});

test('multi-event payload returns stable envelope', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/multi-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          { name: 'Event A', csv: validCsv },
          { name: 'Event B', csv: validCsv },
        ],
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data);
    assert.ok(payload.meta);
    assert.deepEqual(Object.keys(payload), ['success', 'data', 'meta']);
    assert.ok(Array.isArray(payload.data.events));
    assert.ok(payload.data.comparison);
    assert.equal(payload.data.events.length, 2);
  });
});

test('all invalid rows return a deterministic failure envelope', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: allInvalidCsv }),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assertErrorEnvelope(payload, 'VALIDATION');
    assert.ok(Array.isArray(payload.error.details.invalidRowDetails));
  });
});

test('partial invalid rows stay resilient and report invalid rows in metadata', async () => {
  await withServer(async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: invalidCsv }),
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.meta);
    assert.equal(payload.meta.validRows, 1);
    assert.equal(payload.meta.invalidRows, 1);
    assert.ok(Array.isArray(payload.meta.invalidRowDetails));
  });
});
