import test from 'node:test';
import assert from 'node:assert/strict';

import { TEST_BASE_URL, withServer } from './helpers.mjs';

const csv = 'nps,satisfaction\n9,5\n8,4\n2,2\n';

test('same CSV input produces identical results across repeated calls', async () => {
  await withServer(async () => {
    const results = [];

    for (let i = 0; i < 3; i += 1) {
      const response = await fetch(`${TEST_BASE_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });

      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      results.push(payload);
    }

    assert.deepEqual(results[0], results[1]);
    assert.deepEqual(results[1], results[2]);
    assert.equal(results[0].data.report.totalResponses, 3);
    assert.equal(results[0].meta.validRows, 3);
  });
});
