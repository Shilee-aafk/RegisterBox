-- =====================================================
-- PASO 1: Crear tabla de empresas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  plan TEXT DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PASO 2: Añadir empresa_id a todas las tablas
-- Ejecuta cada ALTER TABLE por separado si hay errores
-- =====================================================
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.citas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.horarios_empleados ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.asistencias_empleados ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- =====================================================
-- PASO 3: Crear tabla que conecta usuarios Auth con empresas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.perfiles_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'owner', -- 'owner', 'admin', 'staff'
  UNIQUE(user_id, empresa_id)
);

-- =====================================================
-- PASO 4: Función que devuelve el empresa_id del usuario autenticado
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT empresa_id FROM public.perfiles_empresa
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- PASO 5: Activar RLS en todas las tablas
-- =====================================================
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_empresa ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 6: Crear políticas RLS (Solo ver/editar datos propios)
-- =====================================================

-- Productos
CREATE POLICY "empresas_ven_sus_productos" ON public.productos
  FOR ALL USING (empresa_id = get_empresa_id());

-- Categorias
CREATE POLICY "empresas_ven_sus_categorias" ON public.categorias
  FOR ALL USING (empresa_id = get_empresa_id());

-- Clientes
CREATE POLICY "empresas_ven_sus_clientes" ON public.clientes
  FOR ALL USING (empresa_id = get_empresa_id());

-- Empleados
CREATE POLICY "empresas_ven_sus_empleados" ON public.empleados
  FOR ALL USING (empresa_id = get_empresa_id());

-- Citas
CREATE POLICY "empresas_ven_sus_citas" ON public.citas
  FOR ALL USING (empresa_id = get_empresa_id());

-- Transacciones
CREATE POLICY "empresas_ven_sus_transacciones" ON public.transacciones
  FOR ALL USING (empresa_id = get_empresa_id());

-- Audit Logs
CREATE POLICY "empresas_ven_sus_logs" ON public.audit_logs
  FOR ALL USING (empresa_id = get_empresa_id());

-- Horarios
CREATE POLICY "empresas_ven_sus_horarios" ON public.horarios_empleados
  FOR ALL USING (empresa_id = get_empresa_id());

-- Asistencias
CREATE POLICY "empresas_ven_sus_asistencias" ON public.asistencias_empleados
  FOR ALL USING (empresa_id = get_empresa_id());

-- Empresa (solo ver la suya propia)
CREATE POLICY "usuario_ve_su_empresa" ON public.empresas
  FOR SELECT USING (id = get_empresa_id());

-- Perfil empresa (solo ver el suyo)
CREATE POLICY "usuario_ve_su_perfil" ON public.perfiles_empresa
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- PASO 7: Crear tu primera empresa de prueba
-- Ejecuta esto y guarda el ID que devuelve
-- =====================================================
INSERT INTO public.empresas (nombre, plan) 
VALUES ('Mi Negocio Principal', 'pro')
RETURNING id;

-- =====================================================
-- PASO 8: Registra el primer usuario dueño
-- Primero ve a Supabase > Authentication > Users > "Add User"
-- y crea un usuario con email y contraseña.
-- Luego toma el ID de ese usuario y úsalo abajo:
-- =====================================================
-- INSERT INTO public.perfiles_empresa (user_id, empresa_id, role)
-- VALUES ('PEGA_AQUI_EL_USER_ID', 'PEGA_AQUI_EL_EMPRESA_ID', 'owner');

-- =====================================================
-- PASO 9 (IMPORTANTE): Trigger automático de registro
-- Esto se ejecuta UNA SOLA VEZ y luego funciona solo
-- para TODOS los nuevos negocios que se registren.
-- =====================================================

-- Función que se ejecuta cuando un nuevo usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_company_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_empresa_id UUID;
  nombre_empresa TEXT;
BEGIN
  -- Leer el nombre de la empresa desde los metadatos del usuario
  nombre_empresa := COALESCE(
    NEW.raw_user_meta_data->>'nombre_empresa', 
    'Mi Negocio'
  );
  
  -- 1. Crear la empresa automáticamente
  INSERT INTO public.empresas (nombre, plan)
  VALUES (nombre_empresa, 'basic')
  RETURNING id INTO new_empresa_id;
  
  -- 2. Vincular el usuario con la empresa como 'owner'
  INSERT INTO public.perfiles_empresa (user_id, empresa_id, role)
  VALUES (NEW.id, new_empresa_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Conectar la función al evento de registro de usuario
CREATE OR REPLACE TRIGGER on_company_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company_signup();

