import { PulseApp } from '../components/pulse-app'

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 pb-28 pt-20 sm:pt-28">
        <header className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            <span className="text-sm font-medium tracking-tight text-foreground">
              Pulse
            </span>
          </div>
          <h1 className="max-w-lg text-balance text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl">
            Turn a survey export into an NPS report.
          </h1>
          <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
            Drop in the CSV from your last customer survey. We&apos;ll score it,
            split promoters from detractors, and hand you a number you can put in
            a deck.
          </p>
        </header>

        <PulseApp />
      </div>
    </main>
  )
}
