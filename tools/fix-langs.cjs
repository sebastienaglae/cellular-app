const fs = require('fs');
const f = 'src/app/services/i18n-langs.ts';
let c = fs.readFileSync(f, 'utf8');
// fix double-escaped quotes from JSON extraction
c = c.split("\\\\'").join("\\'");
fs.writeFileSync(f, c);
console.log('fixed escapes, occurrences:', (c.match(/\\\\'/g) || []).length);
