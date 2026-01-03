# Bazar Dune

Marketplace full-stack para jugadores de Dune Online. Compra, vende e intercambia objetos del juego con otros jugadores.

## Tecnologías

### Frontend
- **React 19.2.3** - Framework de interfaz de usuario
- **Webpack 5** - Bundler y servidor de desarrollo
- **Tailwind CSS** - Framework de estilos (vía CDN)
- **JWT** - Autenticación de usuarios

### Backend
- **Node.js + Express.js** - Servidor API REST
- **Google Sheets API** - Base de datos (sin necesidad de MySQL/PostgreSQL)
- **bcryptjs** - Hashing de contraseñas
- **jsonwebtoken** - Autenticación JWT

## Características

- Sistema de autenticación (registro/login)
- Marketplace de artículos del juego
- Filtros por servidor, tier, tipo y precio
- Sistema de mensajería entre usuarios
- Ofertas integradas en conversaciones
- Perfil de usuario con estadísticas de ventas
- Herramientas de cálculo para mecánicas del juego
- Soporte multi-región/multi-servidor

## Requisitos Previos

1. **Node.js** (v14 o superior)
2. **npm** o **yarn**
3. **Cuenta de Google Cloud Platform** con Google Sheets API habilitada
4. **Google Spreadsheet** creado con las hojas: `Users`, `Items`, `Offers`, `Messages`, `ItemsCatalog`

## Configuración Local

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd bazar-dune
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Google Sheets API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Google Sheets API**
4. Crea credenciales de **Service Account**
5. Descarga el archivo JSON de credenciales
6. Guárdalo como `credentials.json` en la raíz del proyecto

### 4. Crear el archivo `.env`

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
PORT=8000
API_BASE_URL=http://localhost:8000/api
SPREADSHEET_ID=tu_spreadsheet_id_aqui
JWT_SECRET=tu_clave_secreta_super_segura_aqui
NODE_ENV=development
```

**Nota:** El `SPREADSHEET_ID` se obtiene de la URL de tu Google Spreadsheet:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

### 5. Ejecutar en desarrollo

#### Opción A: Frontend y Backend por separado

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

El frontend estará en `http://localhost:8080` y el backend en `http://localhost:8000`

#### Opción B: Build de producción local

```bash
npm run build
npm start
```

La aplicación completa estará en `http://localhost:8000`

## Despliegue en Railway

### 1. Preparar el proyecto

El proyecto ya está configurado para Railway con:
- `railway.json` - Configuración de deployment
- `package.json` - Scripts de `start` y `postinstall`
- `.env.example` - Documentación de variables de entorno

### 2. Crear cuenta en Railway

1. Ve a [Railway.app](https://railway.app/)
2. Regístrate con GitHub
3. Crea un nuevo proyecto

### 3. Desplegar desde GitHub

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza a Railway para acceder a tu repositorio
4. Selecciona el repositorio `bazar-dune`
5. Railway detectará automáticamente que es un proyecto Node.js

### 4. Configurar Variables de Entorno

En el dashboard de Railway, ve a **Variables** y agrega:

```
SPREADSHEET_ID=tu_spreadsheet_id_aqui
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
NODE_ENV=production
GCP_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

**Importante:** Para `GCP_CREDENTIALS_JSON`:
1. Abre tu archivo `credentials.json`
2. Copia TODO el contenido JSON
3. Pégalo como una sola línea (sin saltos de línea)
4. Asegúrate de que esté entre comillas dobles si Railway lo requiere

### 5. Desplegar

Railway desplegará automáticamente cuando hagas push a tu rama principal:

```bash
git add .
git commit -m "Preparar para deployment en Railway"
git push origin main
```

### 6. Obtener la URL de producción

1. En Railway, ve a **Settings** → **Domains**
2. Railway te asignará un dominio como: `https://tu-app.up.railway.app`
3. Actualiza la variable `API_BASE_URL` si es necesario (opcional)

### 7. Verificar el despliegue

Accede a tu URL de Railway y verifica que:
- La página principal carga correctamente
- Puedes registrarte e iniciar sesión
- El marketplace muestra artículos
- Las funcionalidades principales funcionan

## Scripts Disponibles

```bash
npm start              # Iniciar servidor en producción (después del build)
npm run build          # Compilar frontend con webpack (producción)
npm run dev            # Iniciar frontend en desarrollo (puerto 8080)
npm run server         # Iniciar backend en desarrollo (puerto 8000)
npm run dev:foreground # Frontend en modo foreground
npm run server:foreground # Backend en modo foreground
```

## Estructura del Proyecto

```
bazar-dune/
├── server.js              # Servidor Express + API REST
├── src/
│   ├── index.html        # HTML principal
│   └── js/
│       └── app.js        # Aplicación React
├── public/               # Build de webpack (generado)
├── scripts/              # Scripts de desarrollo
├── package.json          # Dependencias y scripts
├── webpack.config.js     # Configuración de webpack
├── railway.json          # Configuración de Railway
├── .env.example          # Plantilla de variables de entorno
└── README.md            # Este archivo
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere token)

### Artículos
- `GET /api/items` - Listar artículos del marketplace
- `GET /api/items/:id` - Obtener artículo específico
- `POST /api/items` - Publicar nuevo artículo (requiere auth)
- `GET /api/my-items` - Mis artículos publicados (requiere auth)
- `DELETE /api/items/:id` - Eliminar artículo (requiere auth)

### Ofertas y Mensajería
- `POST /api/offers` - Enviar oferta (requiere auth)
- `GET /api/offers/my-offers` - Ver ofertas recibidas (requiere auth)
- `PUT /api/offers/:id` - Actualizar estado de oferta (requiere auth)
- `POST /api/messages` - Enviar mensaje (requiere auth)
- `GET /api/messages/conversation/:userId` - Ver conversación
- `GET /api/messages/inbox` - Bandeja de entrada (requiere auth)

### Metadata
- `GET /api/regions` - Listar regiones disponibles
- `GET /api/servers` - Listar servidores disponibles
- `GET /api/sales-stats` - Estadísticas de ventas (requiere auth)

## Tareas Pendientes

- [x] Selección de servidor en el registro
- [ ] No mostrar artículo si no hay nada seleccionado
- [ ] Controlar requests anónimas
- [ ] Campos requeridos al crear usuario
- [ ] Tests automatizados
- [ ] Documentación de API con Swagger

## Solución de Problemas

### Error: "Cannot find module 'credentials.json'"

**Desarrollo local:**
Asegúrate de tener el archivo `credentials.json` en la raíz del proyecto.

**Producción en Railway:**
Verifica que la variable `GCP_CREDENTIALS_JSON` esté configurada correctamente en las variables de entorno.

### Error: "SPREADSHEET_ID not found"

Verifica que:
1. El `SPREADSHEET_ID` en `.env` (local) o en Railway (producción) sea correcto
2. El spreadsheet tenga las hojas: `Users`, `Items`, `Offers`, `Messages`, `ItemsCatalog`
3. La Service Account tenga permisos de editor en el spreadsheet

### La aplicación no carga en Railway

1. Revisa los logs en Railway: **Deployments** → **View Logs**
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el build se completó correctamente
4. Revisa que `GCP_CREDENTIALS_JSON` esté en formato JSON válido (una sola línea)

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

MIT

## Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.
