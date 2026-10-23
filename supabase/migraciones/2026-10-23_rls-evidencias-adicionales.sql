-- Las evidencias adicionales (es_adicional = true) solo las pueden leer:
--   · el estudiante dueño, · el docente de su institución,
--   · los padrinos asignados a esa institución (habilitaciones_institucion), · el admin.
-- Ejecutar en Supabase → SQL Editor, después de 2026-10-23_habilitar-instituciones.sql.
--
-- Se usan políticas RESTRICTIVE: se suman (AND) a las que ya existen, así que no hace falta
-- conocer ni tocar las políticas actuales de `evidencias`. Las evidencias normales no cambian.
-- Si cambias el correo del admin, cámbialo también aquí y en habilitaciones_institucion.

create or replace function public.puede_ver_adicional(ev public.evidencias)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('admin@ppp.com')
    or exists (
      select 1 from estudiantes e
      where e.id = ev.estudiante_id and e.user_id = auth.uid())
    or exists (
      select 1 from estudiantes e
      join docentes d on d.institucion_id = e.institucion_id
      where e.id = ev.estudiante_id and d.user_id = auth.uid())
    or exists (
      select 1 from estudiantes e
      join habilitaciones_institucion h on h.institucion_id = e.institucion_id
      where e.id = ev.estudiante_id and h.padrino_user_id = auth.uid());
$$;

drop policy if exists "evidencias_adicionales_select" on public.evidencias;
create policy "evidencias_adicionales_select" on public.evidencias
  as restrictive for select to authenticated
  using (not es_adicional or public.puede_ver_adicional(evidencias));

-- Los archivos (fotos/enlaces) de una evidencia siguen la visibilidad de la evidencia:
-- el subselect ya pasa por la política de arriba.
drop policy if exists "evidencias_archivos_adicionales_select" on public.evidencias_archivos;
create policy "evidencias_archivos_adicionales_select" on public.evidencias_archivos
  as restrictive for select to authenticated
  using (exists (select 1 from public.evidencias ev where ev.id = evidencias_archivos.evidencia_id));
