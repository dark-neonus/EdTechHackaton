  import { removeElementWithAnimation, scrollToElementWithOffset } from './utils/dom-utils.js';
  import { validateTextContent, sanitizeHtml } from './utils/validation-utils.js';
  import { RateLimit } from './utils/rate-limit-utils.js';
  import { createToast, dismissToast } from './utils/toast-utils.js';
  import { getAuthToken, getUserId } from './utils/auth-utils.js';
  import { formatRelativeDate, formatISODate } from './utils/post-format-utils.js';
  import { sortCommentsByDate } from './utils/sort-utils.js';

  function getEventIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  }

  function updateCommentCount(count) {
    const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
    if (commentCountElement) {
      commentCountElement.textContent = count;
    }
  }

  function showDeleteConfirmationToast(commentId) {
    return createToast('Delete this comment?', 'warning', {
      autoDismiss: false,
      actions: [
        {
          id: 'cancel',
          text: 'Cancel',
          type: 'secondary',
          callback: () => {}
        },
        {
          id: 'delete',
          text: 'Delete',
          type: 'danger',
          callback: () => performCommentDeletion(commentId)
        }
      ]
    });
  }

  async function performCommentDeletion(commentId) {
    const token = getAuthToken();
    if (!token) {
      createToast('Please log in to delete comments', 'error');
      return;
    }
    
    const loadingToast = createToast('Deleting comment...', 'info', { autoDismiss: false });
    
    try {
      const response = await fetch(`/events/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      dismissToast(loadingToast);
      
      if (response.ok) {
        createToast('Comment deleted successfully', 'success', { autoDismiss: 3000 });
        
        updateCommentCountAndRemove(commentId);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      createToast(error.message || 'Failed to delete comment', 'error');
    }
  }

  function updateCommentCountAndRemove(commentId) {
    const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
    if (commentCountElement) {
      const currentCount = parseInt(commentCountElement.textContent) || 0;
      if (currentCount > 0) {
        updateCommentCount(currentCount - 1);
      }
    }
    
    const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
    if (commentElement) {
      removeElementWithAnimation(commentElement, {
        onComplete: checkEmptyComments
      });
    } else {
      loadEventComments();
    }
  }

  function checkEmptyComments() {
    const remainingComments = document.querySelectorAll('.comment').length;
    if (remainingComments === 0) {
      const commentsContainer = document.getElementById('comments-container');
      if (commentsContainer) {
        commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
      }
    }
  }

  function loadEventComments() {
    const commentsContainer = document.getElementById('comments-container');
    const eventId = getEventIdFromUrl();
    
    if (!eventId || !commentsContainer) return;
    
    commentsContainer.innerHTML = '';
    
    commentsContainer.innerHTML = '<div class="loading-comments">Loading comments...</div>';
    
    try {
        fetch(`/events/${eventId}/comments`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
                    createToast('Failed to load comments', 'error');
                    throw new Error('Failed to load comments');
                }
            })
            .then(data => {
                commentsContainer.innerHTML = '';
                renderComments(data.comments);
                
                updateCommentCount(data.comments.length);
                
                setupCommentFormListeners();
            })
            .catch(error => {
                console.error('Error loading comments:', error);
                commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
                createToast('Error loading comments: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
        createToast('Error loading comments: ' + error.message, 'error');
    }
}

  function renderComments(comments) {
    const commentsContainer = document.getElementById('comments-container');
    
    if (!commentsContainer) return;
    
    if (comments.length === 0) {
      commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
      return;
    }
    
    const sortedComments = sortCommentsByDate(comments, 'desc');
    
    getUserId().then(currentUserId => {
      for (const comment of sortedComments) {
        createCommentElement(comment, currentUserId).then(commentElement => {
          commentsContainer.appendChild(commentElement);
        });
      }
      
      addSortingControls(commentsContainer, comments);
    });
  }

  function addSortingControls(container, comments) {
    if (container.querySelector('.comments-sorting')) {
        return;
    }
    
    const sortingControls = document.createElement('div');
    sortingControls.className = 'comments-sorting';
    sortingControls.innerHTML = `
      <label for="comment-sort">Sort by:</label>
      <select id="comment-sort">
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>
    `;
    
    container.insertBefore(sortingControls, container.firstChild);
    
    const sortSelect = sortingControls.querySelector('#comment-sort');
    sortSelect.addEventListener('change', () => {
      const sortedComments = sortCommentsByDate(comments, sortSelect.value);
      updateCommentOrder(sortedComments);
    });
}

function updateCommentOrder(sortedComments) {
  const commentsContainer = document.getElementById('comments-container');
  
  const existingSortingControls = document.querySelector('.comments-sorting');
  
  commentsContainer.innerHTML = '';
  
  if (existingSortingControls) {
    commentsContainer.appendChild(existingSortingControls);
  }
  
  sortedComments.forEach(async (comment) => {
    const currentUserId = document.body.getAttribute('data-user-id') || await getUserId();
    
    const commentElement = await createCommentElement(comment, currentUserId);
    commentsContainer.appendChild(commentElement);
    
    addCommentActionListeners(commentElement, comment);
  });
}

  async function createCommentElement(comment, currentUserId) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.setAttribute('data-comment-id', comment.id);
    
    const formattedDate = formatRelativeDate(comment.date_created);
    const isoDate = formatISODate(comment.date_created);
    
    const isAuthor = String(comment.user_id).trim() === String(currentUserId).trim();

    const safeContent = sanitizeCommentContent(comment.content);
    
    let replyToHtml = '';
    if (comment.parent_comment_author) {
      const safeParentAuthor = sanitizeCommentContent(comment.parent_comment_author);
      replyToHtml = `
        <div class="reply-reference">
          <span class="reply-to-text">Reply to</span>
          <span class="reply-to-author">${safeParentAuthor}</span>
        </div>
      `;
    }

    const safeUsername = sanitizeCommentContent(comment.author_username);

    commentDiv.innerHTML = `
      <div class="comment-header">
        <div class="comment-user-info" onclick="window.location.href='/auth/profile/${comment.user_id}'">
          <div class="comment-avatar">
            <img src="https://via.placeholder.com/32" alt="User avatar">
          </div>
          <div class="comment-user-meta">
            <p class="comment-username">${safeUsername}</p>
            ${replyToHtml}
            <p class="comment-time" datetime="${isoDate}">${formattedDate}</p>
          </div>
        </div>
        <div class="comment-actions">
          ${isAuthor ? `
            <button class="edit-comment-button" data-comment-id="${comment.id}">
              <span class="icon icon-edit"></span>
            </button>
            <button class="delete-comment-button" data-comment-id="${comment.id}">
              <span class="icon icon-delete"></span>
            </button>
          ` : ''}
        </div>
      </div>
      <div class="comment-content">
        <p>${safeContent}</p>
      </div>
      <div class="comment-footer">
        <button class="reply-button" data-comment-id="${comment.id}">
          Reply
        </button>
      </div>
    `;
    
    addCommentActionListeners(commentDiv, comment);
    
    return commentDiv;
  }

  function addCommentActionListeners(commentDiv, comment) {
    const editButton = commentDiv.querySelector('.edit-comment-button');
    if (editButton) {
      editButton.addEventListener('click', () => {
        startEditing(comment);
      });
    }
    
    const deleteButton = commentDiv.querySelector('.delete-comment-button');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        showDeleteConfirmationToast(comment.id);
      });
    }
    
    const replyButton = commentDiv.querySelector('.reply-button');
    if (replyButton) {
      replyButton.addEventListener('click', () => {
        startReply(comment);
      });
    }
  }
  function setupCommentFormListeners() {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('comment-submit-button');
    const cancelButton = document.getElementById('comment-cancel-button');
    const charCounter = document.getElementById('comment-char-counter') || createCharCounter();
    
    if (!commentInput || !submitButton || !cancelButton) return;
    
    const newSubmitButton = submitButton.cloneNode(true);
    const newCancelButton = cancelButton.cloneNode(true);
    
    if (submitButton.parentNode) {
      submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
    }
    
    if (cancelButton.parentNode) {
      cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    }
    
    commentInput.addEventListener('input', () => {
      const content = commentInput.value;
      const charCount = content.length;
      
      updateCharCounter(charCounter, charCount);
      
      if (charCount > 0) {
        const validation = validateCommentContent(content);
        if (!validation.valid) {
          charCounter.classList.add('error');
          charCounter.setAttribute('title', validation.message);
        } else {
          charCounter.classList.remove('error');
          charCounter.removeAttribute('title');
        }
      } else {
        charCounter.classList.remove('error');
        charCounter.removeAttribute('title');
      }
    });
    
    newSubmitButton.addEventListener('click', async () => {
      const content = commentInput.value;
      const eventId = getEventIdFromUrl();
      const parentCommentId = commentInput.getAttribute('data-parent-id') || null;
      const commentId = commentInput.getAttribute('data-editing-id') || null;
      
      const rateLimitCheck = commentRateLimit.check();
      if (!rateLimitCheck.allowed) {
        createToast(rateLimitCheck.message, 'warning', { autoDismiss: rateLimitCheck.waitTime });
        return;
      }
      
      const validation = validateCommentContent(content);
      if (!validation.valid) {
        createToast(validation.message, 'error');
        return;
      }
      
      if (!eventId) {
        createToast('Could not determine event ID', 'error');
        return;
      }
      
      const token = getAuthToken();
      if (!token) {
        createToast('Please log in to comment', 'error');
        return;
      }
      
      try {
        if (commentId) {
          await updateComment(commentId, validation.content);
          
          const commentContentElement = document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);
          if (commentContentElement) {
            commentContentElement.innerHTML = sanitizeCommentContent(validation.content);
          } else {
            loadEventComments();
          }
        } else {
          await createComment(eventId, validation.content, parentCommentId);
          
          loadEventComments();
        }
        
        resetCommentForm();
      } catch (error) {
        console.error('Error with comment:', error);
        createToast('Failed to submit comment. Please try again.', 'error');
      }
    });
    
    newCancelButton.addEventListener('click', () => {
      resetCommentForm();
    });
  }

  async function updateComment(commentId, content) {
    const token = getAuthToken();
    if (!token) {
      createToast('Please log in to edit comments', 'error');
      return;
    }
    
    const validation = validateCommentContent(content);
    if (!validation.valid) {
      createToast(validation.message, 'error');
      return;
    }
    
    try {
      const response = await fetch(`/events/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: validation.content
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        createToast('Comment updated successfully', 'success');
        
        const commentContentElement = document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);
        if (commentContentElement) {
          commentContentElement.innerHTML = sanitizeCommentContent(validation.content);
        } else {
          loadEventComments();
        }
        
        return data;
      } else {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update comment');
        } catch (parseError) {
          throw new Error('Failed to update comment: Server error');
        }
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      createToast(error.message || 'Failed to update comment', 'error');
      throw error;
    }
  }

  async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      createToast('Please log in to delete comments', 'error');
      return;
    }
    
    try {
      const response = await fetch(`/events/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        createToast('Comment deleted successfully', 'success');
        
        const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
        if (commentCountElement) {
          const currentCount = parseInt(commentCountElement.textContent) || 0;
          if (currentCount > 0) {
            updateCommentCount(currentCount - 1);
          }
        }
        
        const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
        if (commentElement) {
          commentElement.style.transition = 'opacity 0.3s ease';
          commentElement.style.opacity = '0';
          
          setTimeout(() => {
            commentElement.remove();
            
            const remainingComments = document.querySelectorAll('.comment').length;
            if (remainingComments === 0) {
              const commentsContainer = document.getElementById('comments-container');
              if (commentsContainer) {
                commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
              }
            }
          }, 300);
        } else {
          loadEventComments();
        }
      } else {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete comment');
        } catch (parseError) {
          throw new Error('Failed to delete comment: Server error');
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      createToast(error.message || 'Failed to delete comment', 'error');
    }
  }

  function scrollToCommentFormWithOffset() {
    const commentForm = document.querySelector('.comment-form') || 
                      document.getElementById('comment-input').closest('form');
    
    if (commentForm) {
      scrollToElementWithOffset(commentForm, {
        offsetPercentage: 0.3
      });
    }
  }

  function startEditing(comment) {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('comment-submit-button');
    
    if (!commentInput || !submitButton) return;
    
    commentInput.value = comment.content;
    
    commentInput.setAttribute('data-editing-id', comment.id);
    commentInput.removeAttribute('data-parent-id');
    
    const buttonText = submitButton.querySelector('span');
    if (buttonText) {
      buttonText.textContent = 'Update';
    } else {
      submitButton.textContent = 'Update';
    }
    
    commentInput.focus();
    
    scrollToCommentFormWithOffset();
  }

  function startReply(comment) {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('comment-submit-button');
    const replyIndicator = document.getElementById('reply-indicator') || createReplyIndicator();
    
    if (!commentInput || !submitButton) return;
    
    commentInput.value = '';
    
    commentInput.setAttribute('data-parent-id', comment.id);
    commentInput.removeAttribute('data-editing-id');
    
    const buttonText = submitButton.querySelector('span');
    if (buttonText) {
      buttonText.textContent = 'Reply';
    } else {
      submitButton.textContent = 'Reply';
    }
    
    replyIndicator.style.display = 'flex';
    const authorNameElement = replyIndicator.querySelector('.reply-author-name');
    if (authorNameElement) {
      authorNameElement.textContent = comment.author_username;
    }
    
    commentInput.focus();
    
    scrollToCommentFormWithOffset();
  }

  function createReplyIndicator() {
    const commentForm = document.querySelector('.comment-form');
    const existingIndicator = document.getElementById('reply-indicator');
    
    if (existingIndicator) return existingIndicator;
    
    const replyIndicator = document.createElement('div');
    replyIndicator.id = 'reply-indicator';
    replyIndicator.className = 'reply-indicator';
    replyIndicator.innerHTML = `
      <div class="reply-info">
        <span class="reply-prefix">Replying to</span>
        <span class="reply-author-name"></span>
      </div>
      <button class="cancel-reply-button" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    replyIndicator.querySelector('.cancel-reply-button').addEventListener('click', () => {
      resetCommentForm();
    });
    
    const commentInput = document.getElementById('comment-input');
    if (commentInput && commentInput.parentNode) {
      commentInput.parentNode.insertBefore(replyIndicator, commentInput);
    } else if (commentForm) {
      commentForm.insertBefore(replyIndicator, commentForm.firstChild);
    }
    
    replyIndicator.style.display = 'none';
    
    return replyIndicator;
  }

  function resetCommentForm() {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('comment-submit-button');
    const replyIndicator = document.getElementById('reply-indicator');
    
    if (!commentInput || !submitButton) return;
    
    commentInput.value = '';
    commentInput.removeAttribute('data-editing-id');
    commentInput.removeAttribute('data-parent-id');
    
    const buttonText = submitButton.querySelector('span');
    if (buttonText) {
      buttonText.textContent = 'Comment';
    } else {
      submitButton.textContent = 'Comment';
    }
    
    if (replyIndicator) {
      replyIndicator.style.display = 'none';
    }
  }

  function setupDateRefreshing() {
    setInterval(() => {
      document.querySelectorAll('.comment-time').forEach(timeElement => {
        const dateTime = timeElement.getAttribute('datetime');
        if (dateTime) {
          try {
            const date = new Date(dateTime);
            if (!isNaN(date.getTime())) {
              const formattedDate = formatRelativeDate(date);
              timeElement.textContent = formattedDate;
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
      });
    }, 60000);
  }

  document.addEventListener('DOMContentLoaded', function() {
    loadEventComments();
    
    setupDateRefreshing();
  });

  function createCharCounter() {
    const commentInput = document.getElementById('comment-input');
    if (!commentInput) return null;
    
    const charCounter = document.createElement('div');
    charCounter.id = 'comment-char-counter';
    charCounter.className = 'comment-char-counter';
    charCounter.textContent = '0/500';
    
    if (commentInput.parentNode) {
      commentInput.parentNode.insertBefore(charCounter, commentInput.nextSibling);
    }
    
    return charCounter;
  }

  function updateCharCounter(charCounter, count) {
    if (!charCounter) return;
    
    charCounter.textContent = `${count}/500`;
    
    charCounter.className = 'comment-char-counter';
    
    if (count > 400) {
      charCounter.classList.add('warning');
    } else if (count > 500) {
      charCounter.classList.add('error');
    }
  }

  async function createComment(eventId, content, parentCommentId = null) {
    const token = getAuthToken();
    if (!token) {
      createToast('Please log in to comment', 'error');
      return;
    }
    
    const validation = validateCommentContent(content);
    if (!validation.valid) {
      createToast(validation.message, 'error');
      return;
    }
    
    try {
      const response = await fetch(`/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: validation.content,
          parent_comment_id: parentCommentId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        createToast('Comment posted successfully', 'success', { autoDismiss: 3000 });
        
        const currentCount = parseInt(document.querySelector('.post-stats .stat:first-child span:last-child')?.textContent) || 0;
        updateCommentCount(currentCount + 1);
        
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      createToast(error.message || 'Failed to post comment', 'error');
      throw error;
    }
  }

  function validateCommentContent(content) {
    return validateTextContent(content, {
      minLength: 2,
      maxLength: 500,
      maxUrls: 5,
      maxCapitalization: 0.7,
      maxRepeatingChars: 10
    });
  }

  function sanitizeCommentContent(content) {
    return sanitizeHtml(content);
  }

  const commentRateLimit = new RateLimit({
    interval: 3000,
    message: 'Please wait {time} seconds before submitting another comment'
  });


  export {
    loadEventComments,
    createComment,
    updateComment,
    deleteComment,
    updateCommentCount,
    validateCommentContent,
    sanitizeCommentContent
  };