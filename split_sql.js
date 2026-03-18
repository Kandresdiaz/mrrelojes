const fs = require('fs');
const content = fs.readFileSync('insert_products.sql', 'utf8');
const lines = content.split('\n');
const chunkSize = 60; // 5 batches per file

for (let i = 0; i < 5; i++) {
  const start = i * chunkSize;
  const end = (i + 1) * chunkSize;
  fs.writeFileSync(`insert_part_${i}.sql`, lines.slice(start, end).join('\n'));
  console.log(`Saved insert_part_${i}.sql`);
}
