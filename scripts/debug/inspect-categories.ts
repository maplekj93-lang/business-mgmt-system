import fs from 'fs';

const filePath = '/Users/kwang/Downloads/가계부관련/2025 쾅영부부 가계부 - 가계부 설정 ✍️.csv';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

const results: any = { 'Expense': {}, 'Income': {} };

let currentType = '';
let currentMain = '';

// Nelna schema logic:
// Col 0 is sometimes empty
// col 1: Type (수입/지출/자산/부채)
// col 2: Main Category (대분류)
// col 4, 6, 8...: Sub Category

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');

    // Safety check
    if (cols.length < 3) continue;

    // Type setting
    const typeCol = cols[1]?.trim();
    if (typeCol === '수입' || typeCol === '지출') {
        currentType = typeCol === '수입' ? 'Income' : 'Expense';
    } else if (typeCol === '자산' || typeCol === '부채') {
        currentType = ''; // We don't care about asset/liability right now
    }

    // Main setting
    const mainCol = cols[2]?.trim();
    if (mainCol && mainCol !== '대분류' && mainCol !== 'FALSE' && mainCol !== 'TRUE' && currentType) {
        currentMain = mainCol;
        if (!results[currentType][currentMain]) {
            results[currentType][currentMain] = [];
        }
    }

    // Subcategories setting
    if (currentType && currentMain && results[currentType]) {
        for (let c = 4; c < cols.length; c += 2) {
            const sub = cols[c]?.trim();
            if (sub && sub !== 'TRUE' && sub !== 'FALSE' && sub !== '소분류') {
                const cleanSub = sub.replace(/^"(.*)"$/, '$1').trim();
                // Avoid IDs or unrelated tags
                if (cleanSub && !/^\d{8}$/.test(cleanSub) && cleanSub !== '자산' && cleanSub !== '부채' && cleanSub !== currentMain) {
                    if (!results[currentType][currentMain].includes(cleanSub)) {
                        results[currentType][currentMain].push(cleanSub);
                    }
                }
            }
        }
    }
}

console.log(JSON.stringify(results, null, 2));
