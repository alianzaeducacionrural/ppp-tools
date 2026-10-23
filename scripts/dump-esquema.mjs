// Exporta el esquema de Supabase al repo para versionarlo:
//   supabase/esquema.sql  → tablas, restricciones, funciones, triggers y políticas RLS de `public`
//   supabase/storage.sql  → buckets y políticas de Storage
// Uso: npm run db:dump   (necesita SUPABASE_DB_URL en .env y pg_dump/psql en el PATH)
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

try { process.loadEnvFile() } catch { /* sin .env: se usa el entorno */ }

const url = process.env.SUPABASE_DB_URL
if (!url) {
  console.error('Falta SUPABASE_DB_URL en .env (Supabase → Connect → Session pooler).')
  process.exit(1)
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' })
  if (r.error || r.status !== 0) {
    console.error(`${cmd} falló:`, r.error?.message || r.stderr)
    process.exit(1)
  }
  return r.stdout
}

mkdirSync('supabase', { recursive: true })

run('pg_dump', [url, '--schema-only', '--schema=public', '--no-owner', '--no-privileges', '--file=supabase/esquema.sql'])
// pg_dump 18 añade \restrict/\unrestrict, que el SQL Editor de Supabase no entiende
const esquema = readFileSync('supabase/esquema.sql', 'utf8').split('\n').filter(l => !/^\\(un)?restrict /.test(l)).join('\n')
writeFileSync('supabase/esquema.sql', esquema)

// Storage es un esquema gestionado por Supabase: solo se exportan los buckets y sus políticas
const consultaStorage = `
select string_agg(sql, E'\\n' order by orden, nombre) from (
  select 0 as orden, id as nombre,
         format('insert into storage.buckets (id, name, public) values (%L, %L, %s) on conflict (id) do nothing;', id, name, public) as sql
  from storage.buckets
  union all
  select 1, policyname,
         format('create policy %I on storage.objects as %s for %s to %s%s%s;',
                policyname, permissive, cmd, array_to_string(roles, ', '),
                coalesce(' using (' || qual || ')', ''),
                coalesce(' with check (' || with_check || ')', ''))
  from pg_policies where schemaname = 'storage' and tablename = 'objects'
) t;`
const storage = run('psql', [url, '-At', '-v', 'ON_ERROR_STOP=1', '-c', consultaStorage])
writeFileSync('supabase/storage.sql', `-- Buckets y políticas de Storage (generado por npm run db:dump)\n${storage}`)

console.log('Listo: supabase/esquema.sql y supabase/storage.sql')
