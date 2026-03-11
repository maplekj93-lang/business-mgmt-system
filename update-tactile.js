const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.next' || file === '.git') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Direct String Replacements for Safety
    const replacements = [
        ['glass-panel', 'tactile-panel'],
        ['glass-card', 'tactile-card'],
        ['backdrop-blur-xl', ''],
        ['backdrop-blur-lg', ''],
        ['backdrop-blur-md', ''],
        ['backdrop-blur-sm', ''],
        ['border-white/10', ''],
        ['border-white/5', ''],
        ['border-border/50', ''],
        ['bg-slate-900/40', 'bg-background'],
        ['bg-slate-900/20', 'bg-background/50'],
        ['bg-indigo-500/5', 'bg-background'],
        ['rounded-3xl', 'rounded-[2rem]'],
        ['shadow-2xl', ''],
        ['shadow-xl', ''],
        ['shadow-lg', ''],
        ['border border', 'border'],
        ['border ', ' '], // remove standalone border
        ['text-gray-500', 'text-muted-foreground'],
        ['bg-gray-50', 'bg-muted'],
        ['text-blue-600', 'text-primary'],
        ['bg-blue-600', 'bg-primary']
    ];

    replacements.forEach(([target, replacement]) => {
        // We use split and join to replace all occurrences literally
        content = content.split(target).join(replacement);
    });

    // Clean up multiple spaces inside className strings
    content = content.replace(/className="([^"]*)"/g, (match, p1) => {
        return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files updated: ${changedCount}`);
