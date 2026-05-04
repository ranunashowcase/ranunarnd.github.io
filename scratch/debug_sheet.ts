// Debug script to see actual sheet headers and first 3 rows
import { google } from 'googleapis';

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: 'sheets-bot@sbj-rnd-system.iam.gserviceaccount.com',
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC481nOiGXtfzso\nJ/At4QtnVCJTUSuHlac6sk/m3x2FGAg9pydsHiRE6A99g1jpomSoVqZvCdrI1dyJ\njZ+RD7ajM1MngZWnPIf2KRPcuagIotoemGE1OiqlbTj0NzuR6TxlE5yy82BKnVzt\nf1F6NVTTx98VsSxySzUNP9nKaawxAgnmp/2sioY/iE95nrVD3VH71eFMCCvq6FjL\nS43BYrzwN9NWbaLXQNfxDDcmWeOatZjQ9kbQfTPes5kwrkTz0yJClWI3pJfMadEz\ncXJa6e3vv3X9JusN7HlYPafEcoBGsXyzIY9bdc2iHbyxEqsE+94JZdmjCyaI0f7c\nSVxVizYtAgMBAAECggEAKf/lJIAX+XNbmTZcleaVgtz5wIbdxjfnVm54s5p2Jyu6\nb1m+m5BKtzUlk2CY99FPX2Tx/aQ0wUfDgZ8eHcB+PphgqUeFlwkpbO6OGqE0deWZ\nd7ot1PsFBTUE6nyCdBONifyGqKKY+si6ehpgA8sJnOA2GkR2LexDO2OFDzCpECWd\n4UX8yfMRIvBAcPh5O6qWm8wlzEPBIU+qrZuRmARnH5A57zvOwYk0PDg+MlIBMRWz\nTPOwa+CutyiK284HhYaXc7q+nUtvXyFJPSqiguyZeW6LXDHf4b8cIR4NZxi/qWWy\nKB2f6Ixatn7m/OynG0eLA4k0IXEuWeyHVo+SrXcDVwKBgQDmg50BwC023vpI35rc\nKeUf3iMcO2kpT6KYL7IUpoPIwdXHEu+PUk7fcCbY7Jq9H7BG7M3WNJpAFgdJAJ8E\nmmA9xO3UDnbPGK9DNWl9BsSas6So+Cz9M3fZKLqYl0jGsPO0bPFFoMcMIXNUCVpf\nnox8E6X8wjtkm6MMFMwzA7O11wKBgQDNZh/OKPew9e8LN2RnmHReNrsGWrlSURYW\nYvN1crxcADnA7kXEgeAcaap0ZaiOWYgPqcbMWfxzpz8O5NBdsa52Hv3kUnG1ohg1\nwiwfCFHwUUm0Pst3fzgsaotH/XgvSqsQ9kQahoybSJzlusbSEjbjX5g4I0OLNP4k\nuNW4ATcrmwKBgEjMPdRktaLDjnVfMI/hJzwGMj5jQNXMEYRQY8QDxlCrbnD9OOyh\nSMllqM8PAdtCW7A6btL8L86XZluWt6GDg2teeuFiZAEJQahPAO58KbDVlOXL4qFg\nFLRfGXbBKDmffod3dEbR/KqHEd3zSjgyYRl6Nwx45rriL/7LvqVJwQJnAoGAUA9z\nbD9JtJ9X6q5Po5WoHiUFJ0frnmteyaEONoRfaRjpags2BI9/FHQXbcFGPx4ky74o\nb/TPUyEokhycHzknwID6A6ojCmJBP4sM+ZeboKl+qhQj6NMcyStKWOgylXRsU3M6\nPoCdg9V82oq//pf87wmO4qrUJAmm2hd1roBCyesCgYBtR+QCn2iaSSKC+eck6QVh\n5FbKEfX6jhoTgdL1bvurJcveRtPQFc+HJeezY33/Cb2f4eQW02uPrz4KuaRIcQen\nzobTfAlUbymBXn80xsAXTHO+W+QIXf+8VLZdDcuMURbJtlDFmuAkE+SILECpa5gQ\nQZl+lxrs1HJG5qBnNkI0pg==\n-----END PRIVATE KEY-----\n",
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1ZhCzCLwcK6tJ5ClUwkUoiPv0qwTu-4Y68yq1te-g4W4';

  // Check PEMESANAN PRODUK
  console.log('=== PEMESANAN PRODUK ===');
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'PEMESANAN PRODUK!A1:Z5',
    });
    const rows = res.data.values || [];
    console.log('Headers (Row 1):', JSON.stringify(rows[0]));
    console.log('Row 2:', JSON.stringify(rows[1]));
    console.log('Row 3:', JSON.stringify(rows[2]));
    console.log('Row 4:', JSON.stringify(rows[3]));
    console.log('Total rows fetched:', rows.length);
  } catch (e: any) {
    console.error('Error:', e.message);
  }

  // Check MASTER SKU
  console.log('\n=== MASTER SKU ===');
  try {
    const res2 = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MASTER SKU!A1:Z3',
    });
    const rows2 = res2.data.values || [];
    console.log('Headers (Row 1):', JSON.stringify(rows2[0]));
    console.log('Row 2:', JSON.stringify(rows2[1]));
    console.log('Total rows fetched:', rows2.length);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
