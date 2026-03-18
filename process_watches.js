const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\kevindiaz\\Downloads\\mrrelojes\\mrrelojes\\supplier2.json', 'utf8'));

const mapBrand = (title) => {
    const t = title.toUpperCase();
    if (t.includes('RELOJ RLX') || t.includes('ROLEX') || t.includes('RLX')) return 'Rolex';
    if (t.includes('TAG ')) return 'Tag Heuer';
    if (t.includes('INVICTA')) return 'Invicta';
    if (t.includes('PATEK')) return 'Patek Philippe';
    if (t.includes('AUDEMARS') || t.includes('AP ')) return 'Audemars Piguet';
    if (t.includes('HUB_')) return 'Hublot';
    if (t.includes('NAVIFORCE')) return 'Naviforce';
    if (t.includes('CURREN')) return 'Curren';
    if (t.includes('MEGIR')) return 'Megir';
    if (t.includes('NIBOSI')) return 'Nibosi';
    if (t.includes('CHENXI')) return 'Chenxi';
    if (t.includes('BENYAR')) return 'Benyar';
    if (t.includes('LIGE')) return 'Lige';
    if (t.includes('SKMEI')) return 'Skmei';
    if (t.includes('POEDAGAR')) return 'Poedagar';
    return 'Otras Marcas';
};

const processed = data.products.map(p => {
    const title = p.title;
    const body = p.body_html || '';
    const cleanBody = body.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
    
    const priceOrig = parseFloat(p.variants[0].price);
    const price = priceOrig + 15000;
    const original_price = Math.round((price * 1.8) / 5000) * 5000;
    
    const brand = mapBrand(title);
    
    let category = 'Caballeros';
    const lowerBody = cleanBody.toLowerCase();
    if (lowerBody.includes('mujer') || lowerBody.includes('dama')) {
        category = 'Damas';
    } else if (lowerBody.includes('unisex')) {
        category = 'Unisex';
    }

    const firstImage = p.images[0] ? p.images[0].src : null;
    if (!firstImage) return null;

    const images = p.images.map(img => img.src);

    // Extract Specs
    const extract = (regex, text, def = 'Por definir') => {
        const m = text.match(regex);
        return m ? m[1].trim() : def;
    };

    const specs = {
        caseSize: extract(/Diámetro de la caja:\s*([^.]+)/, cleanBody, '4.2 cm'),
        movement: extract(/Hora (Análoga|Digital)/i, cleanBody, 'Análoga'),
        warranty: extract(/(\d+) meses de garantía/, cleanBody, '6 meses'),
        condition: 'Nuevo',
        authenticity: title.toLowerCase().includes('original') ? 'Original' : 'AAA',
        caseMaterial: extract(/Caja:\s*([^|-]+)/, cleanBody, 'Acero'),
        strapMaterial: extract(/Correa:\s*([^|-]+)/, cleanBody, 'Silicona'),
        waterResistance: extract(/Resistente al agua:\s*([^.]+)/, cleanBody, 'Salpicaduras (No sumergible)')
    };

    return {
        name: title,
        price,
        original_price,
        description: cleanBody,
        brand,
        category,
        image_url: firstImage,
        images: JSON.stringify(images),
        specs,
        stock: 10
    };
}).filter(p => p !== null);

console.log(`Processing ${processed.length} products...`);

// Generate SQL
const values = processed.map(p => {
    const id = `watch-supplier-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const galleryArr = JSON.parse(p.images);
    const gallerySql = "ARRAY[" + galleryArr.map(img => `'${img}'`).join(', ') + "]";
    const specsSql = JSON.stringify(p.specs);
    
    return `('${id}', '${p.name.replace(/'/g, "''")}', ${p.price}, ${p.original_price}, '${p.description.replace(/'/g, "''")}', '${p.brand}', '${p.category}', '${p.image_url}', ${gallerySql}, ${p.stock}, '${specsSql.replace(/'/g, "''")}')`;
});

const batchSize = 10;
let sql = '';
for (let i = 0; i < values.length; i += batchSize) {
  const batch = values.slice(i, i + batchSize);
  sql += `INSERT INTO watches (id, name, price, original_price, description, brand, category, image, gallery, stock, specs) VALUES \n${batch.join(',\n')};\n\n`;
}

fs.writeFileSync('C:\\Users\\kevindiaz\\Downloads\\mrrelojes\\mrrelojes\\insert_products.sql', sql);
console.log('Saved to insert_products.sql');
