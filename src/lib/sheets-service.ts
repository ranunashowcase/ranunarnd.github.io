import { getGoogleSheetsClient, getSpreadsheetId } from './google-sheets';

/**
 * Fetch all rows from a specified sheet tab.
 * Returns an array of objects keyed by column headers.
 */
export async function getSheetData<T>(sheetName: string): Promise<T[]> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return [];
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: Record<string, string | number> = {};
      headers.forEach((header: string, index: number) => {
        const value = row[index] || '';
        // Try to parse numbers for known numeric fields
        if (['cogs', 'competitor_price', 'moq', 'price_per_pcs', 'qty_per_carton'].includes(header)) {
          obj[header] = value ? Number(value) : 0;
        } else {
          obj[header] = value;
        }
      });
      return obj as T;
    });

    return data;
  } catch (error: unknown) {
    // If sheet tab doesn't exist yet, it returns 400 (Unable to parse range)
    const err = error as { code?: number };
    if (err?.code === 400 || err?.code === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Append a new row to a specified sheet tab.
 * The values array should match the column order of the sheet.
 */
export async function appendSheetData(
  sheetName: string,
  values: (string | number)[]
): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
}

/**
 * Append multiple rows at once to a specified sheet tab.
 * Much more efficient than calling appendSheetData per row.
 */
export async function appendSheetDataBulk(
  sheetName: string,
  rows: (string | number)[][]
): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });
}

/**
 * Generate a unique ID with a prefix.
 * Format: PREFIX-001, PREFIX-002, etc.
 */
export function generateId(prefix: string, existingIds: string[]): string {
  if (existingIds.length === 0) {
    return `${prefix}-001`;
  }

  const numbers = existingIds
    .map((id) => {
      const match = id.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxNumber = Math.max(...numbers, 0);
  return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
}

/**
 * Get current datetime in ISO format.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Initialize sheet headers if the sheet is empty.
 * Creates the tab if it doesn't exist.
 */
export async function initializeSheetHeaders(
  sheetName: string,
  headers: string[]
): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });

    const existingHeaders = response.data.values;
    if (!existingHeaders || existingHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err?.code === 400 || err?.code === 404) {
      // Tab doesn't exist — create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      // Now write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    } else {
      throw error;
    }
  }
}

/**
 * Delete a specific row by checking an ID matching in a given column index.
 * Note: columnIndex is 0-indexed.
 */
export async function deleteSheetRow(
  sheetName: string,
  idColumnIndex: number,
  idValue: string
): Promise<boolean> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    // 1. Get the sheet properties to find the sheetId
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheetData = spreadsheetInfo.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );
    if (!sheetData || sheetData.properties?.sheetId === undefined) {
      throw new Error(`Sheet ${sheetName} not found`);
    }
    const sheetId = sheetData.properties.sheetId;

    // 2. Fetch all values to find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    // 3. Find the row to delete
    // rowIndex is 0-indexed for the API, but row 0 is header.
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColumnIndex] === idValue) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return false; // Not found
    }

    // 4. Delete the row using batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: targetRowIndex,
                endIndex: targetRowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return true;
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

/**
 * Bulk delete rows from a sheet.
 * If targetDate is provided, only rows matching that date (YYYY-MM-DD) are deleted.
 * If targetDate is null, all data rows (except header) are deleted.
 */
export async function deleteSheetRowsByCondition(
  sheetName: string,
  targetDate?: string | null
): Promise<number> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    // 1. Get sheetId
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetData = spreadsheetInfo.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );
    if (!sheetData || sheetData.properties?.sheetId === undefined) {
      throw new Error(`Sheet ${sheetName} not found`);
    }
    const sheetId = sheetData.properties.sheetId;

    // 2. Fetch all values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) return 0; // Empty or header only

    const headers = rows[0].map((h: any) => String(h).toLowerCase());
    
    // Find date column if we need to filter by date
    let dateColIndex = -1;
    if (targetDate) {
      dateColIndex = headers.findIndex((h) => 
        ['tanggal', 'date', 'timestamp', 'created_at', 'waktu'].some(kw => h.includes(kw))
      );
      if (dateColIndex === -1) {
         // Cannot filter by date if no date column exists
         return 0;
      }
    }

    // 3. Find rows to delete
    const rowsToDelete: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      if (!targetDate) {
        // Delete all
        rowsToDelete.push(i);
      } else {
        // Delete by date
        const rowDateRaw = String(rows[i][dateColIndex] || '');
        let rowDate = '';
        
        // Parse date
        if (rowDateRaw.includes('T')) {
           rowDate = rowDateRaw.split('T')[0];
        } else if (rowDateRaw.includes(' ')) {
           rowDate = rowDateRaw.split(' ')[0];
        } else {
           rowDate = rowDateRaw;
        }

        // Extremely basic matching (assuming format YYYY-MM-DD or similar standard format)
        if (rowDate.includes(targetDate) || targetDate.includes(rowDate)) {
           rowsToDelete.push(i);
        }
      }
    }

    if (rowsToDelete.length === 0) return 0;

    // 4. Batch delete in REVERSE order so indices don't shift!
    rowsToDelete.sort((a, b) => b - a);

    // Group contiguous rows to optimize requests
    const requests: any[] = [];
    let currentStartIndex = rowsToDelete[0];
    let currentEndIndex = rowsToDelete[0] + 1;

    for (let i = 1; i < rowsToDelete.length; i++) {
      const idx = rowsToDelete[i];
      if (idx === currentStartIndex - 1) {
        // Contiguous
        currentStartIndex = idx;
      } else {
        // Break in contiguous sequence
        requests.push({
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: currentStartIndex,
              endIndex: currentEndIndex,
            },
          },
        });
        currentStartIndex = idx;
        currentEndIndex = idx + 1;
      }
    }
    
    // Push the last group
    requests.push({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: currentStartIndex,
          endIndex: currentEndIndex,
        },
      },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    return rowsToDelete.length;
  } catch (error) {
    console.error('Error in bulk delete:', error);
    throw error;
  }
}

/**
 * Update a specific row by checking an ID matching in a given column index.
 * Replaces the entire row values.
 */
export async function updateSheetRow(
  sheetName: string,
  idColumnIndex: number,
  idValue: string,
  newValues: (string | number)[]
): Promise<boolean> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    // 1. Fetch all values to find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    // 2. Find the row to update
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColumnIndex] === idValue) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return false; // Not found
    }

    // 3. Update the row values (Row index is 1-based in A1 notation, so targetRowIndex + 1)
    const rowNumber = targetRowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newValues],
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  }
}
