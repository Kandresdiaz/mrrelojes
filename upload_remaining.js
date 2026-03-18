const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://jpwieeoedcwvvadciakm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY env variable not set');
  process.exit(1);
}

function makeRequest(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const options = {
      hostname: 'jpwieeoedcwvvadciakm.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Alternative: use the SQL endpoint
function executeSQLViaREST(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'jpwieeoedcwvvadciakm.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Read all insert_part files and execute them
async function uploadFiles() {
  const files = ['insert_part_4.sql'].filter(f => fs.existsSync(f));
  
  for (const file of files) {
    console.log(`\n📂 Processing ${file}...`);
    const content = fs.readFileSync(file, 'utf8');
    
    // Split into individual INSERT statements
    const statements = content.split(/;\n\n/).filter(s => s.trim().startsWith('INSERT'));
    console.log(`   Found ${statements.length} batch statements`);
    
    for (let i = 0; i < statements.length; i++) {
      let stmt = statements[i].trim();
      if (!stmt.endsWith(';')) stmt += ';';
      
      try {
        await executeSQLViaREST(stmt);
        console.log(`   ✅ Batch ${i+1}/${statements.length} inserted`);
      } catch (err) {
        console.error(`   ❌ Batch ${i+1} failed: ${err.message.substring(0, 200)}`);
      }
      
      // small delay
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  console.log('\n✅ Done!');
}

uploadFiles().catch(console.error);
