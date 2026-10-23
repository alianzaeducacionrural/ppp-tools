-- Instituciones habilitadas para seguir enviando evidencias después del cierre.
-- Ejecutar UNA VEZ en Supabase → SQL Editor, ANTES de desplegar el código nuevo.
--
-- Correo admin: admin@ppp.com (agrega más a la lista si hay otros en VITE_ADMIN_EMAILS).

-- 1) Qué instituciones están habilitadas y qué padrinos las revisan (una fila por padrino).
create table if not exists habilitaciones_institucion (
  id bigint generated always as identity primary key,
  institucion_id bigint not null,
  padrino_user_id uuid not null,        -- = padrinos.user_id
  created_at timestamptz not null default now(),
  unique (institucion_id, padrino_user_id)
);

alter table habilitaciones_institucion enable row level security;

-- Cualquier usuario con sesión puede leerla (el estudiante necesita saber si su institución está habilitada).
drop policy if exists "habilitaciones_leer" on habilitaciones_institucion;
create policy "habilitaciones_leer" on habilitaciones_institucion
  for select to authenticated using (true);

-- Solo el admin escribe.
drop policy if exists "habilitaciones_admin" on habilitaciones_institucion;
create policy "habilitaciones_admin" on habilitaciones_institucion
  for all to authenticated
  using (lower(auth.jwt() ->> 'email') in ('admin@ppp.com'))
  with check (lower(auth.jwt() ->> 'email') in ('admin@ppp.com'));

-- 2) Marca de las evidencias enviadas después del cierre y su nota (separada de `puntuacion`,
--    que es la que suma en puntos y ranking; las adicionales dejan `puntuacion` en null).
alter table evidencias add column if not exists es_adicional boolean not null default false;
alter table evidencias add column if not exists nota_adicional integer;
