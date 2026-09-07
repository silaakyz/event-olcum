import Link from 'next/link';

export default function ReportIndexPage() {
  return <main className="min-h-svh bg-background px-5 py-10 text-foreground"><div className="mx-auto max-w-4xl"><h1 className="text-2xl font-semibold">Choose a survey report</h1><p className="mt-2 text-sm text-muted-foreground">Open a saved survey to view metrics derived from its responses.</p><Link href="/surveys" className="mt-5 inline-block rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">View surveys</Link></div></main>;
}
