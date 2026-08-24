const fs = require('fs');
const f = 'src/app/services/store.service.ts';
const c = fs.readFileSync(f, 'utf8');
console.log('heatSubject:', c.includes('heat$'));
console.log('K_HEAT:', c.includes('K_HEAT'));
console.log('addHeat:', c.includes('addHeat'));
console.log('realHeat:', c.includes('realHeat'));
console.log('heatLoad:', c.includes('K_HEAT })') || c.includes('K_HEAT })'));
console.log('hasCR:', c.includes('\r'));
