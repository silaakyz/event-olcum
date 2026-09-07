export type CsvParseError = {
  field: string;
  message: string;
  rowIndex?: number;
  rawValue?: string;
};

export type ParsedCsvResult = {
  rows: Record<string, string>[];
  errors: CsvParseError[];
};

export function parseCsvToJson(input: string): ParsedCsvResult {
  if (typeof input !== 'string' || input.trim() === '') {
    return {
      rows: [],
      errors: [{ field: 'csv', message: 'Input is empty or not a valid CSV string.', rowIndex: 0, rawValue: input ?? '' }],
    };
  }

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ field: 'csv', message: 'CSV must include a header row and at least one data row.', rowIndex: 0, rawValue: input }],
    };
  }

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(',').map((header) => header.trim());
  const rows: Record<string, string>[] = [];
  const errors: CsvParseError[] = [];

  for (let rowIndex = 0; rowIndex < dataLines.length; rowIndex += 1) {
    const rawLine = dataLines[rowIndex];
    const values = rawLine.split(',').map((value) => value.trim());

    if (values.length !== headers.length) {
      errors.push({
        field: `row_${rowIndex + 2}`,
        message: 'Column count mismatch for CSV row.',
        rowIndex: rowIndex + 2,
        rawValue: rawLine,
      });
      continue;
    }

    const row: Record<string, string> = {};
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const key = headers[columnIndex] || `column_${columnIndex + 1}`;
      row[key] = values[columnIndex] ?? '';
    }

    rows.push(row);
  }

  return { rows, errors };
}

export function normalizeSurveyRows(rows: Record<string, string>[]): any[] {
  return rows.map((row) => {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      const loweredKey = key.trim().toLowerCase();
      const normalizedKey = loweredKey.replace(/\s+/g, '_');
      const trimmedValue = value.trim();

      if (trimmedValue === '') {
        normalized[normalizedKey] = null;
        continue;
      }

      if (/^(?:0|[1-9]\d*)$/.test(trimmedValue)) {
        normalized[normalizedKey] = Number(trimmedValue);
        continue;
      }

      normalized[normalizedKey] = trimmedValue;
    }

    if (!normalized.nps && normalized.nps !== 0) {
      const directNps = row.nps ?? row.NPS ?? row['NPS Score'] ?? row['nps score'];
      if (directNps !== undefined) {
        normalized.nps = Number(directNps);
      }
    }

    if (!normalized.satisfaction && normalized.satisfaction !== 0) {
      const directSatisfaction =
        row.satisfaction ?? row.Satisfaction ?? row['Satisfaction Score'] ?? row['satisfaction score'];
      if (directSatisfaction !== undefined) {
        normalized.satisfaction = Number(directSatisfaction);
      }
    }

    return normalized;
  });
}

export function validateSurveyRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const rawNps = row?.nps ?? row?.['answers.nps'] ?? row?.['survey.nps'];
  const rawSatisfaction = row?.satisfaction ?? row?.['answers.satisfaction'] ?? row?.['survey.satisfaction'];

  if (rawNps !== undefined && rawNps !== null && rawNps !== '') {
    const npsValue = Number(rawNps);
    if (!Number.isFinite(npsValue) || npsValue < 0 || npsValue > 10) {
      errors.push('nps must be between 0 and 10.');
    }
  }

  if (rawSatisfaction !== undefined && rawSatisfaction !== null && rawSatisfaction !== '') {
    const satisfactionValue = Number(rawSatisfaction);
    if (!Number.isFinite(satisfactionValue) || (satisfactionValue < 1 || satisfactionValue > 5)) {
      if (!Number.isFinite(satisfactionValue) || (satisfactionValue < 1 || satisfactionValue > 10)) {
        errors.push('satisfaction must be between 1 and 5 or 1 and 10.');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
