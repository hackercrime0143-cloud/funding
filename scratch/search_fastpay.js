const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Searching for "terminal":');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('terminal')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

console.log('\nSearching for "fastpay":');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('fastpay')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
