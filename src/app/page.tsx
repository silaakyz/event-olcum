'use client';

import { useState } from 'react';

export default function HomePage() {
  const [csvText, setCsvText] = useState('nps,satisfaction\n9,5\n8,4\n2,2\n');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [multiMode, setMultiMode] = useState(false);
  const [multiInput, setMultiInput] = useState('[{"name":"Event A","csv":"nps,satisfaction\\n9,5\\n8,4\\n2,2\\n"}]');

  async function handleGenerateReport() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response: Response;

      if (multiMode) {
        // send to multi-report
        response = await fetch('/api/multi-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: JSON.parse(multiInput) }),
        });
      } else {
        response = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv: csvText }),
        });
      }

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload?.error?.message || 'Report generation failed.');
      }

      setResult(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setCsvText(text);
    };
    reader.readAsText(file);
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '960px', margin: '0 auto' }}>
      <h1>Event Measurement Dashboard</h1>

      <section style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontWeight: 600 }}>Mode</label>
          <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input type="checkbox" checked={multiMode} onChange={() => setMultiMode(!multiMode)} /> Multi-event
          </label>
        </div>

        {!multiMode ? (
          <>
            <label htmlFor="csv-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              CSV Input (or upload a .csv file)
            </label>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            {fileName ? <div style={{ marginTop: '0.25rem' }}>Loaded file: {fileName}</div> : null}
            <textarea
              id="csv-input"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              placeholder="nps,satisfaction\n9,5\n8,4\n2,2"
              rows={8}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
            />
          </>
        ) : (
          <>
            <label htmlFor="multi-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Multi-event JSON input
            </label>
            <textarea
              id="multi-input"
              value={multiInput}
              onChange={(e) => setMultiInput(e.target.value)}
              rows={8}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <div style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>Example: [{'{"name":"Event A","csv":"nps,satisfaction\\n9,5\\n"}'}]</div>
          </>
        )}

        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={loading}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : multiMode ? 'Generate Multi-Report' : 'Generate Report'}
          </button>
        </div>
      </section>

      {error ? (
        <div style={{ marginTop: '1rem', color: '#b91c1c', background: '#fef2f2', padding: '0.75rem', borderRadius: '6px' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {result ? (
        <section style={{ marginTop: '2rem' }}>
          <h2>Report Summary</h2>

          {/* Summary card for single or multi */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px', padding: '1rem', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>NPS</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{result.data?.report?.nps?.value ?? result.data?.report?.nps?.value ?? 'N/A'}</div>
            </div>

            <div style={{ flex: '1 1 180px', padding: '1rem', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Satisfaction</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{result.data?.report?.satisfaction?.value ?? 'N/A'}</div>
            </div>

            <div style={{ flex: '1 1 220px', padding: '1rem', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Rows</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Valid: {result.meta?.validRows ?? result.data?.report?.metadata?.validResponses ?? 0}
                <br /> Dropped: {result.meta?.invalidRows ?? result.data?.report?.metadata?.invalidResponses ?? 0}
              </div>
            </div>
          </div>

          {/* Multi-event summary */}
          {result.data?.events ? (
            <div style={{ marginTop: '1rem' }}>
              <h3>Multi-event Summary</h3>
              <div>Best: {result.data?.comparison?.bestEvent ?? 'N/A'}</div>
              <div>Worst: {result.data?.comparison?.worstEvent ?? 'N/A'}</div>
              <div>Avg NPS: {result.data?.comparison?.avgNps ?? 'N/A'}</div>
              <div>Avg Satisfaction: {result.data?.comparison?.avgSatisfaction ?? 'N/A'}</div>
            </div>
          ) : null}

          <div style={{ marginTop: '1rem' }}>
            <button onClick={() => setShowRaw(!showRaw)} style={{ padding: '.4rem .6rem' }}>{showRaw ? 'Hide' : 'Show'} Raw JSON</button>
          </div>

          {showRaw ? (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f4f6', padding: '1rem', overflowX: 'auto', marginTop: '1rem' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
