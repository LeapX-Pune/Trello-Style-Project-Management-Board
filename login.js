/**
 * ProjectFlow — login.js
 * Frontend-only validation, account creation (localStorage), and navigation.
 * No backend, no API, no sessions.
 */

(function () {
  'use strict';

  /* ── Storage key ───────────────────────────────────────────── */
  const USERS_KEY   = 'pf_users';
  const SESSION_KEY = 'pf_session';

  /* ── Load / save users from localStorage ──────────────────── */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  }

  /* ── Validation helpers ────────────────────────────────────── */
  function validateEmail(value) {
    if (!value.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
      return 'Please enter a valid email address.';
    return '';
  }

  function validatePassword(value) {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    return '';
  }

  function validateName(value) {
    if (!value.trim()) return 'Full name is required.';
    if (value.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  }

  /* ── Field state helpers ───────────────────────────────────── */
  function setFieldError(fieldEl, errorEl, message) {
    fieldEl.classList.remove('wl-field--valid');
    fieldEl.classList.add('wl-field--error');
    errorEl.textContent = message;
  }

  function setFieldValid(fieldEl, errorEl) {
    fieldEl.classList.remove('wl-field--error');
    fieldEl.classList.add('wl-field--valid');
    errorEl.textContent = '';
  }

  function clearField(fieldEl, errorEl) {
    fieldEl.classList.remove('wl-field--error', 'wl-field--valid');
    errorEl.textContent = '';
  }

  /* ── Password toggle factory ───────────────────────────────── */
  function setupPwToggle(toggleBtn, toggleIcon, inputEl) {
    toggleBtn.addEventListener('click', function () {
      const hidden = inputEl.type === 'password';
      inputEl.type = hidden ? 'text' : 'password';
      toggleIcon.className = hidden ? 'bi bi-eye-slash' : 'bi bi-eye';
      this.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
    });
  }

  /* ── Inline validation on blur / input ────────────────────── */
  function setupFieldValidation(inputEl, fieldEl, errorEl, validatorFn) {
    inputEl.addEventListener('blur', function () {
      const err = validatorFn(this.value);
      err ? setFieldError(fieldEl, errorEl, err) : setFieldValid(fieldEl, errorEl);
    });
    inputEl.addEventListener('input', function () {
      if (fieldEl.classList.contains('wl-field--error')) {
        if (!validatorFn(this.value)) setFieldValid(fieldEl, errorEl);
      }
    });
  }

  /* ── View switching ────────────────────────────────────────── */
  const loginForm       = document.getElementById('loginForm');
  const registerForm    = document.getElementById('registerForm');
  const signupRow       = loginForm.nextElementSibling;          // .wl-signup (Create one)
  const backToLoginWrap = document.getElementById('backToLoginWrap');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const showLoginBtn    = document.getElementById('showLoginBtn');
  const cardTitle       = document.querySelector('.wl-card-title');
  const cardSub         = document.querySelector('.wl-card-sub');

  function showRegister() {
    loginForm.classList.add('wl-form--hidden');
    signupRow.classList.add('wl-signup--hidden');
    registerForm.classList.remove('wl-form--hidden');
    backToLoginWrap.classList.remove('wl-signup--hidden');
    cardTitle.textContent = 'Create Account';
    cardSub.textContent = 'Join your team on ProjectFlow today.';
    // Clear register fields
    [regName, regEmail, regPassword, regConfirm].forEach(i => i.value = '');
    [
      [fieldRegName, regNameError],
      [fieldRegEmail, regEmailError],
      [fieldRegPassword, regPasswordError],
      [fieldRegConfirm, regConfirmError]
    ].forEach(([f, e]) => clearField(f, e));
    regName.focus();
  }

  function showLogin() {
    registerForm.classList.add('wl-form--hidden');
    backToLoginWrap.classList.add('wl-signup--hidden');
    loginForm.classList.remove('wl-form--hidden');
    signupRow.classList.remove('wl-signup--hidden');
    cardTitle.textContent = 'Sign In';
    cardSub.textContent = 'Access your workspace and pick up where you left off.';
    // Clear login fields
    emailInput.value = '';
    passwordInput.value = '';
    clearField(fieldEmail, emailError);
    clearField(fieldPassword, passwordError);
    emailInput.focus();
  }

  showRegisterBtn.addEventListener('click', function (e) {
    e.preventDefault();
    showRegister();
  });

  showLoginBtn.addEventListener('click', function (e) {
    e.preventDefault();
    showLogin();
  });

  /* ── LOGIN FORM ────────────────────────────────────────────── */
  const emailInput    = document.getElementById('inputEmail');
  const passwordInput = document.getElementById('inputPassword');
  const emailError    = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const fieldEmail    = document.getElementById('fieldEmail');
  const fieldPassword = document.getElementById('fieldPassword');
  const continueBtn   = document.getElementById('continueBtn');
  const pwToggle      = document.getElementById('pwToggle');
  const pwToggleIcon  = document.getElementById('pwToggleIcon');

  setupPwToggle(pwToggle, pwToggleIcon, passwordInput);
  setupFieldValidation(emailInput, fieldEmail, emailError, validateEmail);
  setupFieldValidation(passwordInput, fieldPassword, passwordError, validatePassword);

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const emailErr = validateEmail(emailInput.value);
    const pwErr    = validatePassword(passwordInput.value);

    emailErr ? setFieldError(fieldEmail, emailError, emailErr)
             : setFieldValid(fieldEmail, emailError);
    pwErr    ? setFieldError(fieldPassword, passwordError, pwErr)
             : setFieldValid(fieldPassword, passwordError);

    if (emailErr || pwErr) {
      (emailErr ? emailInput : passwordInput).focus();
      return;
    }

    // Check credentials against stored users
    const users = getUsers();
    const match = users.find(
      u => u.email.toLowerCase() === emailInput.value.trim().toLowerCase()
        && u.password === passwordInput.value
    );

    if (!match) {
      // No matching account — show error regardless of whether users exist
      setFieldError(fieldEmail, emailError, 'Invalid email or password.');
      setFieldError(fieldPassword, passwordError, 'Invalid email or password.');
      emailInput.focus();
      return;
    }

    // Valid — navigate to dashboard
    continueBtn.classList.add('wl-btn--loading');
    continueBtn.setAttribute('aria-busy', 'true');

    // Save session — use matched account name, or email prefix if no account
    const sessionUser = match || { name: emailInput.value.split('@')[0], email: emailInput.value.trim() };
    saveSession(sessionUser);

    setTimeout(function () {
      window.location.href = 'dashboard.html';
    }, 600);
  });

  /* ── REGISTER FORM ─────────────────────────────────────────── */
  const regName         = document.getElementById('regName');
  const regEmail        = document.getElementById('regEmail');
  const regPassword     = document.getElementById('regPassword');
  const regConfirm      = document.getElementById('regConfirm');
  const regNameError    = document.getElementById('regNameError');
  const regEmailError   = document.getElementById('regEmailError');
  const regPasswordError= document.getElementById('regPasswordError');
  const regConfirmError = document.getElementById('regConfirmError');
  const fieldRegName    = document.getElementById('fieldRegName');
  const fieldRegEmail   = document.getElementById('fieldRegEmail');
  const fieldRegPassword= document.getElementById('fieldRegPassword');
  const fieldRegConfirm = document.getElementById('fieldRegConfirm');
  const registerBtn     = document.getElementById('registerBtn');

  setupPwToggle(
    document.getElementById('regPwToggle'),
    document.getElementById('regPwToggleIcon'),
    regPassword
  );
  setupPwToggle(
    document.getElementById('regConfirmToggle'),
    document.getElementById('regConfirmToggleIcon'),
    regConfirm
  );

  setupFieldValidation(regName, fieldRegName, regNameError, validateName);
  setupFieldValidation(regEmail, fieldRegEmail, regEmailError, validateEmail);
  setupFieldValidation(regPassword, fieldRegPassword, regPasswordError, validatePassword);

  // Confirm password: validate on blur/input
  regConfirm.addEventListener('blur', function () {
    if (!this.value) {
      setFieldError(fieldRegConfirm, regConfirmError, 'Please confirm your password.');
    } else if (this.value !== regPassword.value) {
      setFieldError(fieldRegConfirm, regConfirmError, 'Passwords do not match.');
    } else {
      setFieldValid(fieldRegConfirm, regConfirmError);
    }
  });
  regConfirm.addEventListener('input', function () {
    if (fieldRegConfirm.classList.contains('wl-field--error')) {
      if (this.value === regPassword.value) setFieldValid(fieldRegConfirm, regConfirmError);
    }
  });

  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameErr  = validateName(regName.value);
    const emailErr = validateEmail(regEmail.value);
    const pwErr    = validatePassword(regPassword.value);
    const confirmErr = !regConfirm.value
      ? 'Please confirm your password.'
      : regConfirm.value !== regPassword.value
        ? 'Passwords do not match.'
        : '';

    nameErr    ? setFieldError(fieldRegName, regNameError, nameErr)
               : setFieldValid(fieldRegName, regNameError);
    emailErr   ? setFieldError(fieldRegEmail, regEmailError, emailErr)
               : setFieldValid(fieldRegEmail, regEmailError);
    pwErr      ? setFieldError(fieldRegPassword, regPasswordError, pwErr)
               : setFieldValid(fieldRegPassword, regPasswordError);
    confirmErr ? setFieldError(fieldRegConfirm, regConfirmError, confirmErr)
               : setFieldValid(fieldRegConfirm, regConfirmError);

    if (nameErr || emailErr || pwErr || confirmErr) {
      if (nameErr) regName.focus();
      else if (emailErr) regEmail.focus();
      else if (pwErr) regPassword.focus();
      else regConfirm.focus();
      return;
    }

    // Check if email already registered
    const users = getUsers();
    const exists = users.find(
      u => u.email.toLowerCase() === regEmail.value.trim().toLowerCase()
    );
    if (exists) {
      setFieldError(fieldRegEmail, regEmailError, 'An account with this email already exists.');
      regEmail.focus();
      return;
    }

    // Save new user
    users.push({
      name: regName.value.trim(),
      email: regEmail.value.trim().toLowerCase(),
      password: regPassword.value,
      createdAt: new Date().toISOString()
    });
    saveUsers(users);

    // Save session so dashboard picks up the name
    saveSession({ name: regName.value.trim(), email: regEmail.value.trim().toLowerCase() });

    // Show success state then navigate
    registerBtn.classList.add('wl-btn--loading');
    registerBtn.setAttribute('aria-busy', 'true');
    setTimeout(function () {
      window.location.href = 'dashboard.html';
    }, 700);
  });

  /* ── Keyboard: Enter on anchor links ───────────────────────── */
  document.querySelectorAll('.wl-forgot, .wl-signup-link').forEach(function (link) {
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

})();
