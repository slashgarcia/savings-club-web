(function () {
  const cfg = window.SAVINGS_CLUB_CONFIG || {};
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  let email = '';

  const $ = (id) => document.getElementById(id);
  const steps = {
    email: $('step-email'),
    code: $('step-code'),
    confirm: $('step-confirm'),
    done: $('step-done'),
  };

  function show(step) {
    Object.values(steps).forEach((el) => el.classList.remove('active'));
    steps[step].classList.add('active');
  }

  function setStatus(id, kind, msg) {
    const el = $(id);
    el.className = 'status show status--' + kind;
    el.textContent = msg;
  }
  function clearStatus(id) {
    const el = $(id);
    el.className = 'status';
    el.textContent = '';
  }

  function busy(btn, on, labelBusy) {
    if (on) {
      btn.dataset.label = btn.textContent;
      btn.textContent = labelBusy;
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.label || btn.textContent;
      btn.disabled = false;
    }
  }

  // Paso 1 → enviar OTP
  $('btn-send').addEventListener('click', async () => {
    clearStatus('status-email');
    const value = $('email').value.trim().toLowerCase();
    if (!value || !value.includes('@')) {
      setStatus('status-email', 'error', 'Escribe un correo válido.');
      return;
    }
    email = value;
    const btn = $('btn-send');
    busy(btn, true, 'Enviando…');
    // shouldCreateUser:false → no creamos cuentas fantasma. No revelamos si el
    // correo existe (anti-enumeración): avanzamos igual con un mensaje genérico.
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    busy(btn, false);
    if (error && (error.status === 429 || /rate/i.test(error.message || ''))) {
      setStatus('status-email', 'error', 'Demasiados intentos. Espera un momento y vuelve a intentar.');
      return;
    }
    // Cualquier otro caso (incluye correo inexistente): mensaje genérico.
    show('code');
    setStatus('status-code', 'info', 'Si ese correo tiene una cuenta, te enviamos un código de 6 dígitos. Revisa tu bandeja y spam.');
  });

  // Paso 2 → verificar OTP
  $('btn-verify').addEventListener('click', async () => {
    clearStatus('status-code');
    const token = $('code').value.trim();
    if (!/^\d{6}$/.test(token)) {
      setStatus('status-code', 'error', 'El código son 6 dígitos.');
      return;
    }
    const btn = $('btn-verify');
    busy(btn, true, 'Verificando…');
    const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
    busy(btn, false);
    if (error || !data || !data.session) {
      setStatus('status-code', 'error', 'Código incorrecto o expirado. Solicita uno nuevo.');
      return;
    }
    $('confirm-email').textContent = email;
    show('confirm');
  });

  $('btn-back-email').addEventListener('click', () => {
    clearStatus('status-code');
    $('code').value = '';
    show('email');
  });

  // Habilitar borrado solo con el checkbox
  $('ack').addEventListener('change', (e) => {
    $('btn-delete').disabled = !e.target.checked;
  });

  // Paso 3 → eliminar
  $('btn-delete').addEventListener('click', async () => {
    clearStatus('status-confirm');
    const btn = $('btn-delete');
    busy(btn, true, 'Eliminando…');
    const { error } = await sb.rpc('eliminar_mi_cuenta');
    if (error) {
      busy(btn, false);
      if (error.code === 'PX020') {
        setStatus('status-confirm', 'error',
          'Antes de eliminar tu cuenta, completa o cancela las cajas que administras con otros miembros y entrega las devoluciones pendientes.');
      } else {
        setStatus('status-confirm', 'error', 'No pudimos eliminar tu cuenta. Intenta de nuevo.');
      }
      return;
    }
    // El login ya no existe; limpiamos la sesión local.
    try { await sb.auth.signOut(); } catch (_) {}
    show('done');
  });
})();
