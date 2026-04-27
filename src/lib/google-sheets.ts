import { google } from 'googleapis';

/**
 * Initialize and return an authenticated Google Sheets client.
 * Uses Service Account credentials from environment variables.
 */
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();

  const sheets = google.sheets({
    version: 'v4',
    auth: authClient as import('google-auth-library').OAuth2Client,
  });

  return sheets;
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
