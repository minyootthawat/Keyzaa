const r = await fetch('http://localhost:3000/api/products');
console.log('status:', r.status, 'ok:', r.ok);
const body = await r.text();
console.log('body:', body.slice(0, 200));