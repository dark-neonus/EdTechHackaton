import {adjustUserEventsLink} from './user-events-link.js';
import {initializeEventFilters} from './utils/filter-tabs-utils.js';

document.addEventListener('DOMContentLoaded', function() {
  adjustUserEventsLink();
  
  initializeEventFilters();
  
  document.querySelector('.posts-container').addEventListener('click', function(e) {
    const postElement = e.target.closest('.post');
    
    if (!postElement) return;
    
    if (e.target.closest('button') || e.target.closest('.post-stats')) {
      return;
    }
    
    const eventId = postElement.dataset.id;
    window.location.href = `/events/view_event/${eventId}`;
  });
});