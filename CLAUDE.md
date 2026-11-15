# TuCompra

Tienda online (catalogo, carrito, checkout con MercadoPago) con panel de administracion (productos, ventas, envios, reportes de rentabilidad).

## ADVERTENCIA: produccion y desarrollo estan separados, pero hay que mantenerlos asi

La base de produccion esta en Aiven y el backend en Render. El entorno local debe usar la base de desarrollo (`tucompra_dev` en el MySQL local).

- **Nunca ejecutes nada que escriba en la base de produccion, ni migraciones, sin autorizacion explicita del usuario.**
- **Proteccion en codigo:** si `NODE_ENV` no es `production` (o no esta definido), `backend/src/config/db.js` se niega a arrancar cuando el host de `DATABASE_URL` no es `localhost`, `127.0.0.1` o `::1` (`src/config/proteccionBase.js`). Extras opcionales, solo en el `.env` local y nunca en el repo: `DB_HOSTS_PERMITIDOS` (hosts remotos aceptados a proposito) y `DB_HOST_PRODUCCION` (se rechaza siempre fuera de produccion).
- Si ves ese error al arrancar, el `.env` apunta a una base remota: corrigelo, no lo esquives.
- Los tests nunca leen el `.env`: `backend/jest.setup.js` fija `NODE_ENV=test` y una `DATABASE_URL` local falsa.
- `npm start` ejecuta `asegurarEsquema()` (ALTER TABLE idempotentes) contra la base configurada: solo con la base de desarrollo.
- El `.env` local tambien debe usar el access token de PRUEBA de Mercado Pago y `CLOUDINARY_CARPETA` distinta a la real.
- `frontend/src/config.js` puede estar apuntando a `localhost:4000` o a Render; es un cambio local, no se commitea.

## Entorno local (desarrollo)

1. Con una cuenta administradora de tu MySQL local (puerto 3306): `mysql -u root -p < backend/scripts/crear-base-dev.sql` (crea la base y el usuario `tucompra_dev`, solo accesibles desde esta maquina).
2. Cargar el esquema: `mysql -u tucompra_dev -p tucompra_dev < backend/baseDatos.sql` (clave de desarrollo: `tucompra_dev`).
3. `cp backend/.env.example backend/.env` y completar las claves que falten (Cloudinary y Mercado Pago de prueba).
4. `cd backend && npm run semillas` carga productos y pedidos FALSOS (solo si las tablas estan vacias; nunca borra).
5. `cd backend && npm start`, y en otra terminal `cd frontend && npm start` (con `API_URL` en `frontend/src/config.js` apuntando a `http://localhost:4000`).
6. Para empezar de cero: `DROP DATABASE tucompra_dev;` y repetir los pasos 1, 2 y 4.

El admin de desarrollo sale de `ADMIN_USER` y `ADMIN_PASSWORD` del `.env` (no esta en la base).

## Stack

- **Backend** (`backend/`, desplegado en Render): Node + Express 5, MySQL en Aiven en produccion y MySQL local en desarrollo (`mysql2/promise`, pool en `src/config/db.js`), JWT en cookie httpOnly (`cookie-parser`, `jsonwebtoken`, `helmet`), Cloudinary + multer para imagenes, MercadoPago (`mercadopago`) con webhook.
- **Frontend** (`frontend/`, dominio tucmpra.store): React 18 con Create React App (`react-scripts`) + Tailwind. **No usar MUI**: `@mui/material` y `@emotion/*` figuran en `frontend/package.json` pero no se importan en `src/`; no agregar usos nuevos.
- Carrito en `localStorage` (clave `productos`, ver `frontend/src/modules/cart/useCarrito.js`).
- Idioma del codigo y comentarios: espanol.

## Estructura

- `backend/src/`: `modules/` (auth, cart, imagenes, products), `pedidos/`, `reportes/`, `webhook/`, `middleware/`, `config/`, `utils/`.
- `frontend/src/`: `modules/` (admin, cart, pagos, products), `services/`, `shared/`.
- `backend/baseDatos.sql`: esquema base de referencia.
- El `package.json`/`package-lock.json` de la raiz es un duplicado desactualizado del de `backend/`; los reales son `backend/package.json` y `frontend/package.json`.

## Comandos

- Backend (`cd backend`): `npm start` (solo con la base de desarrollo), `npm test` (jest + supertest), `npm run semillas` (datos falsos de desarrollo).
- Frontend (`cd frontend`): `npm start`, `npm run build`, `npm test` (react-scripts / Testing Library).
- No hay linter ni scripts de migracion definidos en el repo.

## Reglas de trabajo

- Una rama por bloque de trabajo; un commit por cambio; **sin push** (no hacer push salvo que el usuario lo pida).
- **No stagear** `package.json`, `package-lock.json` (raiz) ni `frontend/src/config.js`: tienen cambios locales que no van en los commits. Agregar archivos por nombre, nunca `git add .` ni `git add -A`.
- Plan de Fase 1 aprobado por el usuario antes de implementar.
- Mensajes de commit estilo `feat:`, `style:`, `chore:`, `fix:`.

## Tests

- Los tests usan mocks (`jest.mock`) y no escriben en la base real. Ejemplo: `backend/src/config/db.esquema.test.js` mockea `mysql2/promise`.
- Un test nuevo nunca debe abrir conexion real ni depender de `DATABASE_URL`.

## Base de datos y esquema

- Los cambios de esquema deben ser idempotentes (comprobar `INFORMATION_SCHEMA` antes del `ALTER`, como `agregarColumnaSiFalta` en `db.js`).
- Mostrar el `ALTER` al usuario antes de ejecutarlo; ejecutarlo solo con respaldo previo y autorizacion explicita.
- SQL siempre parametrizado (`?`); nunca concatenar datos del usuario en el SQL.

## Seguridad y privacidad

- Sin datos personales (cedula, direccion, email, telefono, tokens) en logs.
- **Nunca exponer `costo` en endpoints publicos.** El listado publico enumera columnas una por una (`COLUMNAS_PUBLICAS` en `products.service.js`, nunca `p.*`); el costo solo sale por rutas admin protegidas por JWT.
- El token vive solo en cookie httpOnly; no guardarlo en `localStorage`.
