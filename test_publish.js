// test_publish.js — script de prueba para registrar, loguear y publicar un artículo
// Requiere Node 18+ (fetch disponible)

const BASE = 'http://localhost:5000/api';

const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${BASE}/regions`);
      if (res.ok) return true;
    } catch (e) {}
    await wait(1000);
  }
  throw new Error('Server no respondió en el tiempo esperado');
}

async function run() {
  try {
    console.log('Esperando servidor...');
    await waitForServer(20000);
    console.log('Servidor listo. Registrando usuario de prueba...');

    const unique = Date.now();
    const registerBody = {
      username: `testuser_${unique}`,
      email: `test_${unique}@example.com`,
      password: 'password123',
      server: 'TestServer',
      region: 'Europe'
    };

    let res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerBody)
    });

    const regData = await res.json();
    console.log('Registro:', res.status, regData);

    const loginBody = { email: registerBody.email, password: registerBody.password };
    res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginBody)
    });
    const loginData = await res.json();
    console.log('Login:', res.status, loginData);

    if (!res.ok) throw new Error('Login falló');

    const token = loginData.token;

    console.log('Intentando crear artículo...');
    const itemBody = {
      name: 'Artículo de prueba',
      price: 1234,
      imageUrl: 'https://via.placeholder.com/150',
      largeImageUrl: 'https://via.placeholder.com/600',
      description: 'Publicado desde script de prueba',
      tier: 1,
      type: 'Otros',
      region: 'Europe',
      server: 'TestServer',
      stock: 1
    };

    res = await fetch(`${BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(itemBody)
    });

    const itemData = await res.json();
    console.log('Crear item:', res.status, itemData);

    if (res.ok) console.log('Prueba completada: artículo publicado correctamente');
    else throw new Error('Publicación falló: ' + JSON.stringify(itemData));

  } catch (err) {
    console.error('Error durante la prueba:', err.message || err);
    process.exitCode = 2;
  }
}

run();
