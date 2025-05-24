import {formatEventDates} from './utils/post-format-utils.js';
import {adjustUserEventsLink} from './user-events-link.js';
import {getAuthToken} from './utils/auth-utils.js';
import {loadEventComments} from './event-comments.js'
import { createToast} from './utils/toast-utils.js';

document.addEventListener('DOMContentLoaded', function() {
  formatEventDates();
  setupEventListeners();
  adjustUserEventsLink();
  checkRegistrationStatus();
  checkVoteStatus();
});

async function checkRegistrationStatus() {
  const eventId = getEventIdFromUrl();
  if (!eventId) return;
  
  const token = getAuthToken();
  if (!token) return;
  
  try {
    const response = await fetch(`/events/register/${eventId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateRegistrationUI(data.is_registered);
    }
  } catch (error) {
    console.error('Error checking registration status:', error);
  }
}

async function checkVoteStatus() {
  const eventId = getEventIdFromUrl();
  if (!eventId) return;
  
  const token = getAuthToken();
  if (!token) return;
  
  try {
    const response = await fetch(`/events/vote/${eventId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateVoteUI(data.vote_count, data.has_voted);
    }
  } catch (error) {
    console.error('Error checking vote status:', error);
  }
}

function updateRegistrationUI(isRegistered) {
  const joinButton = document.getElementById('event-join-button');
  
  if (joinButton) {
    if (isRegistered) {
      joinButton.classList.add('registered');
      joinButton.querySelector('span:last-child').textContent = 'Cancel Registration';
    } else {
      joinButton.classList.remove('registered');
      joinButton.disabled = false;
      joinButton.style.opacity = '1';
      joinButton.querySelector('span:last-child').textContent = 'Join Event';
    }
  }
}

async function toggleRegistration(eventId, token) {
  const joinButton = document.getElementById('event-join-button');
  const isRegistered = joinButton.classList.contains('registered');
  
  try {
    const response = await fetch(`/events/register/${eventId}`, {
      method: isRegistered ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      updateRegistrationUI(!isRegistered);
      const action = isRegistered ? 'cancelled' : 'completed';
      createToast(`Registration ${action} successfully`, 'success', 3000);
    } else {
      const errorData = await response.json();
      console.error('Error updating registration:', errorData);
      createToast('Failed to update registration', 'error', 3000);
    }
  } catch (error) {
    console.error('Error updating registration:', error);
    createToast('Failed to update registration', 'error', 3000);
  }
}

function getEventIdFromUrl() {
  const pathParts = window.location.pathname.split('/');
  const eventId = pathParts[pathParts.length - 1];
  return eventId;
}

function updateVoteUI(voteCount, hasVoted) {
  const voteCountElement = document.querySelector('.vote-stat span:last-child');
  const voteButton = document.getElementById('event-vote-button');
  
  if (voteCountElement) {
    voteCountElement.textContent = voteCount;
  }
  
  if (voteButton) {
    if (hasVoted) {
      voteButton.classList.add('voted');
      voteButton.querySelector('span').textContent = 'Unvote';
    } else {
      voteButton.classList.remove('voted');
      voteButton.disabled = false;
      voteButton.style.opacity = '1';
      voteButton.querySelector('span').textContent = 'Vote';
    }
  }
}

async function toggleVote(eventId, token) {
  const voteButton = document.getElementById('event-vote-button');
  const isVoted = voteButton.classList.contains('voted');
  
  try {
    const response = await fetch(`/events/vote/${eventId}`, {
      method: isVoted ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateVoteUI(data.vote_count, data.has_voted);
      const action = isVoted ? 'removed' : 'added';
      createToast(`Vote ${action} successfully`, 'success', 3000);
    } else {
      const errorData = await response.json();
      console.error('Error updating vote:', errorData);
      createToast('Failed to update vote', 'error', 3000);
    }
  } catch (error) {
    console.error('Error updating vote:', error);
    createToast('Failed to update vote', 'error', 3000);
  }
}

function setupEventListeners() {
  const voteButton = document.getElementById('event-vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        createToast('Please log in to vote for this event', 'warning', 5000);
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      await toggleVote(eventId, token);
    });
  }
  const joinEventButton = document.getElementById('event-join-button');
  if (joinEventButton) {
    joinEventButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        createToast('Please log in to register for this event', 'warning', 5000);
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      await toggleRegistration(eventId, token);
    });
  }
}