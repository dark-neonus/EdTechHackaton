import { createToast } from './utils/toast-utils.js';
import { showInputError, clearFormErrors, isValidEmail, setSubmitButtonState } from './utils/validation-utils.js ';

function validatePassword(password) {
  const requirements = {
    minLength: 8,
    maxLength: 64,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password)
  };

  const feedback = [];
  
  if (password.length < requirements.minLength) {
    feedback.push(`Password must be at least ${requirements.minLength} characters`);
  } else if (password.length > requirements.maxLength) {
    feedback.push(`Password must be less than ${requirements.maxLength} characters`);
  }
  
  if (!requirements.hasUppercase) feedback.push('Add uppercase letters');
  if (!requirements.hasLowercase) feedback.push('Add lowercase letters');
  if (!requirements.hasNumbers) feedback.push('Add numbers');

  return {
    isValid: password.length >= requirements.minLength && 
             password.length <= requirements.maxLength && 
             requirements.hasUppercase && 
             requirements.hasLowercase && 
             requirements.hasNumbers,
    feedback
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.form-input');
      const svg = this.querySelector('svg');
      input.type = input.type === 'password' ? 'text' : 'password';
      svg.innerHTML = input.type === 'text' 
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });
  });

  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors();

      const formData = {
        first_name: document.getElementById('first_name').value.trim(),
        last_name: document.getElementById('last_name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      };
      
      const confirmPassword = document.getElementById('confirm_password').value;
      let isValid = true;

      ['first_name', 'last_name'].forEach(field => {
        if (!formData[field]) {
          showInputError(document.getElementById(field), `${field.replace('_', ' ')} is required`);
          isValid = false;
        } else if (formData[field].length < 2 || formData[field].length > 50) {
          showInputError(document.getElementById(field), `${field.replace('_', ' ')} must be between 2 and 50 characters`);
          isValid = false;
        }
      });

      if (!formData.email) {
        showInputError(document.getElementById('email'), 'Email is required');
        isValid = false;
      } else if (!isValidEmail(formData.email)) {
        showInputError(document.getElementById('email'), 'Please enter a valid email address');
        isValid = false;
      }

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        showInputError(document.getElementById('password'), 
          'Password must be at least 8 characters and include uppercase, lowercase, and numbers');
        isValid = false;
      }

      if (formData.password !== confirmPassword) {
        showInputError(document.getElementById('confirm_password'), 'Passwords do not match');
        isValid = false;
      }

      if (!isValid) {
        document.querySelector('.form-input-error')?.focus();
        return;
      }

      try {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = setSubmitButtonState(submitButton, true);

        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        submitButton.innerHTML = originalText;
        submitButton.disabled = false;

        if (response.ok) {
          createToast('Registration successful! Redirecting to login...', 'success');
          setTimeout(() => window.location.href = '/auth/login', 2000);
        } else {
          const errorData = await response.json();
          createToast(`Registration failed: ${errorData.detail || 'An error occurred'}`, 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        createToast('Connection error. Please check your internet connection and try again.', 'error');
      }
    });
  }
});