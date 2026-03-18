const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('insert_part_') && f.endsWith('.sql'));

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace the end of each INSERT block with ON CONFLICT
    content = content.replace(/\);(?=\s*INSERT|\s*$)/g, ') ON CONFLICT (id) DO NOTHING;');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
