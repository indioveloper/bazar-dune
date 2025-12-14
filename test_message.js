// test_message.js — registra vendedor y comprador, crea item y envía mensaje desde comprador
const BASE = 'http://localhost:5000/api';
const wait = ms => new Promise(r => setTimeout(r, ms));
async function waitForServer(timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${BASE}/regions`);
      if (res.ok) return true;
    } catch (e) {}
    await wait(500);
  }
  throw new Error('Server no respondió');
}

async function run() {
  await waitForServer();
  const t = Date.now();
  // Registrar vendedor
  const seller = { username: `seller_${t}`, email: `seller_${t}@example.com`, password: 'password', server: 'TestServer', region: 'Europe' };
  let res = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(seller) });
  const sdata = await res.json();
  console.log('seller register', res.status, sdata.message);
  const sellerToken = sdata.token;

  // Crear item como seller
  res = await fetch(`${BASE}/items`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${sellerToken}`}, body: JSON.stringify({ name: 'ItemTest', price: 100, imageUrl: 'https://via.placeholder.com/150', largeImageUrl: 'https://via.placeholder.com/600', description: 'desc', tier:1, type:'Otros', region: 'Europe', server: 'TestServer' }) });
  const itemData = await res.json();
  console.log('create item', res.status, itemData.message || itemData.error);
  const itemId = itemData.item.id;

  // Registrar comprador
  const buyer = { username: `buyer_${t}`, email: `buyer_${t}@example.com`, password: 'password', server: 'TestServer', region: 'Europe' };
  res = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(buyer) });
  const bdata = await res.json();
  const buyerToken = bdata.token;
  const buyerId = bdata.user.id;
  console.log('buyer register', res.status, bdata.message);

  // Buyer envía mensaje al seller
  res = await fetch(`${BASE}/messages`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${buyerToken}`}, body: JSON.stringify({ to: sdata.user.id, content: 'Hola, quiero coordinar la compra. ¿Dónde nos vemos?', itemId }) });
  const msgRes = await res.json();
  console.log('post message', res.status, msgRes.message || msgRes.error);

  // Buyer obtiene conversación con seller
  res = await fetch(`${BASE}/messages/conversation/${sdata.user.id}`, { headers: { 'Authorization': `Bearer ${buyerToken}` } });
  const conv = await res.json();
  console.log('conversation as buyer count:', conv.count);
  console.log(conv.messages && conv.messages.slice(-1)[0]);

  // Seller obtiene inbox
  res = await fetch(`${BASE}/messages/inbox`, { headers: { 'Authorization': `Bearer ${sellerToken}` } });
  const inbox = await res.json();
  console.log('seller inbox count:', inbox.count);
  console.log(inbox.messages && inbox.messages.slice(-1)[0]);
}

run().catch(e => { console.error(e); process.exit(2); });
