import { emitter } from './emitter.js';
import { state } from './state.js';

function validate(payload) {
  const today = new Date().toISOString().split('T')[0];
  
  if (payload.date <= today) return 'Date must be in the future'; // 
  if (payload.tickets < 1 || payload.tickets > 5) return 'Tickets must be between 1 and 5'; // 
  if (!payload.terms) return 'You must agree to the Terms & Conditions'; // 
  
  return null;
}

function handleSubmit(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const payload = {
    date: data.get('date'),
    tickets: parseInt(data.get('tickets')),
    terms: data.get('terms') === 'on'
  };

  const err = validate(payload);
  if (err) {
    emitter.emit('users:formError', err);
    return;
  }
  
  emitter.emit('users:submit', payload);
}

function renderForm() {
  return `
    <form id="registration-form" class="ui-form">
      <h2>Event Registration</h2>
      <input type="date" name="date" class="ui-input">
      <input type="number" name="tickets" placeholder="Number of tickets" class="ui-input">
      <label>
        <input type="checkbox" name="terms"> I agree to the Terms & Conditions
      </label>
      
      ${state.formError ? `<div class="field-error">⚠️ ${state.formError}</div>` : ''} <button type="submit" class="ui-btn">Submit</button>
    </form>
  `;
}

export function render() {
  const app = document.querySelector('#app');
  if (app) {
    app.innerHTML = renderForm();
    const form = document.querySelector('#registration-form');
    if (form) form.addEventListener('submit', handleSubmit); // [cite: 109, 110]
  }
}