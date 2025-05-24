/**
 * Common validation utilities
 */

/**
 * Validates text content
 * @param {string} content - Content to validate
 * @param {Object} options - Validation options
 */
export function validateTextContent(content, options = {}) {
    const {
      minLength = 2,
      maxLength = 500,
      maxUrls = 5,
      maxCapitalization = 0.7,
      maxRepeatingChars = 10
    } = options;
  
    const trimmedContent = content.trim();
  
    if (!trimmedContent) {
      return {
        valid: false,
        message: 'Content cannot be empty'
      };
    }
  
    if (trimmedContent.length < minLength) {
      return {
        valid: false,
        message: `Content is too short (minimum ${minLength} characters)`
      };
    }
  
    if (trimmedContent.length > maxLength) {
      return {
        valid: false,
        message: `Content is too long (maximum ${maxLength} characters)`
      };
    }
  
    const upperCaseChars = trimmedContent.replace(/[^A-Z]/g, '').length;
    const totalChars = trimmedContent.replace(/[^A-Za-z]/g, '').length;
  
    if (totalChars > 20 && upperCaseChars / totalChars > maxCapitalization) {
      return {
        valid: false,
        message: 'Please avoid using excessive capitalization'
      };
    }
  
    if (new RegExp(`(.)\\1{${maxRepeatingChars},}`).test(trimmedContent)) {
      return {
        valid: false,
        message: 'Content contains excessive repeating characters'
      };
    }
  
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = trimmedContent.match(urlRegex) || [];
  
    if (urls.length > maxUrls) {
      return {
        valid: false,
        message: `Too many URLs (maximum ${maxUrls} allowed)`
      };
    }
  
    return {
      valid: true,
      content: trimmedContent
    };
  }
  
  /**
   * Sanitizes HTML content
   * @param {string} content - Content to sanitize
   */
  export function sanitizeHtml(content) {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
 * Form validation utilities
 */

/**
 * Displays error for form input
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
export function showInputError(input, message) {
    input.classList.add('form-input-error');
    const errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    input.parentElement.appendChild(errorEl);
  }
  
  /**
   * Clears all form errors
   */
  export function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    document.querySelectorAll('.form-input-error').forEach(el => 
      el.classList.remove('form-input-error')
    );
  }
  
  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is email valid
   */
  export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  /**
   * Updates button state during form submission
   * @param {HTMLButtonElement} button - Submit button
   * @param {boolean} loading - Loading state
   */
  export function setSubmitButtonState(button, loading) {
    if (loading) {
      const originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke-dasharray="32" stroke-dashoffset="0"></circle>
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
        </svg>
        Processing...
      `;
      return originalText;
    } else {
      button.disabled = false;
      return null;
    }
  }
