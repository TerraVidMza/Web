# Capturas del manual de usuario

El manual de cada rol está en `src/features/ayuda/manual/contenido/*.md` y sus capturas en `src/features/ayuda/manual/img/` (W-034). Este directorio tiene lo necesario para regenerar las capturas cuando cambia una pantalla.

Las capturas salen del sistema real con datos de demostración, sobre una **base aislada**: nunca contra producción ni contra la base de desarrollo.

## 1. Base aislada y API

```bash
# Base nueva en otro puerto, para no tocar la de desarrollo
docker run -d --name terravid-manual-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=terravid_manual -p 127.0.0.1:5433:5432 postgis/postgis:16-3.4

# En Backend/
export DB_PORT=5433 DB_DATABASE=terravid_manual DB_PASSWORD=postgres
npm run build && npm run migration:run && npm run seed
CORS_ORIGIN="http://localhost:5173,http://localhost:8081" node dist/main.js
```

## 2. Datos de demostración

```bash
# En Web/, con la API corriendo
node scripts/manual/datos-demo.mjs
```

Crea los usuarios de los cinco roles (contraseña `Terravid123!`), dos fincas, cuatro cuarteles, labores de dos campañas, pesajes, remitos en cada estado, sensores con 40 días de lecturas y alertas, un pedido de ayuda y una segunda empresa. Algunas filas se ajustan por SQL dentro del contenedor, por ejemplo las vigencias de costos con fecha pasada, que la API no permite. Por eso el script se corre una sola vez sobre una base recién creada.

## 3. Capturas

```bash
# En Web/, con la Web apuntando a la API local
VITE_API_URL=http://localhost:3000/api npx vite --port 5173

node scripts/manual/capturas-manual.mjs                       # todas
node scripts/manual/capturas-manual.mjs agronomo              # un rol
node scripts/manual/capturas-manual.mjs propietario costeo    # las que contienen «costeo»
```

Se guardan como `<rol>-<pantalla>.jpg`. Las de la app móvil (`movil-*.jpg`) se generan en Mobile (`scripts/manual/`) y se copian acá para el manual del Capataz.

## 4. Si cambia el manual de la app

Las secciones «App móvil: …» del manual del Capataz son copia de `Mobile/src/manual/contenido.ts`. Si cambian allá, hay que actualizarlas acá: el resto del manual del Capataz es propio de la Web.
