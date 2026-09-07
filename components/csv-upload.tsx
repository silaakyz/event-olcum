'use client'

import { useRef, useState } from 'react'
import { cn } from '../lib/utils'

type CsvUploadProps = {
  fileName: string | null
  onFile: (name: string, content: string) => void
  onUseSample: () => void
  disabled?: boolean
}

export function CsvUpload({
  fileName,
  onFile,
  onUseSample,
  disabled,
}: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => onFile(file.name, String(reader.result ?? ''))
    reader.readAsText(file)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) readFile(file)
        }}
        disabled={disabled}
        className={cn(
          'group flex w-full flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-6 text-left transition-colors',
          'hover:border-brand/60 hover:bg-brand-muted/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          dragging && 'border-brand bg-brand-muted/60',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        aria-label="Upload a CSV export of survey responses"
      >
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors',
            'group-hover:border-brand/50 group-hover:text-brand',
            dragging && 'border-brand text-brand',
          )}
        >
          <UploadGlyph />
        </span>

        {fileName ? (
          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-sm text-foreground">
              {fileName}
            </span>
            <span className="text-sm text-muted-foreground">
              Ready. Drop another file to replace it.
            </span>
          </span>
        ) : (
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {dragging ? 'Let go to load it' : 'Drop your survey export here'}
            </span>
            <span className="text-sm text-muted-foreground">
              CSV with a 0–10 score column, or click to browse.
            </span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) readFile(file)
          e.target.value = ''
        }}
      />

      <p className="mt-2.5 pl-1 text-xs text-muted-foreground">
        Everything runs in your browser — the file never leaves this tab.{' '}
        <button
          type="button"
          onClick={onUseSample}
          disabled={disabled}
          className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-brand disabled:opacity-60"
        >
          Try it with sample data
        </button>
      </p>
    </div>
  )
}

function UploadGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 10.5V2.5" />
      <path d="M5 5.5 8 2.5l3 3" />
      <path d="M2.5 10.5v1.5a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
    </svg>
  )
}
