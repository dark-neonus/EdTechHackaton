/**
 * Common DOM manipulation utilities
 */

/**
 * Removes an element with animation
 * @param {HTMLElement} element - Element to remove
 * @param {Object} options - Animation options
 */
export function removeElementWithAnimation(element, options = {}) {
    const {
      duration = 500,
      transition = 'all 0.5s ease',
      onComplete = () => {}
    } = options;
  
    if (!element) return;
  
    element.style.transition = transition;
    element.style.overflow = 'hidden';
    element.style.opacity = '0';
    element.style.maxHeight = '0';
    element.style.margin = '0';
    element.style.padding = '0';
    
    setTimeout(() => {
      element.remove();
      onComplete();
    }, duration);
  }
  
  /**
   * Scrolls to element with offset
   * @param {HTMLElement} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  export function scrollToElementWithOffset(element, options = {}) {
    const {
      offsetPercentage = 0.3,
      behavior = 'smooth'
    } = options;
  
    if (!element) return;
  
    const viewportHeight = window.innerHeight;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = rect.top + scrollTop - (viewportHeight * offsetPercentage);
  
    window.scrollTo({
      top: targetPosition,
      behavior
    });
  }
  
  /**
   * Creates or updates style element
   * @param {string} id - Style element ID
   * @param {string} css - CSS content
   */
  export function injectStyles(id, css) {
    let styleEl = document.getElementById(id);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = css;
  }