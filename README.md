# Caja de Ahorro — sitio público

Sitio estático de **Caja de Ahorro** (app de ahorro grupal privado): landing, aviso de
privacidad, términos, soporte y borrado de cuenta. Se sirve en **GitHub Pages**.

## Páginas

| Archivo | Para qué |
|---|---|
| `index.html` | Landing. |
| `privacidad.html` | Aviso de privacidad (LFPDPPP). URL para Google Play / App Store. |
| `terminos.html` | Términos y condiciones. |
| `soporte.html` | Contacto + FAQ. URL de soporte para App Store. |
| `eliminar-cuenta.html` | Guía + flujo web de borrado de cuenta. URL de eliminación de datos para Google Play. |
| `config.js` | Config pública de Supabase (URL + anon key). |
| `assets/styles.css` | Estilos (marca teal reusada del app). |

Todo es **HTML/CSS/JS plano** — sin build, sin dependencias. Los links son relativos
para funcionar bajo el subpath de Pages (`/savings-club-web/`).

## Borrado de cuenta (cómo funciona)

`eliminar-cuenta.html` usa `@supabase/supabase-js` **vendorizado localmente**
(`assets/supabase-js-2.110.8.min.js`, versión fija — no CDN, no cadena de suministro
externa en la página que maneja la sesión). La lógica vive en `assets/eliminar-cuenta.js`
(script externo, sin JS inline, para poder aplicar `script-src 'self'`):

1. **Correo** → `signInWithOtp({ email, options: { shouldCreateUser: false } })`.
2. **Código OTP** (6 dígitos) → `verifyOtp({ email, token, type: 'email' })` → sesión.
3. **Confirmar** → `rpc('eliminar_mi_cuenta')` (RPC ya existente en Supabase: anonimiza
   el perfil, borra el login y bloquea con `PX020` si el usuario administra cajas activas
   con otros miembros o debe devoluciones).
4. `signOut()` → pantalla de éxito.

No hay backend nuevo: reusa el mismo RPC que el borrado dentro de la app.

> La **anon/publishable key** de `config.js` es pública por diseño; no es secreto. Las
> políticas RLS de la base de datos son las que protegen los datos.

## Seguridad (sitio estático)

Al ser un sitio estático en un repo **público**, todo el código es visible por diseño:
no hay secretos que ocultar. El endurecimiento aplicado va contra otras superficies:

- **Sin CDN de terceros**: `supabase-js` está vendorizado con versión fija. Antes se
  cargaba `@2` (tag flotante, sin SRI) desde jsdelivr en la misma página que tiene la
  sesión autenticada y dispara el borrado → riesgo de cadena de suministro. Eliminado.
- **CSP por `<meta http-equiv>`** en las 7 páginas (GitHub Pages no permite headers HTTP
  propios). Páginas estáticas: `script-src 'none'`. Página de borrado: `script-src 'self'`
  + `connect-src` acotado a la URL de Supabase. Base común: `default-src 'none'`,
  `img-src 'self' data:`, `base-uri 'none'`, `form-action 'none'`.
- **Sin JS inline**: la lógica de borrado se movió a `assets/eliminar-cuenta.js` para
  poder usar `script-src 'self'` (una CSP con inline exigiría `'unsafe-inline'`).
- **Pendiente (manual, en Settings → Pages)**: activar **Enforce HTTPS**.
- **No aplicable vía `<meta>`**: `frame-ancestors` (anti-clickjacking) — no se puede
  poner en meta CSP y Pages no manda `X-Frame-Options`. Se aceptó el riesgo: el borrado
  ya está protegido por el OTP, así que un iframe no aporta nada al atacante.

## Publicar en GitHub Pages

1. Repo **público**.
2. Settings → Pages → **Source: Deploy from a branch** → branch `main`, carpeta `/ (root)`.
3. URL: `https://<usuario>.github.io/savings-club-web/`.

`.nojekyll` evita el pipeline Jekyll y sirve el HTML tal cual.

## Antes de publicar (pendientes)

- [ ] Reemplazar el correo de soporte `savingsclubapp+support@gmail.com` por el real
      (find/replace en los `.html` y en `config.js` → `SUPPORT_EMAIL`).
- [ ] Cambiar los badges «Próximamente» de la landing por los links reales de las tiendas.
- [ ] (Opcional) Agregar capturas de la app en `assets/` y en la landing.
- [ ] (Recomendado) Revisar `privacidad.html` y `terminos.html` con un abogado si la
      App comienza a operar comercialmente o manejará un volumen significativo de usuarios.

Los documentos legales ya no son borrador: identifican al responsable (Saúl García),
incluyen consentimiento, procedimiento ARCO, licencia, propiedad intelectual, legislación
mexicana y declaran los servicios reales (Supabase, FCM, Google/Apple — sin analytics).
Al ajustar el Aviso, verifica que **Google Play Data Safety** y las **Privacy Nutrition
Labels** de App Store coincidan exactamente con lo declarado.

## Probar local

```
python3 -m http.server 8000
# abrir http://localhost:8000
```
