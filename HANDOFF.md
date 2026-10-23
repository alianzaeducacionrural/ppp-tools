# HANDOFF · ppp-tools

> Si eres un chat nuevo: lee este archivo completo y luego los demás .md del proyecto antes de seguir.

<!-- handoff:auto:start -->
## Estado (automático, 2026-10-23T13:41:58.523Z)

- Carpeta del proyecto: C:\Users\alejo\Documents\Comité de Cafeteros\2026\Plataformas\PPP\ppp-tools
- Contexto de la sesión: 16% (155576 de 1000000 tokens)
- Costo de la sesión: $1.38
- Git (solo esta carpeta): 13 archivos sin commit · 0 commits por subir · 0 commits de otras carpetas
- Servidores locales: ninguno

## Plan por fases

### Fase 1 · Base de datos (100%)
- [x] Escribir el SQL (tabla, columnas y permisos)

### Fase 2 · Panel del admin (100%)
- [x] Gestor de instituciones habilitadas
- [x] Agregar la pestaña al panel admin

### Fase 3 · Envío del estudiante (100%)
- [x] Quitar el bloqueo y el modal para instituciones habilitadas
- [x] Guardar los envíos como adicionales

### Fase 4 · Revisión del padrino (100%)
- [x] Mostrar solo adicionales de sus instituciones y calificar sin sumar puntos
- [x] Probar con el build


## Ideas para el programa

_Sin ideas registradas._

## Tareas del usuario

- [ ] Ejecutar sql/habilitar-instituciones.sql en Supabase (con los correos admin reales) ANTES de desplegar
- [ ] Probar con una institución real: habilitar, enviar como estudiante, calificar como padrino
- [ ] Revisar en Supabase las políticas (RLS) de evidencias para que las adicionales no las lean otros

## Agentes

_Ninguno._

## Enlaces

- Repositorio: https://github.com/alianzaeducacionrural/ppp-tools
- GitHub Pages: https://alianzaeducacionrural.github.io/ppp-tools/
- Vercel: https://caldasflorece.vercel.app
- Proyecto en Vercel (dashboard, proyecto `proyectospedagogicos`; la URL se armó con los nombres del equipo y no se abrió): https://vercel.com/alianzaeducacionrurals-projects/proyectospedagogicos
- Supabase del proyecto (ref en `.env`, no visible desde las cuentas conectadas): https://supabase.com/dashboard/project/aldveebcutmeepqwiseg
<!-- handoff:auto:end -->

## Resumen y decisiones

**Qué es el proyecto:** plataforma gamificada de Proyectos Pedagógicos Productivos (Comité de Cafeteros, 2026). Estudiantes suben evidencias de retos (líneas `cafe` y `alimentacion`), ganan puntos/rangos/insignias; padrinos califican, docentes ven a su institución, admin gestiona. React 19 + Vite + Tailwind + Supabase (acceso directo desde el cliente) + funciones serverless en `/api` (Vercel). Roles: admin (por email en `VITE_ADMIN_EMAILS`), padrino, docente, estudiante. Contexto completo del código: [README.md](README.md).

**Estado previo:** el plazo del concurso está cerrado (`PLAZO_EVIDENCIAS_CERRADO = true` en `src/components/comunes/PlazoCerradoModal.jsx`): estudiantes y docentes ven un modal y no pueden enviar.

**Lo que se hizo en esta conversación: "envío extra" por institución**
Una institución educativa necesita seguir enviando evidencias porque su docente las une a las notas de su materia. Decisiones:
- **Admin habilita instituciones y asigna padrinos** (pestaña "Envío extra", `InstitucionesHabilitadasManager.jsx`). Una institución está habilitada si tiene ≥1 fila en `habilitaciones_institucion` (una fila por padrino, `padrino_user_id` = `padrinos.user_id`). Se eligió asignar por institución, no por estudiante, para no hacer trabajo manual.
- **Los estudiantes continúan los mismos retos que les faltan** (no hay tareas nuevas). Hook `usePlazoEvidencias` (`src/hooks/`) decide `cerrado` / `adicional`; mientras carga, no muestra el modal.
- **No suman puntos:** las adicionales se marcan `evidencias.es_adicional = true` y la nota va en `evidencias.nota_adicional`, dejando `puntuacion` en null. Motivo: `puntuacion` se suma en ~10 sitios (puntos, ranking vía `puntuacion_total`, docente, padrino); una columna aparte evita tocarlos todos. Además se añadió `.eq('es_adicional', false)` a los conteos de: dashboard y perfil del estudiante, estadísticas del padrino, detalle de estudiante (padrino), dashboard admin (totales y actividad) y reportes.
- **Padrino:** filtro "Tipo → Adicionales" solo si tiene instituciones asignadas; califica con el mismo formulario (escribe `nota_adicional`). La lista normal y las estadísticas excluyen adicionales.
- El docente y el estudiante no tienen pantallas nuevas (decisión del usuario), salvo un aviso en el formulario: "El concurso ya cerró… no suma puntos".
- Se mantuvo `HashRouter` y el patrón existente de consultas directas a Supabase.

**Trampas encontradas**
- El proyecto Supabase de este repo (`aldveebcutmeepqwiseg`) **no aparece en las cuentas conectadas**: no pude ver el esquema ni aplicar SQL. El modelo de datos está inferido del código y no hay migraciones ni RLS versionadas.
- La tabla `evidencias` tiene restricción única (estudiante, reto): un estudiante tiene una sola fila por reto. Por eso las adicionales reutilizan la misma tabla en vez de una paralela. El formulario solo se muestra si no hay evidencia o está rechazada, así que una rechazada reenviada pasa a adicional (no tenía puntos).
- Desplegar el código **sin ejecutar antes el SQL** rompe consultas (filtran por `es_adicional`).
- La privacidad de las adicionales (que solo las vea el padrino asignado, el estudiante y su docente) hoy se hace en el cliente; **no hay RLS que la garantice**.
- `npm run dev` replica solo `crear-padrino` y `eliminar-usuario`; `resetear-password` no funciona en local (el plugin de `vite.config.js` no lo incluye).
- La contraseña por defecto del reset (`12345678`) está duplicada en `api/resetear-password.js` y `src/lib/resetearPassword.js`.
- No se sabe si un trigger de la base de datos desbloquea niveles/insignias al aprobar una evidencia; una adicional aprobada podría activarlo.
- El vistazo de "Enlaces" depende de las URLs de abajo; el proyecto de Vercel tiene SSO activo salvo en dominios propios, por eso se usa `caldasflorece.vercel.app`.

## Cómo continuar

Estado: el código del envío extra está escrito y `npm run build` pasa (el único aviso de lint es antiguo, en `DashboardPadrino.jsx`). **No hay commit** (13 archivos sin commit) y **nada se ha probado contra Supabase**.

Pasos, en orden:
1. En Supabase → SQL Editor, ejecutar `sql/habilitar-instituciones.sql` **cambiando antes** los dos correos de ejemplo por los de `VITE_ADMIN_EMAILS` (política de escritura de `habilitaciones_institucion`).
2. Hacer commit y desplegar (Vercel, rama conectada).
3. Probar de punta a punta con la institución real: admin habilita y asigna padrino → estudiante envía un reto pendiente → padrino lo ve en Tipo "Adicionales" y lo califica → verificar que `puntuacion_total`, ranking y conteos no cambian → verificar que un estudiante de otra institución sigue viendo el modal de plazo cerrado.
4. Revisar/ajustar las políticas RLS de `evidencias` para que las adicionales solo las lean el estudiante, su docente y los padrinos asignados (necesita ver las políticas actuales).
5. Confirmar con el equipo la escala de la nota (se usó 0–100, igual que la puntuación) y si el estudiante debe ver su nota (hoy no se muestra para adicionales).
6. Decidir si el docente necesita ver las notas adicionales (no se tocó su vista; podría ya ver las evidencias sin filtro).
7. Comprobar si existe algún trigger que otorgue insignias/niveles al aprobar y excluir las adicionales si es así.

Para reabrir el concurso para todos: `PLAZO_EVIDENCIAS_CERRADO = false` y redesplegar.
