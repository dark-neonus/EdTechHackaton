import { getUserId, isAuthenticated } from './utils/auth-utils.js';
import { createToast } from './utils/toast-utils.js';

export async function adjustUserEventsLink() {
  const userEventLink = document.getElementById('user-events-link');
  
  if (!userEventLink) {
    console.warn("Link with ID 'user-events-link' not found");
    return;
  }
  
  const isLoggedIn = isAuthenticated();
  let currentUserId;
  
  if (isLoggedIn) {
    try {
      currentUserId = await getUserId();
    } catch (error) {
      console.warn("Error fetching user ID:", error);
    }
  }
  
  if (!userEventLink.hasAttribute('data-click-handler-added')) {
    userEventLink.addEventListener('click', function(event) {
      if (!isAuthenticated()) {
        event.preventDefault();
        createToast('You need to log in to view your events', 'warning', 3000);
        return;
      }
      
      window.location.href = this.dataset.url;
    });
    userEventLink.setAttribute('data-click-handler-added', 'true');
  }
  
  if (!currentUserId) {
    console.warn("Cannot fully adjust user_events link: User ID not found or user not logged in");
    return;
  }

  const baseUrl = `/events/user_events/${currentUserId}`;
  userEventLink.dataset.url = baseUrl;
  
  if (userEventLink.dataset.userId) {
    userEventLink.dataset.userId = currentUserId;
  }
  
  const currentPath = window.location.pathname;
  const userEventsMatch = currentPath.match(/\/events\/user_events\/([a-f0-9-]+)/i);
  
  if (userEventsMatch) {
    const urlUserId = userEventsMatch[1];
    
    if (urlUserId === currentUserId) {
      userEventLink.classList.add('active');
    } else {
      userEventLink.classList.remove('active');
    }
  } else {
    userEventLink.classList.remove('active');
  }
}