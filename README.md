# PPP Tools

Plataforma gamificada de Proyectos Pedagógicos Productivos (Comité de Cafeteros, 2026). Estudiantes suben evidencias de retos y ganan puntos, rangos e insignias; padrinos, docentes y administradores hacen el seguimiento.

**Plataforma en producción:** https://caldasflorece.vercel.app · [Proyecto en Vercel](https://vercel.com/alianzaeducacionrurals-projects/proyectospedagogicos)

> Documentación completa para continuar el trabajo: **[HANDOFF.md](HANDOFF.md)**

## Inicio rápido

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/
npm run lint
```

Crea un `.env` en la raíz (no se versiona):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAILS=correo1@ejemplo.com,correo2@ejemplo.com
SUPABASE_SERVICE_ROLE_KEY=
```

Las mismas variables deben estar en Vercel (Project Settings → Environment Variables).

## Mapa del código

| Qué | Dónde |
|---|---|
| Rutas y roles | [src/App.jsx](src/App.jsx), [src/context/AuthContext.jsx](src/context/AuthContext.jsx) |
| Cliente Supabase | [src/lib/supabase.js](src/lib/supabase.js) |
| Estudiante | [src/components/estudiante/](src/components/estudiante/) |
| Padrino | [src/components/padrino/](src/components/padrino/) |
| Docente | [src/components/docente/](src/components/docente/) |
| Admin | [src/components/admin/](src/components/admin/) |
| Componentes comunes | [src/components/comunes/](src/components/comunes/) |
| Rangos y avatares | [src/data/rangos.js](src/data/rangos.js), [src/data/avatares.js](src/data/avatares.js) |
| Plazo de evidencias (abrir/cerrar) | [src/components/comunes/PlazoCerradoModal.jsx](src/components/comunes/PlazoCerradoModal.jsx) |

## Envío de evidencias tras el cierre

Con `PLAZO_EVIDENCIAS_CERRADO = true`, el admin puede habilitar instituciones concretas desde la pestaña **Envío extra** ([InstitucionesHabilitadasManager.jsx](src/components/admin/InstitucionesHabilitadasManager.jsx)) y asignarles uno o más padrinos. Sus estudiantes siguen enviando evidencias que **no suman puntos** (se marcan `es_adicional` y la nota va en `nota_adicional`). El padrino las ve en el filtro "Tipo → Adicionales". La lógica de plazo está en [usePlazoEvidencias.js](src/hooks/usePlazoEvidencias.js). Requiere ejecutar antes [sql/habilitar-instituciones.sql](sql/habilitar-instituciones.sql) en Supabase.

## API serverless (Vercel)

- [api/crear-padrino.js](api/crear-padrino.js)
- [api/eliminar-usuario.js](api/eliminar-usuario.js)
- [api/resetear-password.js](api/resetear-password.js)

En desarrollo, [vite.config.js](vite.config.js) replica solo las dos primeras. Configuración de despliegue: [vercel.json](vercel.json).

## Enlaces útiles

- Supabase: [Dashboard](https://supabase.com/dashboard) · [Docs](https://supabase.com/docs) · [Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api) · [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Storage](https://supabase.com/docs/guides/storage)
- Vercel: [Dashboard](https://vercel.com/dashboard) · [Docs](https://vercel.com/docs) · [Variables de entorno](https://vercel.com/docs/environment-variables) · [Funciones](https://vercel.com/docs/functions)
- Librerías: [React](https://react.dev) · [Vite](https://vite.dev) · [Tailwind CSS 3](https://v3.tailwindcss.com/docs) · [React Router](https://reactrouter.com) · [react-hot-toast](https://react-hot-toast.com) · [lucide-react](https://lucide.dev) · [SheetJS (xlsx)](https://docs.sheetjs.com)
