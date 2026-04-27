const { google } = require('googleapis');
const fs = require('fs');

async function fixColumns() {
  const env = fs.readFileSync(process.cwd() + '/.env.local', 'utf8');
  const email = env.match(/GOOGLE_SERVICE_ACCOUNT_EMAIL=(.*)/)[1].trim();
  const rawKey = env.match(/GOOGLE_PRIVATE_KEY="(.*)"/)[1];
  const privateKey = rawKey.replace(/\\n/g, '\n');
  const sheetId = env.match(/GOOGLE_SPREADSHEET_ID=(.*)/)[1].trim();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Get sheetId for PEMESANAN PRODUK to delete columns G-Z
  const info = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheet = info.data.sheets.find(s => s.properties.title === 'PEMESANAN PRODUK');
  
  if (sheet) {
    const sId = sheet.properties.sheetId;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sId,
                dimension: 'COLUMNS',
                startIndex: 6, // Column G (0-indexed)
                endIndex: 26   // Column Z
              }
            }
          }
        ]
      }
    });
    console.log("Extra columns deleted successfully!");
  }
}

fixColumns().catch(console.error);
