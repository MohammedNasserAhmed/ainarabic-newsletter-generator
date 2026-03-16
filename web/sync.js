import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../output');
const dataDir = path.join(__dirname, 'public/data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Function to format date into "March 01" style
function formatDateStr(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
}

const files = fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : [];
const jsonFiles = files.filter(f => f.startsWith('newsletter_') && f.endsWith('.json'));

const index = [];

jsonFiles.forEach(file => {
    // Extract date from filename: newsletter_YYYY-MM-DD.json
    const dateStr = file.replace('newsletter_', '').replace('.json', '');
    const dateObj = new Date(dateStr);
    
    // Calculate week period (assuming 7 days lookback)
    const startDate = new Date(dateObj);
    startDate.setDate(startDate.getDate() - 7);
    
    const year = dateObj.getFullYear();
    const weekPeriod = `${formatDateStr(startDate)} - ${formatDateStr(dateObj)}, ${year}`;
    
    index.push({
        id: dateStr,
        title: `aiNarabic Newsletter [${weekPeriod}]`,
        file: file,
        date: dateStr
    });
    
    // Copy the file
    fs.copyFileSync(path.join(outputDir, file), path.join(dataDir, file));
});

// Sort by date descending
index.sort((a, b) => b.id.localeCompare(a.id));

fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`Synced ${index.length} newsletters to public/data/`);
