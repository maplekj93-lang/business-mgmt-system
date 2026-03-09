const fs = require('fs');
const path = require('path');

const oldPath = '/Users/kwang/Desktop/사업가계부통합관리시스템';
const newPath = '/Users/kwang/Desktop/business-mgmt-system';

console.log(`Renaming ${oldPath} -> ${newPath}`);

try {
    fs.renameSync(oldPath, newPath);
    console.log('Rename successful!');
} catch (e) {
    console.error('Rename failed:', e);
    process.exit(1);
}
