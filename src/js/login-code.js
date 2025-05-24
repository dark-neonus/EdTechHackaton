import { createToast } from './utils/toast-utils.js';
import { showInputError, clearFormErrors, isValidEmail, setSubmitButtonState } from './utils/validation-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.form-input');
      const svg = this.querySelector('svg');
      
      if (input.type === 'password') {
        input.type = 'text';
        svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
      } else {
        input.type = 'password';
        svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  });

  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors();

      let isValid = true;
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!email) {
        showInputError(document.getElementById('email'), 'Email is required');
        isValid = false;
      } else if (!isValidEmail(email)) {
        showInputError(document.getElementById('email'), 'Please enter a valid email address');
        isValid = false;
      }
      
      if (!password) {
        showInputError(document.getElementById('password'), 'Password is required');
        isValid = false;
      }

      if (!isValid) {
        document.querySelector('.form-input-error')?.focus();
        return;
      }

      try {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = setSubmitButtonState(submitButton, true);

        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
        
        if (response.ok) {
          const data = await response.json();
          createToast('Login successful! Redirecting...', 'success');
          localStorage.setItem('access_token', data.access_token);
          setTimeout(() => window.location.href = '/', 1500);
        } else {
          const errorData = await response.json();
          createToast(`Login failed: ${errorData.detail || 'Invalid credentials'}`, 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        createToast('Connection error. Please check your internet connection and try again.', 'error');
      }
    });
  }
});