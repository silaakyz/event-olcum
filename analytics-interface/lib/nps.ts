export type NpsReport = {
  score: number
  responses: number
  promoters: number
  passives: number
  detractors: number
  promoterPct: number
  passivePct: number
  detractorPct: number
  averageScore: number
  columnUsed: string
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      out.push(current)
      current = ''
    } else {
      current += char
    }
  }
  out.push(current)
  return out.map((cell) => cell.trim())
}

const SCORE_HEADER_HINTS = [
  'score',
  'rating',
  'nps',
  'likelihood',
  'recommend',
  'how likely',
]

/**
 * Picks the column most likely to hold a 0–10 recommendation score:
 * first by header name, then by whichever numeric column best fits the 0–10 range.
 */
function pickScoreColumn(
  headers: string[],
  rows: string[][],
): number {
  const byName = headers.findIndex((h) =>
    SCORE_HEADER_HINTS.some((hint) => h.toLowerCase().includes(hint)),
  )
  if (byName !== -1) return byName

  let best = -1
  let bestFit = -1
  for (let col = 0; col < headers.length; col++) {
    let numeric = 0
    let inRange = 0
    for (const row of rows) {
      const raw = row[col]
      if (raw === undefined || raw === '') continue
      const num = Number(raw)
      if (!Number.isNaN(num)) {
        numeric++
        if (num >= 0 && num <= 10) inRange++
      }
    }
    const fit = numeric > 0 ? inRange / rows.length : 0
    if (fit > bestFit) {
      bestFit = fit
      best = col
    }
  }
  return best
}

export function computeNps(csv: string): NpsReport {
  const lines = csv
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    throw new Error('That file looks empty. Check the export and try again.')
  }

  const headers = splitCsvLine(lines[0])
  let dataRows = lines.slice(1).map(splitCsvLine)
  let headerRow = headers

  // If the first row is actually numeric data (no header), treat single column.
  const firstLooksNumeric = headers.every((h) => h !== '' && !Number.isNaN(Number(h)))
  if (firstLooksNumeric) {
    headerRow = headers.map((_, i) => `column ${i + 1}`)
    dataRows = lines.map(splitCsvLine)
  }

  if (dataRows.length === 0) {
    throw new Error('We found headers but no responses in that file.')
  }

  const col = pickScoreColumn(headerRow, dataRows)
  if (col === -1) {
    throw new Error(
      "We couldn't find a 0–10 score column. Make sure one column holds the ratings.",
    )
  }

  const scores: number[] = []
  for (const row of dataRows) {
    const raw = row[col]
    if (raw === undefined || raw === '') continue
    const num = Number(raw)
    if (Number.isNaN(num) || num < 0 || num > 10) continue
    scores.push(Math.round(num))
  }

  if (scores.length === 0) {
    throw new Error('No valid 0–10 responses were found in that column.')
  }

  const promoters = scores.filter((s) => s >= 9).length
  const passives = scores.filter((s) => s >= 7 && s <= 8).length
  const detractors = scores.filter((s) => s <= 6).length
  const total = scores.length

  const promoterPct = (promoters / total) * 100
  const passivePct = (passives / total) * 100
  const detractorPct = (detractors / total) * 100
  const averageScore = scores.reduce((a, b) => a + b, 0) / total

  return {
    score: Math.round(promoterPct - detractorPct),
    responses: total,
    promoters,
    passives,
    detractors,
    promoterPct: Math.round(promoterPct),
    passivePct: Math.round(passivePct),
    detractorPct: Math.round(detractorPct),
    averageScore: Math.round(averageScore * 10) / 10,
    columnUsed: firstLooksNumeric ? headerRow[col] : headers[col],
  }
}

export const SAMPLE_CSV = `respondent,score,segment
1,10,Enterprise
2,9,Enterprise
3,8,SMB
4,6,SMB
5,10,Enterprise
6,9,Startup
7,7,SMB
8,3,Startup
9,10,Enterprise
10,9,SMB
11,8,Startup
12,5,SMB
13,10,Enterprise
14,9,Enterprise
15,4,Startup
16,10,SMB
17,9,Startup
18,7,Enterprise
19,2,SMB
20,10,Enterprise
21,9,SMB
22,8,Startup
23,10,Enterprise
24,6,SMB
25,9,Startup`
