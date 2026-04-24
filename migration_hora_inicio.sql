-- =============================================
-- MIGRACIÓN: Agregar hora_inicio a horarios_empleados
-- =============================================
-- Ejecuta este script en el editor SQL de Supabase.

-- 1. Agregar columna hora_inicio (TEXT, valor por defecto '08:00')
ALTER TABLE horarios_empleados 
ADD COLUMN IF NOT EXISTS hora_inicio TEXT NOT NULL DEFAULT '08:00';

-- 2. Eliminar el constraint UNIQUE anterior (si existe)
-- Nota: El nombre del constraint puede variar. Intenta estos:
ALTER TABLE horarios_empleados DROP CONSTRAINT IF EXISTS horarios_empleados_empleado_id_dia_semana_key;
ALTER TABLE horarios_empleados DROP CONSTRAINT IF EXISTS unique_empleado_dia;

-- 3. Crear nuevo constraint UNIQUE que incluye hora_inicio
ALTER TABLE horarios_empleados 
ADD CONSTRAINT unique_empleado_dia_hora UNIQUE (empleado_id, dia_semana, hora_inicio);

-- 4. (Opcional) Verificar la estructura final
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'horarios_empleados';
