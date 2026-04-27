import { google } from 'googleapis';

let sheetsClientPromise: Promise<import('googleapis').sheets_v4.Sheets> | null = null;

/**
 * Initialize and return an authenticated Google Sheets client.
 * Uses Service Account credentials from environment variables.
 * Caches the PROMISE of the client to prevent rate-limiting on concurrent auth requests.
 */
export async function getGoogleSheetsClient() {
  if (sheetsClientPromise) {
    return sheetsClientPromise;
  }

  sheetsClientPromise = (async () => {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();

    return google.sheets({
      version: 'v4',
      auth: authClient as import('google-auth-library').OAuth2Client,
    });
  })();

  return sheetsClientPromise;
}

/**
 * Get the Spreadsheet ID from environment variables.
 */
export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) {
    throw new Error('GOOGLE_SPREADSHEET_ID is not set in environment variables');
  }
  return id;
}
