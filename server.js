// server.js - Backend simplificado con Google Sheets como BD
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_super_seguro_aqui";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ==================== CONFIGURACIÓN GOOGLE SHEETS ====================

// Configurar autenticación con Google Sheets
// Leer configuración de las credenciales serializadas si existe (deployment)
let auth;
if (process.env.GCP_CREDENTIALS_JSON) {
  auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GCP_CREDENTIALS_JSON),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  // Leer el archivo de credenciales en caso contrario (local dev)
} else {
  auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // Archivo de credenciales de servicio
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const sheets = google.sheets({ version: "v4", auth });

// ID de tu Google Spreadsheet (lo obtienes de la URL)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "TU_SPREADSHEET_ID_AQUI";
console.log("✅ Google Sheets API configurada correctamente");
console.log("📊 Spreadsheet ID:", SPREADSHEET_ID);

// Nombres de las hojas
const SHEETS = {
  USERS: "Users",
  ITEMS: "Items",
  OFFERS: "Offers",
  MESSAGES: "Messages",
  ITEMS_CATALOG: "ItemsCatalog",
};

// Listas predefinidas
const REGIONS = ["Europe", "North America", "South America", "Oceania", "Asia"];
const SERVERS = [
  "Arrakis-01",
  "Arrakis-02",
  "Caladan-01",
  "Giedi-Prime-01",
  "Kaitain-01",
];

// ==================== FUNCIONES HELPER PARA GOOGLE SHEETS ====================

// Leer datos de una hoja
async function readSheet(sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    // Primera fila son los headers
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    return data;
  } catch (error) {
    console.error(`Error leyendo hoja ${sheetName}:`, error.message);
    return [];
  }
}

// Agregar fila a una hoja
async function appendRow(sheetName, values) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: "RAW",
      resource: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error agregando fila a ${sheetName}:`, error.message);
    throw error;
  }
}

// Actualizar fila específica
async function updateRow(sheetName, rowIndex, values) {
  try {
    const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error actualizando fila en ${sheetName}:`, error.message);
    throw error;
  }
}

// Buscar fila por ID
async function findRowByField(sheetName, fieldName, value) {
  const data = await readSheet(sheetName);
  const index = data.findIndex((row) => row[fieldName] === value);
  return { data: data[index], index: index + 2 }; // +2 porque row 1 son headers y arrays empiezan en 0
}

// Generar ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Autenticación requerida" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: user } = await findRowByField(
      SHEETS.USERS,
      "id",
      decoded.userId
    );

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Registro
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, server, region } = req.body;

    if (!username || !email || !password || !server || !region) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Verificar si el usuario ya existe
    const users = await readSheet(SHEETS.USERS);
    const existingUser = users.find(
      (u) => u.email === email || u.username === username
    );

    if (existingUser) {
      return res.status(400).json({ error: "El usuario o email ya existe" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    // Crear usuario
    const newUser = [
      userId,
      username,
      email,
      hashedPassword,
      "https://placehold.co/100x100/4F46E5/FFFFFF/png", // avatar
      "seller", // ← Siempre "seller"
      "0", // ← 0 solari (no se usa en la web)
      server,
      region,
      new Date().toISOString(),
    ];

    await appendRow(SHEETS.USERS, newUser);

    // Generar token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Usuario creado exitosamente",
      token,
      user: {
        id: userId,
        username,
        email,
        avatar: newUser[4],
        role: "seller",
        server: server,
        region: region,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const users = await readSheet(SHEETS.USERS);
    console.log("👥 Usuarios encontrados:", users);
    console.log("📧 Buscando email:", email);
    const user = users.find((u) => u.email === email);
    console.log("👤 Usuario encontrado:", user);

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        solari: parseInt(user.solari),
        server: user.server,
        region: user.region,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perfil del usuario
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      solari: parseInt(req.user.solari),
    },
  });
});

// ==================== RUTAS DE ARTÍCULOS ====================

// Obtener todos los artículos
app.get("/api/items", async (req, res) => {
  try {
    const { tier, type, minPrice, maxPrice, search, sortBy } = req.query;
    let items = await readSheet(SHEETS.ITEMS);
    console.log("Items leídos:", items);

    // Filtrar solo items disponibles
    items = items.filter((item) => item.status === "available");

    // Aplicar filtros
    if (tier) {
      items = items.filter((item) => item.tier === tier);
    }
    if (type) {
      items = items.filter((item) => item.type === type);
    }
    if (minPrice) {
      items = items.filter(
        (item) => parseInt(item.price) >= parseInt(minPrice)
      );
    }
    if (maxPrice) {
      items = items.filter(
        (item) => parseInt(item.price) <= parseInt(maxPrice)
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    if (sortBy === "price_asc") {
      items.sort((a, b) => parseInt(a.price) - parseInt(b.price));
    } else if (sortBy === "price_desc") {
      items.sort((a, b) => parseInt(b.price) - parseInt(a.price));
    } else if (sortBy === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Obtener info del vendedor para cada item
    const users = await readSheet(SHEETS.USERS);
    const itemsWithSeller = items.map((item) => {
      const seller = users.find((u) => u.id === item.sellerId);
      return {
        ...item,
        price: parseInt(item.price),
        tier: parseInt(item.tier),
        stock: parseInt(item.stock),
        seller: seller
          ? {
              username: seller.username,
              avatar: seller.avatar,
            }
          : null,
      };
    });

    res.json({ items: itemsWithSeller, count: itemsWithSeller.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un artículo por ID
app.get("/api/items/:id", async (req, res) => {
  try {
    const { data: item } = await findRowByField(
      SHEETS.ITEMS,
      "id",
      req.params.id
    );

    if (!item) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }

    // Obtener info del vendedor
    const { data: seller } = await findRowByField(
      SHEETS.USERS,
      "id",
      item.sellerId
    );

    res.json({
      item: {
        ...item,
        price: parseInt(item.price),
        tier: parseInt(item.tier),
        stock: parseInt(item.stock),
        seller: seller
          ? {
              username: seller.username,
              avatar: seller.avatar,
              email: seller.email,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo artículo
app.post("/api/items", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      price,
      imageUrl,
      largeImageUrl,
      description,
      tier,
      type,
      stock,
      region,
      server,
    } = req.body;

    if (!name || !price || !tier || !type || !imageUrl || !region || !server) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const itemId = generateId();
    const newItem = [
      itemId,
      name,
      price.toString(),
      imageUrl,
      largeImageUrl || imageUrl,
      description || "",
      tier.toString(),
      type,
      req.user.id, // sellerId
      "available",
      (stock || 1).toString(),
      region, // ← NUEVO
      server, // ← NUEVO
      new Date().toISOString(),
    ];

    await appendRow(SHEETS.ITEMS, newItem);

    res.status(201).json({
      message: "Artículo creado exitosamente",
      item: {
        id: itemId,
        name,
        price: parseInt(price),
        imageUrl,
        largeImageUrl: largeImageUrl || imageUrl,
        description: description || "",
        tier: parseInt(tier),
        type,
        region,
        server,
        seller: {
          username: req.user.username,
          avatar: req.user.avatar,
        },
        status: "available",
        stock: parseInt(stock || 1),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE CATÁLOGO Y FILTROS ====================

// Obtener catálogo de items del juego
app.get("/api/items-catalog", async (req, res) => {
  try {
    const { search } = req.query;
    let catalog = await readSheet(SHEETS.ITEMS_CATALOG);

    if (search) {
      const searchLower = search.toLowerCase();
      catalog = catalog.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    res.json({ items: catalog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener regiones
app.get("/api/regions", async (req, res) => {
  res.json({ regions: REGIONS });
});

// Obtener servidores
app.get("/api/servers", async (req, res) => {
  res.json({ servers: SERVERS });
});

// ==================== RUTAS DE OFERTAS ====================

// Crear una oferta
app.post("/api/offers", authMiddleware, async (req, res) => {
  try {
    const { itemId, amount, message } = req.body;

    const { data: item } = await findRowByField(SHEETS.ITEMS, "id", itemId);

    if (!item) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }

    if (item.status !== "available") {
      return res
        .status(400)
        .json({ error: "Este artículo ya no está disponible" });
    }

    if (item.sellerId === req.user.id) {
      return res
        .status(400)
        .json({ error: "No puedes ofertar por tu propio artículo" });
    }

    const offerId = generateId();
    const newOffer = [
      offerId,
      itemId,
      req.user.id, // buyerId
      item.sellerId,
      amount.toString(),
      "pending",
      message || "",
      new Date().toISOString(),
    ];

    await appendRow(SHEETS.OFFERS, newOffer);

    res.status(201).json({
      message: "Oferta enviada",
      offer: {
        id: offerId,
        itemId,
        amount: parseInt(amount),
        status: "pending",
        message,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener ofertas del usuario
app.get("/api/offers/my-offers", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    let offers = await readSheet(SHEETS.OFFERS);

    if (type === "sent") {
      offers = offers.filter((o) => o.buyerId === req.user.id);
    } else if (type === "received") {
      offers = offers.filter((o) => o.sellerId === req.user.id);
    } else {
      offers = offers.filter(
        (o) => o.buyerId === req.user.id || o.sellerId === req.user.id
      );
    }

    // Enriquecer con datos de items y usuarios
    const items = await readSheet(SHEETS.ITEMS);
    const users = await readSheet(SHEETS.USERS);

    const enrichedOffers = offers.map((offer) => {
      const item = items.find((i) => i.id === offer.itemId);
      const buyer = users.find((u) => u.id === offer.buyerId);
      const seller = users.find((u) => u.id === offer.sellerId);

      return {
        ...offer,
        amount: parseInt(offer.amount),
        item: item ? { name: item.name, imageUrl: item.imageUrl } : null,
        buyer: buyer
          ? { username: buyer.username, avatar: buyer.avatar }
          : null,
        seller: seller
          ? { username: seller.username, avatar: seller.avatar }
          : null,
      };
    });

    res.json({ offers: enrichedOffers, count: enrichedOffers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Responder a una oferta
app.put("/api/offers/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { data: offer, index: offerIndex } = await findRowByField(
      SHEETS.OFFERS,
      "id",
      req.params.id
    );

    if (!offer) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }

    if (offer.sellerId !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    if (offer.status !== "pending") {
      return res.status(400).json({ error: "Esta oferta ya fue procesada" });
    }

    // Actualizar oferta
    offer.status = status;
    await updateRow(SHEETS.OFFERS, offerIndex, Object.values(offer));

    if (status === "accepted") {
      // Actualizar item como vendido
      const { data: item, index: itemIndex } = await findRowByField(
        SHEETS.ITEMS,
        "id",
        offer.itemId
      );
      item.status = "sold";
      item.stock = Math.max(0, parseInt(item.stock) - 1).toString();
      await updateRow(SHEETS.ITEMS, itemIndex, Object.values(item));

      // Transferir solari
      const { data: buyer, index: buyerIndex } = await findRowByField(
        SHEETS.USERS,
        "id",
        offer.buyerId
      );
      const { data: seller, index: sellerIndex } = await findRowByField(
        SHEETS.USERS,
        "id",
        offer.sellerId
      );

      const buyerSolari = parseInt(buyer.solari);
      const offerAmount = parseInt(offer.amount);

      if (buyerSolari < offerAmount) {
        return res
          .status(400)
          .json({ error: "El comprador no tiene suficiente Solari" });
      }

      buyer.solari = (buyerSolari - offerAmount).toString();
      seller.solari = (parseInt(seller.solari) + offerAmount).toString();

      await updateRow(SHEETS.USERS, buyerIndex, Object.values(buyer));
      await updateRow(SHEETS.USERS, sellerIndex, Object.values(seller));
    }

    res.json({
      message: `Oferta ${status === "accepted" ? "aceptada" : "rechazada"}`,
      offer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE MENSAJES ====================

// Enviar mensaje
app.post("/api/messages", authMiddleware, async (req, res) => {
  try {
    const { to, content, itemId } = req.body;

    const messageId = generateId();
    const newMessage = [
      messageId,
      req.user.id, // from
      to,
      itemId || "",
      content,
      "false", // read
      new Date().toISOString(),
    ];

    await appendRow(SHEETS.MESSAGES, newMessage);

    res.status(201).json({
      message: "Mensaje enviado",
      data: {
        id: messageId,
        from: req.user.id,
        to,
        content,
        itemId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener conversación
app.get(
  "/api/messages/conversation/:userId",
  authMiddleware,
  async (req, res) => {
    try {
      let messages = await readSheet(SHEETS.MESSAGES);

      messages = messages.filter(
        (m) =>
          (m.from === req.user.id && m.to === req.params.userId) ||
          (m.from === req.params.userId && m.to === req.user.id)
      );

      // Marcar como leídos
      const users = await readSheet(SHEETS.USERS);
      const enrichedMessages = messages.map((msg) => {
        const fromUser = users.find((u) => u.id === msg.from);
        const toUser = users.find((u) => u.id === msg.to);

        return {
          ...msg,
          read: msg.read === "true",
          from: fromUser
            ? { username: fromUser.username, avatar: fromUser.avatar }
            : null,
          to: toUser
            ? { username: toUser.username, avatar: toUser.avatar }
            : null,
        };
      });

      res.json({ messages: enrichedMessages, count: enrichedMessages.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtener items del usuario (sus ventas)
app.get("/api/my-items", authMiddleware, async (req, res) => {
  try {
    let items = await readSheet(SHEETS.ITEMS);

    // Filtrar items del usuario actual
    items = items.filter((item) => item.sellerId === req.user.id);

    res.json({ items, count: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de ventas
app.get("/api/sales-stats", authMiddleware, async (req, res) => {
  try {
    let items = await readSheet(SHEETS.ITEMS);
    const offers = await readSheet(SHEETS.OFFERS);

    // Items del usuario
    const myItems = items.filter((item) => item.sellerId === req.user.id);

    // Ofertas relacionadas con mis items
    const myOffers = offers.filter((offer) => offer.sellerId === req.user.id);

    const stats = {
      totalItems: myItems.length,
      activeItems: myItems.filter((item) => item.status === "available").length,
      soldItems: myItems.filter((item) => item.status === "sold").length,
      pendingOffers: myOffers.filter((offer) => offer.status === "pending")
        .length,
      acceptedOffers: myOffers.filter((offer) => offer.status === "accepted")
        .length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= INICIO DEL SERVIDOR (dev) =================

if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Usando Google Sheets como base de datos`);
  });
}

module.exports = app;
