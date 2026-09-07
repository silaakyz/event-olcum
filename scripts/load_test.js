#!/usr/bin/env node
const os = require('os');
const { argv } = require('process');

function parseArgs() {
  const args = { concurrency: 100, iterations: 1, url: 'http://localhost:3000/api/report' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--concurrency' || a === '-c') args.concurrency = Number(argv[++i]);
    else if (a === '--iterations' || a === '-n') args.iterations = Number(argv[++i]);
    else if (a === '--url' || a === '-u') args.url = argv[++i];
  }
  return args;
}

const csvSample = `respondent_id,nps,satisfaction
1,9,5
2,10,5
3,8,4
4,7,4
5,10,5`;

async function doRequest(url) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ csv: csvSample }) });
    const t = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body: t };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function run() {
  const opts = parseArgs();
  console.log('Load test', opts);
  for (let iter = 0; iter < opts.iterations; iter++) {
    const concurrent = [];
    for (let i = 0; i < opts.concurrency; i++) concurrent.push(doRequest(opts.url));

    const results = await Promise.all(concurrent);
    const ok = results.filter(r => r.ok).length;
    console.log(`iter ${iter + 1}: ${ok}/${results.length} OK`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
