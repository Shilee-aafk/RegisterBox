-- =====================================================
-- PASO 1: Crear tabla de Locales (Sucursales)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PASO 2: Habilitar Seguridad (RLS) para Locales
-- =====================================================
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_ven_sus_locales" ON public.locales
  FOR ALL USING (empresa_id = public.get_empresa_id());

-- =====================================================
-- PASO 3: Añadir local_id a todas las tablas operativas
-- =====================================================
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.citas ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.horarios_empleados ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;
ALTER TABLE public.asistencias_empleados ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE;

-- =====================================================
-- PASO 4: MIGRACIÓN SEGURA (Sin pérdida de datos)
-- Crea un "Local Principal" para cada empresa existente
-- y mueve todos sus datos a ese local automáticamente.
-- =====================================================
DO $$ 
DECLARE
  emp RECORD;
  default_local UUID;
BEGIN
  FOR emp IN SELECT id FROM public.empresas LOOP
    -- Verificar si esta empresa ya tiene algún local creado
    IF NOT EXISTS (SELECT 1 FROM public.locales WHERE empresa_id = emp.id) THEN
      
      -- Crear un "Local Principal" por defecto
      INSERT INTO public.locales (empresa_id, nombre, direccion) 
      VALUES (emp.id, 'Local Principal', 'Dirección Principal') 
      RETURNING id INTO default_local;
      
      -- Mover todo el inventario, empleados, transacciones, etc a este nuevo local
      UPDATE public.productos SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.categorias SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.clientes SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.empleados SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.citas SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.transacciones SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.audit_logs SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.horarios_empleados SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      UPDATE public.asistencias_empleados SET local_id = default_local WHERE empresa_id = emp.id AND local_id IS NULL;
      
    END IF;
  END LOOP;
END $$;
