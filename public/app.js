const api = 'https://incoming2-0-server.incoming-osmcreations.workers.dev/api/v1/auth';
const requestForm = document.querySelector('#request');
const resetForm = document.querySelector('#reset');
const restart = document.querySelector('#restart');
const heading = document.querySelector('#heading');
const description = document.querySelector('#description');
const error = document.querySelector('#error');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const confirmation = document.querySelector('#confirm');

const fragment = new URLSearchParams(location.hash.slice(1));
let token = fragment.get('token');
const openedLink = location.hash.length > 1;
if (openedLink) history.replaceState(null, '', location.pathname + location.search);
fragment.delete('token');

function screen(title, message, form, allowRestart = false, focus = true) {
  heading.textContent = title;
  document.title = title + ' · Incoming 2.0';
  description.textContent = message;
  requestForm.hidden = form !== requestForm;
  resetForm.hidden = form !== resetForm;
  restart.hidden = !allowRestart;
  error.hidden = true;
  error.textContent = '';
  if (focus) heading.focus();
}

function startRequest(focus) {
  token = null;
  resetForm.reset();
  screen('Reset your password', 'Enter the email address associated with your Incoming account.', requestForm, false, focus);
}

function invalidLink(focus = true) {
  token = null;
  resetForm.reset();
  screen('Link unavailable', 'This link has expired, was already used, or is incomplete. Request a new link to continue.', null, true, focus);
}

function showError(message) {
  error.hidden = false;
  error.textContent = message;
}

async function submit(form, endpoint, body) {
  const button = form.querySelector('button');
  if (button.disabled) return null;
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  error.hidden = true;
  try {
    const response = await fetch(api + endpoint, {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000)
    });
    const result = await response.json();
    if (response.ok) return result;
    if (result.error?.code === 'RESET_LINK_INVALID') invalidLink();
    else if (response.status === 429) showError('Too many attempts. Please wait and try again.');
    else if (response.status === 422) showError('Check your entries and try again.');
    else showError('We couldn’t complete your request. Please try again.');
  } catch {
    showError('Couldn’t reach Incoming. Check your connection and try again.');
  } finally {
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
  return null;
}

requestForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!requestForm.reportValidity()) return;
  const result = await submit(requestForm, '/forgot-password', { email: email.value.trim() });
  if (result) {
    requestForm.reset();
    screen('Check your email', 'If the address belongs to an Incoming account, we’ll send a link to reset its password. Check your spam folder if it doesn’t arrive.', null, true);
  }
});

resetForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!token) { invalidLink(); return; }
  confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'Enter the same password in both fields.');
  if (!resetForm.reportValidity()) return;
  const result = await submit(resetForm, '/reset-password', { token, password: password.value });
  if (result) {
    token = null;
    resetForm.reset();
    screen('Password saved', 'Open the Incoming app and sign in with your new password.');
  }
});

resetForm.addEventListener('input', () => confirmation.setCustomValidity(''));
restart.addEventListener('click', () => startRequest(true));
if (!openedLink) startRequest(false);
else if (token && token.length <= 512) {
  screen('Set your password', 'Choose a new password for your Incoming account.', resetForm, false, false);
} else invalidLink(false);
