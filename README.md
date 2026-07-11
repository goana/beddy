# beddy 💠

Diseñador de patrones para pulseras de cuentas **Miyuki Delica** (telar y peyote).

**App en vivo:** https://goana.github.io/beddy/

## Qué hace

- **Diseña patrones** en telar o peyote, con cuentas renderizadas de forma realista.
- **Colores Miyuki Delica reales** (códigos DB) con buscador y lista de materiales.
- **Imagen → patrón**: sube una foto y se convierte al color Delica más cercano, con
  realce automático (ilumina fotos oscuras), simplificación a N colores y modo
  **ilustración** (aplana + añade contornos).
- **Crear**: motivos dibujados a mano (gato siamés, corazón, rombo, estrella, mariposa).
- **Herramientas**: pincel, borrador, rellenar, cuentagotas, deshacer/rehacer, zoom.
- **Guardar** patrones en el navegador y **exportar** PNG, lista de materiales (CSV) y proyecto (.json).
- **Tema claro/oscuro** y diseño adaptado a **móvil**.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Despliegue

Cada push a `main` publica automáticamente en GitHub Pages (workflow en
`.github/workflows/deploy.yml`).

Hecho con React + Vite + TypeScript.
