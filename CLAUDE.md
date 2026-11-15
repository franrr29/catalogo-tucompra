# TuCompra

Tienda online (catalogo, carrito, checkout con MercadoPago) con panel de administracion (productos, ventas, envios, reportes de rentabilidad).

## ADVERTENCIA: el entorno local apunta a la base de PRODUCCION

`backend/.env` (`DATABASE_URL`) apunta a la base real en Aiven. No hay base de desarrollo.

- **Nunca ejecutes nada que escriba en la base, ni migraciones, sin autorizacion explicita del usuario.**
- **No levantes el backend (`npm start`) sin autorizacion.** Al arrancar, `backend/src/app.js` llama a `asegurarEsquema()` (`backend/src/config/db.js`), que ejecuta `ALTER TABLE` contra la base configurada. Arrancar el servidor = tocar produccion.
- No corras scripts ni consultas ad hoc contra la base. Los tests no deben conectarse (ver Tests).
- `frontend/src/config.js` puede estar apuntando a `localhost:4000` o a Render; es un cambio local, no se commitea.

## Stack

- **Backend** (`backend/`, desplegado en Render): Node + Express 5, MySQL en Aiven (`mysql2/promise`, pool en `src/config/db.js`), JWT en cookie httpOnly (`cookie-parser`, `jsonwebtoken`, `helmet`), Cloudinary + multer para imagenes, MercadoPago (`mercadopago`) con webhook.
- **Frontend** (`frontend/`, dominio tucmpra.store): React 18 con Create React App (`react-scripts`) + Tailwind. **No usar MUI**: `@mui/material` y `@emotion/*` figuran en `frontend/package.json` pero no se importan en `src/`; no agregar usos nuevos.
- Carrito en `localStorage` (clave `productos`, ver `frontend/src/modules/cart/useCarrito.js`).
- Idioma del codigo y comentarios: espanol.

## Estructura

- `backend/src/`: `modules/` (auth, cart, imagenes, products), `pedidos/`, `reportes/`, `webhook/`, `middleware/`, `config/`, `utils/`.
- `frontend/src/`: `modules/` (admin, cart, pagos, products), `services/`, `shared/`.
- `backend/baseDatos.sql`: esquema base de referencia.
- El `package.json`/`package-lock.json` de la raiz es un duplicado desactualizado del de `backend/`; los reales son `backend/package.json` y `frontend/package.json`.

## Comandos

- Backend (`cd backend`): `npm start` (**ver advertencia**), `npm test` (jest + supertest).
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
