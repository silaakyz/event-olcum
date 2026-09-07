'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { CsvUpload } from './csv-upload'
import { ReportView } from './report-view'
import { computeNps, SAMPLE_CSV, type NpsReport } from '../lib/nps'

export function PulseApp() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [csv, setCsv] = useState<string | null>(null)
  const [report, setReport] = useState<NpsReport | null>(null)
  const [uploadedAt, setUploadedAt] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function handleFile(name: string, content: string) {
    setFileName(name)
    setCsv(content)
    setReport(null)
    setError(null)
  }

  function handleSample() {
    setFileName('sample-responses.csv')
    setCsv(SAMPLE_CSV)
    setReport(null)
    setError(null)
  }

  function handleGenerate() {
    if (!csv) return
    setPending(true)
    setError(null)
    // Small deliberate beat so the result feels computed, not instant.
    setTimeout(() => {
      try {
        setReport(computeNps(csv))
        setUploadedAt('just now')
      } catch (err) {
        setReport(null)
        setError(
          err instanceof Error ? err.message : 'Something went wrong parsing that file.',
        )
      } finally {
        setPending(false)
      }
    }, 450)
  }

  return (
    <div className="flex flex-col gap-8">
      <CsvUpload
        fileName={fileName}
        onFile={handleFile}
        onUseSample={handleSample}
        disabled={pending}
      />

      <div className="flex items-center gap-4">
        <Button
          onClick={handleGenerate}
          disabled={!csv || pending}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {pending ? 'Crunching…' : 'Generate report'}
        </Button>
        {!csv && (
          <span className="text-sm text-muted-foreground">
            Add a file to get started.
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {report && (
        <>
          <div className="h-px w-full bg-border" />
          <ReportView report={report} uploadedAt={uploadedAt} />
        </>
      )}
    </div>
  )
}
