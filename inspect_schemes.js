const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'fastpay.db'));

console.log("=== ALL SCHEMES IN DB ===");
console.log(db.prepare('SELECT id, name, price, daily_return_rate FROM schemes ORDER BY id DESC').all());
