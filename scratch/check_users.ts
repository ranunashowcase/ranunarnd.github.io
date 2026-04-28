
import bcrypt from 'bcryptjs';
import { getSheetData, appendSheetData, initializeSheetHeaders } from '../src/lib/sheets-service';

async function fixAdmin() {
  const SHEET_NAME = 'USERS';
  const HEADERS = ['user_id', 'email', 'password_hash', 'nama', 'role', 'created_at'];
  await initializeSheetHeaders(SHEET_NAME, HEADERS);

  const users = await getSheetData<{email: string}>(SHEET_NAME);
  console.log('Current users in DB:', users.map(u => u.email));

  const hasNewAdmin = users.some((u) => u.email.toLowerCase() === 'ranunaaasbj@gmail.com');
  if (!hasNewAdmin) {
    const hashedPassword = await bcrypt.hash('kuasaadminherbal123', 10);
    await appendSheetData(SHEET_NAME, [
      'USR-999',
      'ranunaaasbj@gmail.com',
      hashedPassword,
      'Admin Ranuna',
      'admin',
      new Date().toISOString(),
    ]);
    console.log('Successfully inserted ranunaaasbj@gmail.com as admin!');
  } else {
    console.log('ranunaaasbj@gmail.com already exists in DB!');
  }
}

fixAdmin().catch(console.error);
