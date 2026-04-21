import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase: faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
