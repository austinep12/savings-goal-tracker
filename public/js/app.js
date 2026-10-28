/**
 * Savings Goal Tracker - Frontend Application Controller
 * Course: 23CS2048 - Web Technology IA3
 * Tech Stack: Vanilla JavaScript (ES6+), Fetch API, Bootstrap 5, JWT Authentication
 */

// Application State
const state = {
  user: null,
  token: localStorage.getItem('savings_tracker_token') || null,
  goals: [],
  summary: {
    totalGoalsCount: 0,
    completedGoalsCount: 0,
    inProgressGoalsCount: 0,
    totalTargetAmount: 0,
    totalCurrentSavings: 0,
    remainingAmount: 0,
    overallProgress: 0
  },
  systemInfo: null,
  filters: {
    search: '',
    category: 'All',
    status: 'all',
    sort: 'newest'
  },
  editingGoalId: null,
  deletingGoalId: null,
  searchDebounceTimer: null
};

// Category Configuration & Styling
const CATEGORY_CONFIG = {
  'Emergency': {
    badgeClass: 'cat-emergency',
    icon: 'bi-shield-exclamation',
    emoji: '🚨'
  },
  'Tech & Gadgets': {
    badgeClass: 'cat-tech',
    icon: 'bi-laptop',
    emoji: '💻'
  },
  'Education': {
    badgeClass: 'cat-education',
    icon: 'bi-mortarboard',
    emoji: '🎓'
  },
  'Travel': {
    badgeClass: 'cat-travel',
    icon: 'bi-airplane',
    emoji: '✈️'
  },
  'Vehicle': {
    badgeClass: 'cat-vehicle',
    icon: 'bi-car-front',
    emoji: '🚗'
  },
  'Other': {
    badgeClass: 'cat-other',
    icon: 'bi-tag',
    emoji: '🏷️'
  }
};

// Bulletproof Modal Helpers
function openModal(modalElem) {
  if (!modalElem) return;
  if (window.bootstrap && bootstrap.Modal) {
    try {
      const inst = bootstrap.Modal.getOrCreateInstance(modalElem);
      inst.show();
      return;
    } catch (e) {
      console.warn('Bootstrap show fallback:', e);
    }
  }
  modalElem.classList.add('show');
  modalElem.style.display = 'block';
  modalElem.removeAttribute('aria-hidden');
  document.body.classList.add('modal-open');
  let backdrop = document.querySelector('.modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
  }
}

function closeModal(modalElem) {
  if (!modalElem) return;
  const closeBtn = modalElem.querySelector('[data-bs-dismiss="modal"]');
  if (closeBtn) {
    try {
      closeBtn.click();
    } catch (e) {
      console.warn('closeBtn click error:', e);
    }
  }
  if (window.bootstrap && bootstrap.Modal) {
    try {
      const inst = bootstrap.Modal.getInstance(modalElem);
      if (inst) inst.hide();
    } catch (e) {
      console.warn('Bootstrap hide error:', e);
    }
  }
  modalElem.classList.remove('show');
  modalElem.style.display = 'none';
  modalElem.setAttribute('aria-hidden', 'true');
  modalElem.removeAttribute('aria-modal');
  modalElem.removeAttribute('role');
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
}

// Helper: Get authenticated request headers
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  return headers;
}

// DOM Element Selectors
const DOM = {
  // Sections
  authSection: document.getElementById('authSection'),
  dashboardSection: document.getElementById('dashboardSection'),
  cardSignIn: document.getElementById('cardSignIn'),
  cardRegister: document.getElementById('cardRegister'),
  navUserProfile: document.getElementById('navUserProfile'),
  navUserName: document.getElementById('navUserName'),
  btnLogout: document.getElementById('btnLogout'),
  btnOpenCreateModal: document.getElementById('btnOpenCreateModal'),
  heroGreeting: document.getElementById('heroGreeting'),

  // Auth Forms
  formSignIn: document.getElementById('formSignIn'),
  loginIdentifier: document.getElementById('loginIdentifier'),
  loginPassword: document.getElementById('loginPassword'),
  btnToggleLoginPassword: document.getElementById('btnToggleLoginPassword'),
  signInAlert: document.getElementById('signInAlert'),
  signInSuccessAlert: document.getElementById('signInSuccessAlert'),
  btnSubmitLogin: document.getElementById('btnSubmitLogin'),
  loginSpinner: document.getElementById('loginSpinner'),
  linkToRegister: document.getElementById('linkToRegister'),

  formRegister: document.getElementById('formRegister'),
  registerRole: document.getElementById('registerRole'),
  roleCardStudent: document.getElementById('roleCardStudent'),
  roleCardProfessional: document.getElementById('roleCardProfessional'),
  registerName: document.getElementById('registerName'),
  registerUsername: document.getElementById('registerUsername'),
  registerEmail: document.getElementById('registerEmail'),
  registerPassword: document.getElementById('registerPassword'),
  registerConfirmPassword: document.getElementById('registerConfirmPassword'),
  registerInstitution: document.getElementById('registerInstitution'),
  registerAlert: document.getElementById('registerAlert'),
  btnSubmitRegister: document.getElementById('btnSubmitRegister'),
  registerSpinner: document.getElementById('registerSpinner'),
  linkToSignIn: document.getElementById('linkToSignIn'),

  // Goals Dashboard
  goalsGrid: document.getElementById('goalsGrid'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  filterResultCount: document.getElementById('filterResultCount'),
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  categoryFilter: document.getElementById('categoryFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortFilter: document.getElementById('sortFilter'),
  btnResetFilters: document.getElementById('btnResetFilters'),
  heroGoalStats: document.getElementById('heroGoalStats'),

  // Diagnostic Elements
  sysNodeStatus: document.getElementById('sysNodeStatus'),
  sysDbStatus: document.getElementById('sysDbStatus'),
  modalNodeVer: document.getElementById('modalNodeVer'),
  modalDbEngine: document.getElementById('modalDbEngine'),
  modalDbStatus: document.getElementById('modalDbStatus'),

  // Metric Elements
  metricOverallProgress: document.getElementById('metricOverallProgress'),
  metricProgressBar: document.getElementById('metricProgressBar'),
  metricRemainingText: document.getElementById('metricRemainingText'),
  metricTotalTarget: document.getElementById('metricTotalTarget'),
  metricTotalSaved: document.getElementById('metricTotalSaved'),
  metricRemainingToSave: document.getElementById('metricRemainingToSave'),
  metricCompletedGoals: document.getElementById('metricCompletedGoals'),
  metricCompletedRate: document.getElementById('metricCompletedRate'),
  metricInProgressCount: document.getElementById('metricInProgressCount'),

  // Modal Elements
  goalModal: document.getElementById('goalModal'),
  goalForm: document.getElementById('goalForm'),
  goalFormId: document.getElementById('goalFormId'),
  goalModalTitle: document.getElementById('goalModalTitle'),
  goalModalSubtitle: document.getElementById('goalModalSubtitle'),
  modalIconBadge: document.getElementById('modalIconBadge'),
  formAlertBox: document.getElementById('formAlertBox'),
  submitBtnText: document.getElementById('submitBtnText'),
  submitSpinner: document.getElementById('submitSpinner'),
  btnSubmitGoalForm: document.getElementById('btnSubmitGoalForm'),

  // Form Fields
  formTitle: document.getElementById('formTitle'),
  formCategory: document.getElementById('formCategory'),
  formTargetDate: document.getElementById('formTargetDate'),
  formTargetAmount: document.getElementById('formTargetAmount'),
  formCurrentAmount: document.getElementById('formCurrentAmount'),
  formDescription: document.getElementById('formDescription'),
  formTitleCounter: document.getElementById('formTitleCounter'),
  formDescCounter: document.getElementById('formDescCounter'),

  // Delete Modal
  deleteConfirmModal: document.getElementById('deleteConfirmModal'),
  deleteGoalTitle: document.getElementById('deleteGoalTitle'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),
  deleteSpinner: document.getElementById('deleteSpinner'),

  // Toast Container & Confetti
  toastContainer: document.getElementById('toastContainer'),
  confettiCanvas: document.getElementById('confettiCanvas')
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setTodayMinDate();
  attachEventListeners();
  fetchSystemInfo();

  // Check if session token exists
  initAuthSession();
});

function setTodayMinDate() {
  if (DOM.formTargetDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    DOM.formTargetDate.min = `${yyyy}-${mm}-${dd}`;
  }
}

// ==========================================
// AUTHENTICATION LOGIC & SESSION MANAGEMENT
// ==========================================

async function initAuthSession() {
  if (!state.token) {
    showAuthView();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    const json = await res.json();

    if (res.ok && json.success && json.user) {
      setAuthenticatedUser(json.user);
      await loadAllData();
    } else {
      handleLogout(false);
    }
  } catch (err) {
    console.error('Session verification error:', err);
    showAuthView();
  }
}

function setAuthenticatedUser(user) {
  state.user = user;
  if (DOM.navUserName) DOM.navUserName.textContent = user.name || user.username;
  if (DOM.heroGreeting) DOM.heroGreeting.textContent = `Welcome back, ${user.name}! (${user.financialRole || 'Saver'})`;

  // Update UI display
  DOM.authSection.classList.add('d-none');
  DOM.dashboardSection.classList.remove('d-none');
  DOM.navUserProfile.classList.remove('d-none');
  DOM.navUserProfile.classList.add('d-flex');
  DOM.btnOpenCreateModal.classList.remove('d-none');
  DOM.btnOpenCreateModal.classList.add('d-flex');
}

function showAuthView() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('savings_tracker_token');
  localStorage.removeItem('savings_tracker_user');

  DOM.authSection.classList.remove('d-none');
  DOM.dashboardSection.classList.add('d-none');
  DOM.navUserProfile.classList.add('d-none');
  DOM.navUserProfile.classList.remove('d-flex');
  DOM.btnOpenCreateModal.classList.add('d-none');
  DOM.btnOpenCreateModal.classList.remove('d-flex');

  // Default to Sign In card
  DOM.cardSignIn.classList.remove('d-none');
  DOM.cardRegister.classList.add('d-none');
}

function handleLogout(showNotification = true) {
  showAuthView();
  if (showNotification) {
    showToast('Signed out successfully.', 'info');
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function attachEventListeners() {
  // Switch between Sign In and Register
  if (DOM.linkToRegister) {
    DOM.linkToRegister.addEventListener('click', () => {
      DOM.cardSignIn.classList.add('d-none');
      DOM.cardRegister.classList.remove('d-none');
      hideAuthAlerts();
    });
  }

  if (DOM.linkToSignIn) {
    DOM.linkToSignIn.addEventListener('click', () => {
      DOM.cardRegister.classList.add('d-none');
      DOM.cardSignIn.classList.remove('d-none');
      hideAuthAlerts();
    });
  }

  // Toggle Login Password visibility
  if (DOM.btnToggleLoginPassword) {
    DOM.btnToggleLoginPassword.addEventListener('click', () => {
      const type = DOM.loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      DOM.loginPassword.setAttribute('type', type);
      DOM.btnToggleLoginPassword.querySelector('i').classList.toggle('bi-eye');
      DOM.btnToggleLoginPassword.querySelector('i').classList.toggle('bi-eye-slash');
    });
  }

  // Role Selector Cards
  if (DOM.roleCardStudent && DOM.roleCardProfessional) {
    DOM.roleCardStudent.addEventListener('click', () => {
      DOM.roleCardStudent.classList.add('active');
      DOM.roleCardProfessional.classList.remove('active');
      DOM.registerRole.value = 'Student Saver';
    });

    DOM.roleCardProfessional.addEventListener('click', () => {
      DOM.roleCardProfessional.classList.add('active');
      DOM.roleCardStudent.classList.remove('active');
      DOM.registerRole.value = 'Working Professional';
    });
  }

  // Sign In Form Submit
  if (DOM.formSignIn) {
    DOM.formSignIn.addEventListener('submit', handleSignInSubmit);
  }

  // Register Form Submit
  if (DOM.formRegister) {
    DOM.formRegister.addEventListener('submit', handleRegisterSubmit);
  }

  // Logout Button
  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', () => handleLogout(true));
  }

  // Reset form when opening Create Goal Modal
  if (DOM.btnOpenCreateModal) {
    DOM.btnOpenCreateModal.addEventListener('click', () => {
      resetGoalForm();
    });
  }

  // Search input with debounce
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (DOM.btnClearSearch) {
        DOM.btnClearSearch.classList.toggle('d-none', query.trim() === '');
      }
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        state.filters.search = query.trim();
        fetchGoals();
      }, 250);
    });
  }

  // Clear search button
  if (DOM.btnClearSearch) {
    DOM.btnClearSearch.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.filters.search = '';
      DOM.btnClearSearch.classList.add('d-none');
      fetchGoals();
    });
  }

  // Filters
  if (DOM.categoryFilter) {
    DOM.categoryFilter.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      fetchGoals();
    });
  }

  if (DOM.statusFilter) {
    DOM.statusFilter.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      fetchGoals();
    });
  }

  if (DOM.sortFilter) {
    DOM.sortFilter.addEventListener('change', (e) => {
      state.filters.sort = e.target.value;
      fetchGoals();
    });
  }

  // Reset Filters Button
  if (DOM.btnResetFilters) {
    DOM.btnResetFilters.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.categoryFilter.value = 'All';
      DOM.statusFilter.value = 'all';
      DOM.sortFilter.value = 'newest';
      if (DOM.btnClearSearch) DOM.btnClearSearch.classList.add('d-none');

      state.filters = {
        search: '',
        category: 'All',
        status: 'all',
        sort: 'newest'
      };
      loadAllData();
      showToast('Filters reset to default view', 'info');
    });
  }

  // Real-time Character Counters
  if (DOM.formTitle) {
    DOM.formTitle.addEventListener('input', (e) => {
      const len = e.target.value.length;
      if (DOM.formTitleCounter) DOM.formTitleCounter.textContent = `${len} / 50`;
      validateField(DOM.formTitle, len >= 3 && len <= 50);
    });
  }

  if (DOM.formDescription) {
    DOM.formDescription.addEventListener('input', (e) => {
      const len = e.target.value.length;
      if (DOM.formDescCounter) DOM.formDescCounter.textContent = `${len} / 250`;
    });
  }

  // Form Field Validation
  if (DOM.formTargetAmount) {
    DOM.formTargetAmount.addEventListener('input', () => {
      const val = parseFloat(DOM.formTargetAmount.value);
      validateField(DOM.formTargetAmount, !isNaN(val) && val > 0);
    });
  }

  if (DOM.formCurrentAmount) {
    DOM.formCurrentAmount.addEventListener('input', () => {
      const val = parseFloat(DOM.formCurrentAmount.value);
      validateField(DOM.formCurrentAmount, !isNaN(val) && val >= 0 && val <= 1000000);
    });
  }

  if (DOM.formCategory) {
    DOM.formCategory.addEventListener('change', () => {
      validateField(DOM.formCategory, DOM.formCategory.value !== '');
    });
  }

  if (DOM.formTargetDate) {
    DOM.formTargetDate.addEventListener('change', () => {
      validateTargetDateField();
    });
  }

  // Form Submit Handler (Create / Update Goal)
  if (DOM.goalForm) {
    DOM.goalForm.addEventListener('submit', handleGoalFormSubmit);
  }

  // Confirm Delete Action
  if (DOM.btnConfirmDelete) {
    DOM.btnConfirmDelete.addEventListener('click', handleGoalDelete);
  }
}

// ==========================================
// AUTH CONTROLLER HANDLERS
// ==========================================

async function handleSignInSubmit(e) {
  e.preventDefault();
  hideAuthAlerts();

  const identifier = DOM.loginIdentifier.value.trim();
  const password = DOM.loginPassword.value;

  if (!identifier || !password) {
    showSignInAlert('Please provide both your email/username and password.');
    return;
  }

  setLoginLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const json = await res.json();

    if (res.ok && json.success) {
      state.token = json.token;
      localStorage.setItem('savings_tracker_token', json.token);
      localStorage.setItem('savings_tracker_user', JSON.stringify(json.user));

      setAuthenticatedUser(json.user);
      showToast(json.message || `Welcome back, ${json.user.name}!`, 'success');

      DOM.formSignIn.reset();
      await loadAllData();
    } else {
      showSignInAlert(json.message || 'Invalid email/username or password.');
    }
  } catch (err) {
    console.error('Sign in error:', err);
    showSignInAlert('Network error connecting to authentication server.');
  } finally {
    setLoginLoading(false);
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  hideAuthAlerts();

  const name = DOM.registerName.value.trim();
  const username = DOM.registerUsername.value.trim();
  const email = DOM.registerEmail.value.trim();
  const password = DOM.registerPassword.value;
  const confirmPassword = DOM.registerConfirmPassword.value;
  const financialRole = DOM.registerRole.value;
  const institution = DOM.registerInstitution.value.trim();

  // Validate
  if (!name || name.length < 2) {
    showRegisterAlert('Full Name must be at least 2 characters.');
    return;
  }
  if (!username || username.length < 3) {
    showRegisterAlert('Username must be at least 3 characters.');
    return;
  }
  if (!email || !email.includes('@')) {
    showRegisterAlert('Please provide a valid email address.');
    return;
  }
  if (!password || password.length < 6) {
    showRegisterAlert('Password must be at least 6 characters long.');
    return;
  }
  if (password !== confirmPassword) {
    showRegisterAlert('Passwords do not match. Please verify.');
    return;
  }

  setRegisterLoading(true);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username,
        email,
        password,
        financialRole,
        institution
      })
    });

    const json = await res.json();

    if (res.ok && json.success) {
      // Clear register form
      DOM.formRegister.reset();

      // Transition to Sign In card as requested:
      // "then sign in page should come after accounts created, they should use their sign in credentials to log in"
      DOM.cardRegister.classList.add('d-none');
      DOM.cardSignIn.classList.remove('d-none');

      // Pre-fill email/username on login form
      DOM.loginIdentifier.value = email || username;
      DOM.loginPassword.value = '';

      // Display pleasant success notice on sign-in card
      showSignInSuccess('🎉 Account created successfully! Please sign in with your password to view and manage your goals.');
      showToast('Account created! Please sign in.', 'success');

      setTimeout(() => {
        if (DOM.loginPassword) DOM.loginPassword.focus();
      }, 250);
    } else {
      const msg = json.errors ? json.errors.join(' ') : (json.message || 'Registration failed.');
      showRegisterAlert(msg);
    }
  } catch (err) {
    console.error('Registration error:', err);
    showRegisterAlert('Network error during account registration.');
  } finally {
    setRegisterLoading(false);
  }
}

function showSignInSuccess(msg) {
  if (DOM.signInSuccessAlert) {
    DOM.signInSuccessAlert.textContent = msg;
    DOM.signInSuccessAlert.classList.remove('d-none');
  }
}

function showSignInAlert(msg) {
  if (DOM.signInSuccessAlert) DOM.signInSuccessAlert.classList.add('d-none');
  DOM.signInAlert.textContent = msg;
  DOM.signInAlert.classList.remove('d-none');
}

function showRegisterAlert(msg) {
  DOM.registerAlert.textContent = msg;
  DOM.registerAlert.classList.remove('d-none');
}

function hideAuthAlerts() {
  if (DOM.signInAlert) DOM.signInAlert.classList.add('d-none');
  if (DOM.signInSuccessAlert) DOM.signInSuccessAlert.classList.add('d-none');
  if (DOM.registerAlert) DOM.registerAlert.classList.add('d-none');
}

function setLoginLoading(isLoading) {
  DOM.loginSpinner.classList.toggle('d-none', !isLoading);
  DOM.btnSubmitLogin.disabled = isLoading;
}

function setRegisterLoading(isLoading) {
  DOM.registerSpinner.classList.toggle('d-none', !isLoading);
  DOM.btnSubmitRegister.disabled = isLoading;
}

// ==========================================
// GOAL DATA API METHODS (Protected by JWT)
// ==========================================

async function fetchSystemInfo() {
  try {
    const res = await fetch('/api/system-info');
    const json = await res.json();
    if (json.success) {
      state.systemInfo = json;
      if (DOM.sysNodeStatus) DOM.sysNodeStatus.textContent = `${json.platform} ${json.nodeVersion} (${json.framework})`;
      if (DOM.sysDbStatus) DOM.sysDbStatus.textContent = `${json.database} (${json.odm}) • ${json.dbConnectionState}`;
      if (DOM.modalNodeVer) DOM.modalNodeVer.textContent = `${json.platform} ${json.nodeVersion}`;
      if (DOM.modalDbEngine) DOM.modalDbEngine.textContent = `${json.database} via ${json.odm}`;
      if (DOM.modalDbStatus) DOM.modalDbStatus.textContent = json.dbConnectionState;
    }
  } catch (e) {
    console.warn('System info check:', e.message);
  }
}

async function loadAllData() {
  if (!state.token) return;
  await Promise.all([fetchGoals(), fetchSummary()]);
}

async function fetchGoals() {
  if (!state.token) return;
  try {
    showLoading(true);
    const params = new URLSearchParams();

    if (state.filters.search) params.append('search', state.filters.search);
    if (state.filters.category && state.filters.category !== 'All') params.append('category', state.filters.category);
    if (state.filters.status && state.filters.status !== 'all') params.append('status', state.filters.status);
    if (state.filters.sort) params.append('sort', state.filters.sort);

    const url = `/api/goals?${params.toString()}`;
    const response = await fetch(url, { headers: getAuthHeaders() });

    if (response.status === 401) {
      handleLogout(false);
      return;
    }

    const json = await response.json();

    if (json.success) {
      state.goals = json.data;
      renderGoals(state.goals);
      updateFilterSummaryCount(state.goals.length);
    } else {
      showToast(json.message || 'Failed to retrieve goals', 'danger');
    }
  } catch (error) {
    console.error('fetchGoals error:', error);
  } finally {
    showLoading(false);
  }
}

async function fetchSummary() {
  if (!state.token) return;
  try {
    const response = await fetch('/api/goals/summary', { headers: getAuthHeaders() });

    if (response.status === 401) {
      handleLogout(false);
      return;
    }

    const json = await response.json();

    if (json.success) {
      state.summary = json.data;
      updateMetricCards(state.summary);
    }
  } catch (error) {
    console.error('fetchSummary error:', error);
  }
}

async function handleGoalFormSubmit(e) {
  e.preventDefault();

  const isValid = validateEntireForm();
  if (!isValid) {
    showFormAlert('Please fix the highlighted validation errors above.');
    return;
  }

  hideFormAlert();
  setSubmitLoading(true);

  const isEditMode = Boolean(state.editingGoalId);
  const goalPayload = {
    title: DOM.formTitle.value.trim(),
    category: DOM.formCategory.value,
    targetDate: DOM.formTargetDate.value,
    targetAmount: parseFloat(DOM.formTargetAmount.value),
    currentAmount: parseFloat(DOM.formCurrentAmount.value) || 0,
    description: DOM.formDescription.value.trim()
  };

  const endpoint = isEditMode ? `/api/goals/${state.editingGoalId}` : '/api/goals';
  const httpMethod = isEditMode ? 'PUT' : 'POST';

  try {
    const response = await fetch(endpoint, {
      method: httpMethod,
      headers: getAuthHeaders(),
      body: JSON.stringify(goalPayload)
    });

    if (response.status === 401) {
      handleLogout(false);
      return;
    }

    const json = await response.json();

    if (response.ok && json.success) {
      setSubmitLoading(false);
      closeModal(DOM.goalModal);
      resetGoalForm();

      showToast(json.message || 'Goal saved successfully!', 'success');

      if (json.data && json.data.isCompleted) {
        launchConfetti();
      }

      await loadAllData();
    } else {
      setSubmitLoading(false);
      const errorMsg = json.errors ? json.errors.join(' ') : (json.message || 'Operation failed');
      showFormAlert(errorMsg);
      showToast(errorMsg, 'danger');
    }
  } catch (error) {
    console.error('Form submit error:', error);
    setSubmitLoading(false);
    showFormAlert('Network error occurred. Please check your connection.');
  }
}

async function handleAddFunds(goalId, amountToAdd, inputElem, btnElem) {
  const parsedAmount = parseFloat(amountToAdd);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    showToast('Please enter a valid deposit amount greater than $0.', 'warning');
    if (inputElem) inputElem.focus();
    return;
  }

  try {
    if (btnElem) {
      btnElem.disabled = true;
      btnElem.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span>`;
    }

    const response = await fetch(`/api/goals/${goalId}/add-funds`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount: parsedAmount })
    });

    if (response.status === 401) {
      handleLogout(false);
      return;
    }

    const json = await response.json();

    if (response.ok && json.success) {
      showToast(json.message, 'success');

      if (json.justCompleted) {
        launchConfetti();
      }

      if (inputElem) inputElem.value = '';
      await loadAllData();
    } else {
      showToast(json.message || 'Could not add funds', 'danger');
    }
  } catch (error) {
    console.error('handleAddFunds error:', error);
    showToast('Server error while adding funds', 'danger');
  } finally {
    if (btnElem) {
      btnElem.disabled = false;
      btnElem.innerHTML = `<i class="bi bi-plus-lg me-1"></i>Deposit`;
    }
  }
}

async function handleGoalDelete() {
  if (!state.deletingGoalId) return;

  try {
    DOM.deleteSpinner.classList.remove('d-none');
    DOM.btnConfirmDelete.disabled = true;

    const response = await fetch(`/api/goals/${state.deletingGoalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      handleLogout(false);
      return;
    }

    const json = await response.json();

    if (response.ok && json.success) {
      closeModal(DOM.deleteConfirmModal);
      showToast(json.message || 'Goal deleted successfully.', 'success');
      state.deletingGoalId = null;
      await loadAllData();
    } else {
      showToast(json.message || 'Could not delete goal', 'danger');
    }
  } catch (error) {
    console.error('Delete goal error:', error);
    showToast('Error deleting goal', 'danger');
  } finally {
    DOM.deleteSpinner.classList.add('d-none');
    DOM.btnConfirmDelete.disabled = false;
  }
}

// ==========================================
// UI RENDERING METHODS
// ==========================================

function renderGoals(goals) {
  DOM.goalsGrid.innerHTML = '';

  if (!goals || goals.length === 0) {
    DOM.emptyState.classList.remove('d-none');
    return;
  }

  DOM.emptyState.classList.add('d-none');

  goals.forEach((goal) => {
    const cardCol = document.createElement('div');
    cardCol.className = 'col-12 col-md-6 col-xl-4';
    cardCol.innerHTML = createGoalCardHTML(goal);
    DOM.goalsGrid.appendChild(cardCol);

    bindCardActions(cardCol, goal);
  });
}

function createGoalCardHTML(goal) {
  const catConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG['Other'];
  const percent = Math.min(100, Math.round(((goal.currentAmount / goal.targetAmount) * 100) * 10) / 10);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  let progressColorClass = 'progress-low';
  let progressBadgeBg = 'bg-warning-subtle text-warning';

  if (percent >= 100) {
    progressColorClass = 'progress-complete';
    progressBadgeBg = 'bg-success-subtle text-success';
  } else if (percent >= 50) {
    progressColorClass = 'progress-mid';
    progressBadgeBg = 'bg-info-subtle text-info';
  }

  const targetDateObj = new Date(goal.targetDate);
  const formattedDate = targetDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const daysRemaining = calculateDaysRemaining(targetDateObj);
  let deadlineBadge = '';
  if (goal.isCompleted) {
    deadlineBadge = `<span class="badge bg-success-subtle text-success rounded-pill fw-bold"><i class="bi bi-check2-all me-1"></i>Achieved</span>`;
  } else if (daysRemaining < 0) {
    deadlineBadge = `<span class="badge bg-danger-subtle text-danger rounded-pill fw-bold"><i class="bi bi-exclamation-triangle me-1"></i>Overdue</span>`;
  } else if (daysRemaining === 0) {
    deadlineBadge = `<span class="badge bg-warning-subtle text-warning rounded-pill fw-bold"><i class="bi bi-clock me-1"></i>Due Today</span>`;
  } else {
    deadlineBadge = `<span class="badge bg-secondary-subtle text-secondary rounded-pill fw-semibold"><i class="bi bi-calendar3 me-1"></i>${daysRemaining}d left</span>`;
  }

  return `
    <div class="card h-100 goal-card-pro ${goal.isCompleted ? 'completed-card' : ''} shadow-sm" data-id="${goal._id}">
      <div class="card-body p-4 d-flex flex-column">

        <!-- Top Row: Category & Status -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="badge-category ${catConfig.badgeClass}">
            <i class="bi ${catConfig.icon}"></i>
            <span>${goal.category}</span>
          </span>

          <div>
            ${goal.isCompleted ? `
              <span class="completed-ribbon">
                <i class="bi bi-trophy-fill"></i> Goal Completed 🎉
              </span>
            ` : deadlineBadge}
          </div>
        </div>

        <!-- Title & Description -->
        <h5 class="fw-bold text-dark mb-2 text-truncate" title="${escapeHTML(goal.title)}">
          ${escapeHTML(goal.title)}
        </h5>
        <p class="text-muted small mb-3 flex-grow-1" style="min-height: 2.2rem; line-height: 1.4;">
          ${goal.description ? escapeHTML(goal.description) : '<span class="text-secondary fst-italic">No additional strategy notes.</span>'}
        </p>

        <!-- Deadline row -->
        <div class="d-flex align-items-center justify-content-between small mb-3 pb-2 border-bottom">
          <span class="text-muted"><i class="bi bi-flag me-1 text-primary"></i>Target Date:</span>
          <span class="fw-bold text-dark">${formattedDate}</span>
        </div>

        <!-- 3-Tile Financial Matrix -->
        <div class="row g-2 mb-3">
          <div class="col-4">
            <div class="stat-box-pro">
              <span class="stat-box-label">Target</span>
              <span class="stat-box-val text-dark text-truncate">$${formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-box-pro">
              <span class="stat-box-label">Saved</span>
              <span class="stat-box-val text-success text-truncate">$${formatCurrency(goal.currentAmount)}</span>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-box-pro">
              <span class="stat-box-label">Remaining</span>
              <span class="stat-box-val ${remaining === 0 ? 'text-success' : 'text-danger'} text-truncate">$${formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>

        <!-- Dynamic Progress Bar -->
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1 small">
            <span class="fw-bold text-muted">Progress</span>
            <span class="badge ${progressBadgeBg} rounded-pill fw-bold">${percent}%</span>
          </div>
          <div class="goal-progress-track">
            <div class="goal-progress-bar ${progressColorClass}" style="width: ${percent}%;"></div>
          </div>
        </div>

        <!-- Inline Quick Deposit Area -->
        <div class="quick-deposit-area mb-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <small class="text-muted fw-bold">Quick Deposit:</small>
            <div class="d-flex gap-1">
              <button type="button" class="preset-chip btn-preset" data-amount="50">+$50</button>
              <button type="button" class="preset-chip btn-preset" data-amount="100">+$100</button>
              <button type="button" class="preset-chip btn-preset" data-amount="250">+$250</button>
            </div>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-white text-muted fw-bold">$</span>
            <input type="number" class="form-control input-fund-amount modern-input" placeholder="Amount" min="1" step="any">
            <button class="btn btn-primary btn-add-funds px-3 fw-bold" type="button">
              <i class="bi bi-plus-lg me-1"></i>Deposit
            </button>
          </div>
        </div>

        <!-- Action Buttons: Edit & Delete -->
        <div class="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
          <button type="button" class="btn btn-sm btn-outline-secondary btn-edit-goal rounded-2 px-3 fw-semibold" title="Edit Goal Details">
            <i class="bi bi-pencil-fill me-1"></i>Edit
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete-goal rounded-2 px-3 fw-semibold" title="Delete Goal">
            <i class="bi bi-trash3-fill me-1"></i>Delete
          </button>
        </div>

      </div>
    </div>
  `;
}

function bindCardActions(cardCol, goal) {
  const fundInput = cardCol.querySelector('.input-fund-amount');
  const addFundsBtn = cardCol.querySelector('.btn-add-funds');
  const presetChips = cardCol.querySelectorAll('.btn-preset');
  const editBtn = cardCol.querySelector('.btn-edit-goal');
  const deleteBtn = cardCol.querySelector('.btn-delete-goal');

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const amount = chip.getAttribute('data-amount');
      fundInput.value = amount;
      handleAddFunds(goal._id, amount, fundInput, addFundsBtn);
    });
  });

  addFundsBtn.addEventListener('click', () => {
    handleAddFunds(goal._id, fundInput.value, fundInput, addFundsBtn);
  });

  fundInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFunds(goal._id, fundInput.value, fundInput, addFundsBtn);
    }
  });

  editBtn.addEventListener('click', () => {
    populateEditModal(goal);
  });

  deleteBtn.addEventListener('click', () => {
    state.deletingGoalId = goal._id;
    DOM.deleteGoalTitle.textContent = `"${goal.title}"`;
    openModal(DOM.deleteConfirmModal);
  });
}

function updateMetricCards(summary) {
  if (DOM.metricOverallProgress) DOM.metricOverallProgress.textContent = `${summary.overallProgress || 0}%`;
  if (DOM.metricProgressBar) DOM.metricProgressBar.style.width = `${Math.min(100, summary.overallProgress || 0)}%`;
  if (DOM.metricTotalTarget) DOM.metricTotalTarget.textContent = `$${formatCurrency(summary.totalTargetAmount || 0)}`;
  if (DOM.metricTotalSaved) DOM.metricTotalSaved.textContent = `$${formatCurrency(summary.totalCurrentSavings || 0)}`;
  if (DOM.metricRemainingToSave) DOM.metricRemainingToSave.textContent = `Remaining to save: $${formatCurrency(summary.remainingAmount || 0)}`;

  if (DOM.metricCompletedGoals) DOM.metricCompletedGoals.textContent = `${summary.completedGoalsCount || 0} / ${summary.totalGoalsCount || 0}`;

  const completionRate =
    summary.totalGoalsCount > 0
      ? Math.round((summary.completedGoalsCount / summary.totalGoalsCount) * 100)
      : 0;
  if (DOM.metricCompletedRate) DOM.metricCompletedRate.textContent = `${completionRate}%`;
  if (DOM.metricInProgressCount) DOM.metricInProgressCount.textContent = `${summary.inProgressGoalsCount || 0} in progress`;

  if (DOM.heroGoalStats) DOM.heroGoalStats.textContent = `${summary.totalGoalsCount || 0} Goals Active`;
}

function updateFilterSummaryCount(count) {
  const total = state.summary.totalGoalsCount || 0;
  if (state.filters.search || state.filters.category !== 'All' || state.filters.status !== 'all') {
    DOM.filterResultCount.innerHTML = `Showing <strong>${count}</strong> of <strong>${total}</strong> goals matching active filters`;
  } else {
    DOM.filterResultCount.innerHTML = `Showing all <strong>${count}</strong> savings goals`;
  }
}

// ==========================================
// FORM HANDLING & STRICT VALIDATION
// ==========================================

function resetGoalForm() {
  state.editingGoalId = null;
  DOM.goalForm.reset();
  DOM.goalFormId.value = '';

  DOM.goalModalTitle.textContent = 'Create New Savings Goal';
  DOM.goalModalSubtitle.textContent = 'Enter goal details and target financial timeline';
  DOM.submitBtnText.textContent = 'Create Savings Goal';
  DOM.modalIconBadge.innerHTML = `<i class="bi bi-plus-circle-fill"></i>`;

  DOM.formTitleCounter.textContent = '0 / 50';
  DOM.formDescCounter.textContent = '0 / 250';
  DOM.formCurrentAmount.value = '0';

  clearValidationStyles();
  hideFormAlert();
}

function populateEditModal(goal) {
  state.editingGoalId = goal._id;
  clearValidationStyles();
  hideFormAlert();

  DOM.goalModalTitle.textContent = 'Edit Savings Goal';
  DOM.goalModalSubtitle.textContent = `Update target parameters for "${goal.title}"`;
  DOM.submitBtnText.textContent = 'Save Changes';
  DOM.modalIconBadge.innerHTML = `<i class="bi bi-pencil-square"></i>`;

  DOM.goalFormId.value = goal._id;
  DOM.formTitle.value = goal.title;
  DOM.formCategory.value = goal.category;

  const d = new Date(goal.targetDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  DOM.formTargetDate.value = `${yyyy}-${mm}-${dd}`;

  DOM.formTargetAmount.value = goal.targetAmount;
  DOM.formCurrentAmount.value = goal.currentAmount;
  DOM.formDescription.value = goal.description || '';

  DOM.formTitleCounter.textContent = `${goal.title.length} / 50`;
  DOM.formDescCounter.textContent = `${(goal.description || '').length} / 250`;

  openModal(DOM.goalModal);
}

function validateEntireForm() {
  let isValid = true;

  const titleVal = DOM.formTitle.value.trim();
  const titleValid = titleVal.length >= 3 && titleVal.length <= 50;
  validateField(DOM.formTitle, titleValid);
  if (!titleValid) isValid = false;

  const catVal = DOM.formCategory.value;
  const catValid = catVal !== '' && Object.keys(CATEGORY_CONFIG).includes(catVal);
  validateField(DOM.formCategory, catValid);
  if (!catValid) isValid = false;

  const dateValid = validateTargetDateField();
  if (!dateValid) isValid = false;

  const targetVal = parseFloat(DOM.formTargetAmount.value);
  const targetValid = !isNaN(targetVal) && targetVal > 0;
  validateField(DOM.formTargetAmount, targetValid);
  if (!targetValid) isValid = false;

  const currentVal = parseFloat(DOM.formCurrentAmount.value);
  const currentValid = !isNaN(currentVal) && currentVal >= 0 && currentVal <= 1000000;
  validateField(DOM.formCurrentAmount, currentValid);
  if (!currentValid) isValid = false;

  return isValid;
}

function validateTargetDateField() {
  const dateStr = DOM.formTargetDate.value;
  if (!dateStr) {
    validateField(DOM.formTargetDate, false);
    return false;
  }

  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isValid = !isNaN(selectedDate.getTime()) && selectedDate >= today;
  validateField(DOM.formTargetDate, isValid);
  return isValid;
}

function validateField(elem, isValid) {
  if (isValid) {
    elem.classList.remove('is-invalid');
    elem.classList.add('is-valid');
  } else {
    elem.classList.remove('is-valid');
    elem.classList.add('is-invalid');
  }
}

function clearValidationStyles() {
  const inputs = DOM.goalForm.querySelectorAll('.form-control, .form-select');
  inputs.forEach((input) => {
    input.classList.remove('is-valid', 'is-invalid');
  });
}

function showFormAlert(message) {
  DOM.formAlertBox.textContent = message;
  DOM.formAlertBox.classList.remove('d-none');
}

function hideFormAlert() {
  DOM.formAlertBox.classList.add('d-none');
  DOM.formAlertBox.textContent = '';
}

function setSubmitLoading(isLoading) {
  if (DOM.submitSpinner) DOM.submitSpinner.classList.toggle('d-none', !isLoading);
  if (DOM.btnSubmitGoalForm) DOM.btnSubmitGoalForm.disabled = isLoading;
}

function showLoading(isLoading) {
  if (DOM.loadingState) DOM.loadingState.classList.toggle('d-none', !isLoading);
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info') {
  const toastId = 'toast-' + Date.now();
  const iconMap = {
    success: 'bi-check-circle-fill text-success',
    danger: 'bi-exclamation-octagon-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-primary'
  };

  const toastHTML = `
    <div id="${toastId}" class="toast custom-toast align-items-center bg-white shadow-lg show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2 py-3 px-3">
          <i class="bi ${iconMap[type] || iconMap.info} fs-5"></i>
          <span class="fw-semibold text-dark">${escapeHTML(message)}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  if (!DOM.toastContainer) return;
  DOM.toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = document.getElementById(toastId);

  const closeBtn = toastElement.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => toastElement.remove());
  }

  setTimeout(() => {
    if (toastElement) toastElement.remove();
  }, 4000);
}

// ==========================================
// CONFETTI CELEBRATION ENGINE
// ==========================================

function launchConfetti() {
  const canvas = DOM.confettiCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

  for (let i = 0; i < 140; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.7) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }

  let animationFrameId;
  function updateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.alpha -= 0.012;
      p.rotation += p.rotationSpeed;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrameId = requestAnimationFrame(updateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  updateConfetti();
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatCurrency(num) {
  const val = Number(num) || 0;
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function calculateDaysRemaining(targetDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
