import { buildEventReport } from '../core/metrics/engine';
import { parseCsvToJson, normalizeSurveyRows, validateSurveyRow } from './csvToJson';

export type SurveyInputResult = {
  data: any[];
  totalRows: number;
  validRows: number;
  droppedRows: number;
  invalidRowDetails: Array<{ row: number; message: string; rawValue?: string }>;
  error?: {
    type: 'VALIDATION' | 'PARSE' | 'ENGINE' | 'SYSTEM';
    message: string;
    details: Record<string, unknown>;
  };
  report?: ReturnType<typeof buildEventReport>;
};

export function parseSurveyInput(csvText: string): SurveyInputResult {
  const parsed = parseCsvToJson(csvText);

  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0];
    const firstRow = (firstError.rowIndex ?? Number(firstError.field.replace('row_', ''))) || 0;
    const firstRawValue = firstError.rawValue ?? '';

    return {
      data: [],
      totalRows: parsed.rows.length,
      validRows: 0,
      droppedRows: parsed.rows.length,
      invalidRowDetails: parsed.errors.map((entry) => ({
        row: (entry.rowIndex ?? Number(entry.field.replace('row_', ''))) || 0,
        message: entry.message,
        rawValue: entry.rawValue,
      })),
      error: {
        type: 'PARSE',
        message: firstError.message,
        details: { field: firstError.field, rowIndex: firstRow, rawValue: firstRawValue },
      },
    };
  }

  const normalizedRows = normalizeSurveyRows(parsed.rows);
  const validRows: any[] = [];
  const invalidRowDetails: Array<{ row: number; message: string; rawValue?: string }> = [];

  for (let index = 0; index < normalizedRows.length; index += 1) {
    const row = normalizedRows[index];
    const validation = validateSurveyRow(row);

    if (!validation.valid) {
      invalidRowDetails.push({
        row: index + 2,
        message: validation.errors.join(' '),
        rawValue: JSON.stringify(row),
      });
      continue;
    }

    validRows.push(row);
  }

  if (validRows.length === 0) {
    return {
      data: [],
      totalRows: parsed.rows.length,
      validRows: 0,
      droppedRows: parsed.rows.length,
      invalidRowDetails,
      error: {
        type: 'VALIDATION',
        message: invalidRowDetails[0]?.message ?? 'No valid survey rows were found.',
        details: {
          invalidRowDetails,
          rowIndex: invalidRowDetails[0]?.row ?? 0,
          rawValue: invalidRowDetails[0]?.rawValue ?? '',
        },
      },
    };
  }

  const report = buildEventReport(validRows);

  return {
    data: validRows,
    totalRows: parsed.rows.length,
    validRows: validRows.length,
    droppedRows: invalidRowDetails.length,
    invalidRowDetails,
    report,
  };
}
