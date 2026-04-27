-- =====================================================
-- MIGRACIÓN: Cambiar empleado_id de BIGINT a UUID
-- en horarios_empleados para compatibilidad con IDs
-- generados localmente (offline-first).
-- =====================================================

-- 1. Eliminar constraints que usen empleado_id
ALTER TABLE public.horarios_empleados DROP CONSTRAINT IF EXISTS horarios_empleados_empleado_id_fkey;
ALTER TABLE public.horarios_empleados DROP CONSTRAINT IF EXISTS horarios_empleados_empleado_id_dia_semana_key;

-- 2. Cambiar el tipo de columna a UUID
ALTER TABLE public.horarios_empleados 
  ALTER COLUMN empleado_id TYPE UUID USING empleado_id::text::uuid;

-- 3. Recrear la constraint FK (sin tipo, ya que ahora ambos son UUID)
-- NOTA: Solo ejecuta esta línea si empleados.id ya es UUID.
-- Si empleados.id sigue siendo BIGINT, omite esta línea.
-- ALTER TABLE public.horarios_empleados 
--   ADD CONSTRAINT horarios_empleados_empleado_id_fkey 
--   FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;
