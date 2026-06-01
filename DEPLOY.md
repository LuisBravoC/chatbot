# Guía de Despliegue en GitHub Pages

## Configuración inicial

El proyecto está configurado para desplegarse automáticamente en GitHub Pages usando GitHub Actions.

### Requisitos
- Repositorio en GitHub: `LuisBravoC/chatbot`
- Rama principal: `main`
- Node.js 18+ instalado localmente

## Despliegue automático

Cada vez que hagas push a la rama `main`, GitHub Actions ejecutará automáticamente:

1. **Build**: Compila el proyecto con `npm run build`
2. **Deploy**: Publica el contenido de `dist/` en GitHub Pages

### URL de acceso
```
https://luisbravo.github.io/chatbot/
```

## Despliegue manual local (opcional)

Si deseas desplegar manualmente desde tu máquina:

### 1. Instalar dependencias
```bash
npm install
npm install -g gh-pages  # O incluir en devDependencies
```

### 2. Ejecutar el deploy
```bash
npm run deploy
```

Esto hará build y subirá la carpeta `dist/` a la rama `gh-pages`.

## Configuración de GitHub Pages

1. Ve a tu repositorio en GitHub
2. **Settings** → **Pages**
3. Bajo "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` / `(root)`
4. Guarda los cambios

## Archivos de configuración

### `vite.config.js`
- `base: '/chatbot/'` - Define la ruta base en GitHub Pages

### `.nojekyll`
- Archivo vacío que le indica a GitHub que no procese el sitio como Jekyll

### `.github/workflows/deploy.yml`
- Workflow que automatiza build y deploy en cada push a `main`

## Solución de problemas

- Si el sitio no aparece correctamente, verifica que la rama `gh-pages` existe en GitHub
- Revisa los logs del workflow en **Actions** si hay errores
- Limpia el cache del navegador (Ctrl+Shift+Delete)
- Espera 2-3 minutos después del push; GitHub tarda un poco en desplegar

## Cambios después del despliegue

Solo necesitas hacer push a `main` y el workflow hará el resto automáticamente.
