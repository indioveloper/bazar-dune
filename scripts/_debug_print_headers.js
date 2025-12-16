const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'TU_SPREADSHEET_ID_AQUI';

let auth;
if (process.env.GCP_CREDENTIALS_JSON) {
  auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GCP_CREDENTIALS_JSON),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
} else {
  auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const sheets = google.sheets({ version: 'v4', auth });

async function main() {
  for (const sheetName of ['Users', 'Items']) {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });
    const headers = (r.data.values && r.data.values[0]) || [];
    console.log(`${sheetName} headers:`, headers);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
