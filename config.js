// Configuración pública de Supabase.
// La anon/publishable key es pública por diseño: NO es un secreto — las políticas
// RLS de la base de datos son las que protegen los datos. Es seguro versionarla
// y servirla en un sitio público.
window.SAVINGS_CLUB_CONFIG = {
  SUPABASE_URL: 'https://txvawdwnfynohtgcveda.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_6Rn-9nQQCOfRubxIGGwhlQ_h4IuQY08',
  // Correo de soporte / privacidad. TODO: reemplazar antes de publicar.
  SUPPORT_EMAIL: 'soporte@cajadeahorro.app',
};
