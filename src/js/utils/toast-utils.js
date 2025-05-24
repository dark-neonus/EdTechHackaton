/**
 * Toast notification configuration
 * @type {Object}
 */
const TOAST_CONFIG = {
    animationDelay: 10,
    dismissDelay: 300,
    defaultDuration: 5000,
    icons: {
      success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
      error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
      info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
    }
  };
  
  /**
   * Creates an SVG icon element
   * @param {string} type - Toast type
   * @returns {string} SVG markup
   */
  const createIcon = (type) => {
    const iconPath = TOAST_CONFIG.icons[type] || TOAST_CONFIG.icons.error;
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg>`;
  };
  
  /**
   * Creates action buttons HTML for toast
   * @param {Array} actions - Array of action configurations
   * @returns {string} Action buttons HTML
   */
  const createActionButtons = (actions = []) => {
    if (!actions.length) return '';
    
    return `
      <div class="toast-actions">
        ${actions.map(action => `
          <button class="toast-action-btn toast-${action.type || 'secondary'}" data-action-id="${action.id}">
            ${action.text}
          </button>
        `).join('')}
      </div>
    `;
  };

/**
 * Creates toast HTML structure
 * @param {string} message - Toast message
 * @param {string} type - Toast type
 * @param {Array} actions - Action buttons config
 * @returns {string} Toast HTML
 */
const createToastHTML = (message, type, actions) => `
  <div class="toast-icon">${createIcon(type)}</div>
  <div class="toast-content">
    <div class="toast-message">${message}</div>
    ${createActionButtons(actions)}
  </div>
  <button class="toast-close">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
`;
  
  /**
   * Calculates auto-dismiss delay
   * @param {string} type - Toast type
   * @param {number|boolean} customDelay - Custom delay setting
   * @returns {number} Delay in milliseconds
   */
  const getAutoDismissDelay = (type, customDelay) => {
    if (customDelay === false) return 0;
    if (typeof customDelay === 'number') return customDelay;
    return (type === 'success' || type === 'info') ? TOAST_CONFIG.defaultDuration : 0;
  };
  
 /**
 * Creates and displays a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info, warning)
 * @param {Object} options - Additional options for the toast
 * @returns {HTMLElement} The created toast element
 */
export function createToast(message, type = 'error', options = {}) {
  const { actions = [], autoDismiss = true } = options;
  
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    dismissToast(existingToast);
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = createToastHTML(message, type, actions);
  document.body.prepend(toast);

  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

  if (actions.length) {
    actions.forEach(action => {
      const button = toast.querySelector(`[data-action-id="${action.id}"]`);
      if (button && action.callback) {
        button.addEventListener('click', () => {
          action.callback();
          dismissToast(toast);
        });
      }
    });
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, TOAST_CONFIG.animationDelay);
  });

  const delay = getAutoDismissDelay(type, autoDismiss);
  if (delay > 0) {
    setTimeout(() => dismissToast(toast), delay);
  }

  return toast;
}
  
  /**
   * Removes a toast notification with animation  
   * @param {HTMLElement} toast - Toast element to remove 
   */
  export function dismissToast(toast) {
    if (!toast || toast.classList.contains('toast-hidden')) return;
    
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hidden');
    
    setTimeout(() => {
      toast?.parentNode?.removeChild(toast);
    }, TOAST_CONFIG.dismissDelay);
  }

  