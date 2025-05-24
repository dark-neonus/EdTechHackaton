import { getUserId, getAuthToken, isAuthenticated, redirectToLogin } from '/src/js/utils/auth-utils.js';
import { adjustUserEventsLink } from './user-events-link.js';
import { createToast } from '/src/js/utils/toast-utils.js';


document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    createToast('You must be logged in to create an event.', 'error');
    setTimeout(() => {
      redirectToLogin();
    }, 2000);
    return;
  }

  adjustUserEventsLink(); 

  try {
    const userId = await getUserId();
    const token = getAuthToken();

    const categoriesResponse = await fetch('/events/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!categoriesResponse.ok) {
      throw new Error('Failed to fetch event categories');
    }

    const categories = await categoriesResponse.json();

    const categorySelect = document.getElementById('event-category');
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      categorySelect.appendChild(option);
    });

    setupInputValidation();

    setupImageUpload(token);

    const formButton = document.querySelector('.button-primary');

formButton.addEventListener('click', async (e) => {
  e.preventDefault();

  clearValidationErrors();

  const title = document.querySelector('.form-input').value.trim();
  const description = document.querySelector('.form-textarea').value.trim();
  const dateTimeInput = document.getElementById('event-date').value;
  const location = document.getElementById('event-location').value.trim();
  const category = categorySelect.value;
  const imageCaption = document.getElementById('image-caption') ? document.getElementById('image-caption').value.trim() : '';
  const imageInput = document.getElementById('image-upload');

  let isValid = true;

  if (!title) {
    displayError(document.querySelector('.form-input'), 'Event title is required');
    isValid = false;
  } else if (title.length < 5) {
    displayError(document.querySelector('.form-input'), 'Title must be at least 5 characters long');
    isValid = false;
  } else if (title.length > 150) {
    displayError(document.querySelector('.form-input'), 'Title cannot exceed 150 characters');
    isValid = false;
  }

  if (!description) {
    displayError(document.querySelector('.form-textarea'), 'Event description is required');
    isValid = false;
  } else if (description.length < 20) {
    displayError(document.querySelector('.form-textarea'), 'Description must be at least 20 characters long');
    isValid = false;
  } else if (description.length > 1000) {
    displayError(document.querySelector('.form-textarea'), 'Description cannot exceed 1000 characters');
    isValid = false;
  }

  if (!dateTimeInput) {
    displayError(document.getElementById('event-date'), 'Event date and time are required');
    isValid = false;
  } else {
    const selectedDateTime = new Date(dateTimeInput);
    const currentDateTime = new Date();
    
    if (isNaN(selectedDateTime.getTime())) {
      displayError(document.getElementById('event-date'), 'Please enter a valid date and time');
      isValid = false;
    } else if (selectedDateTime < currentDateTime) {
      displayError(document.getElementById('event-date'), 'Event cannot be scheduled in the past');
      isValid = false;
    } 
    else if (selectedDateTime > new Date(currentDateTime.getFullYear() + 2, currentDateTime.getMonth(), currentDateTime.getDate())) {
      displayError(document.getElementById('event-date'), 'Event cannot be scheduled more than 2 years in advance');
      isValid = false;
    }
  }

  if (!location) {
    displayError(document.getElementById('event-location'), 'Event location is required');
    isValid = false;
  } else if (location.length < 3) {
    displayError(document.getElementById('event-location'), 'Location must be at least 3 characters long');
    isValid = false;
  } else if (location.length > 255) {
    displayError(document.getElementById('event-location'), 'Location cannot exceed 255 characters');
    isValid = false;
  }

  if (!category) {
    displayError(categorySelect, 'Please select an event category');
    isValid = false;
  } else {
    const validCategories = categories.map(cat => cat.toLowerCase());
    if (!validCategories.includes(category.toLowerCase())) {
      displayError(categorySelect, 'Please select a valid category');
      isValid = false;
    }
  }

  if (imageInput && imageInput.files && imageInput.files.length > 0 && imageCaption.length > 255) {
    const captionInput = document.getElementById('image-caption');
    displayError(captionInput, 'Image caption cannot exceed 255 characters');
    isValid = false;
  }

  if (!isValid) {
    const firstError = document.querySelector('.form-input-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
    return;
  }

  const dateScheduled = dateTimeInput ? new Date(dateTimeInput).toISOString() : '';

  try {
    const submitButton = formButton;
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke-dasharray="32" stroke-dashoffset="0"></circle>
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
      </svg>
      Processing...
    `;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date_scheduled', dateScheduled);
    formData.append('location', location);
    formData.append('category', category);
    formData.append('author_id', userId);
    
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      formData.append('image_file', imageInput.files[0]);
      
      if (imageCaption) {
        formData.append('image_caption', imageCaption);
      }
    }

    const createResponse = await fetch('/events/create_event', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.detail || 'Failed to create event');
    }

    createToast('Event created successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = '/events';
    }, 2000);
  } catch (error) {
    console.error('Error creating event:', error);
    createToast(`An error occurred: ${error.message}`, 'error');
  }
});

  } catch (error) {
    console.error('Error in event creation setup:', error);
    createToast('An error occurred. Please log in again.', 'error');
  }
});

function setupImageUpload(token) {
  const addImageButton = document.querySelector('.button-secondary');
  if (!addImageButton) return;
  
  const uploadWrapper = document.createElement('div');
  uploadWrapper.className = 'upload-button-wrapper';
  uploadWrapper.style.position = 'relative';
  
  addImageButton.parentNode.replaceChild(uploadWrapper, addImageButton);
  uploadWrapper.appendChild(addImageButton);
  
  if (!document.getElementById('image-upload')) {
    const imageUploadContainer = document.createElement('div');
    imageUploadContainer.className = 'form-field image-upload-container';
    imageUploadContainer.style.display = 'none';
    imageUploadContainer.style.marginTop = '10px';
    
    const uploadControlsRow = document.createElement('div');
    uploadControlsRow.className = 'upload-controls-row';
    uploadControlsRow.style.display = 'flex';
    uploadControlsRow.style.alignItems = 'center';
    uploadControlsRow.style.gap = '10px';
    uploadControlsRow.style.marginBottom = '10px';
    
    const fileInputContainer = document.createElement('div');
    fileInputContainer.className = 'file-input-container';
    fileInputContainer.style.flexGrow = '1';
    
    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.id = 'image-upload';
    imageUpload.className = 'form-input';
    imageUpload.accept = 'image/jpeg,image/png,image/gif,image/jpg';
    
    const imagePreview = document.createElement('div');
    imagePreview.id = 'image-preview';
    imagePreview.className = 'image-preview';
    imagePreview.style.maxWidth = '120px';
    imagePreview.style.minWidth = '60px';
    
    const captionContainer = document.createElement('div');
    captionContainer.className = 'form-field caption-field';
    captionContainer.style.display = 'none';
    captionContainer.style.marginTop = '5px';
    
    const captionInput = document.createElement('input');
    captionInput.type = 'text';
    captionInput.id = 'image-caption';
    captionInput.className = 'form-input';
    captionInput.placeholder = 'Image caption (optional)';
    
    fileInputContainer.appendChild(imageUpload);
    uploadControlsRow.appendChild(fileInputContainer);
    uploadControlsRow.appendChild(imagePreview);
    
    imageUploadContainer.appendChild(uploadControlsRow);
    captionContainer.appendChild(captionInput);
    imageUploadContainer.appendChild(captionContainer);
    
    uploadWrapper.appendChild(imageUploadContainer);
    
    imageUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) {
        imagePreview.innerHTML = '';
        captionContainer.style.display = 'none';
        return;
      }
      
      captionContainer.style.display = 'block';
      
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        createToast('Image size must be less than 5MB', 'error');
        imageUpload.value = '';
        imagePreview.innerHTML = '';
        captionContainer.style.display = 'none';
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        createToast('Only JPG, PNG, and GIF images are allowed', 'error');
        imageUpload.value = '';
        imagePreview.innerHTML = '';
        captionContainer.style.display = 'none';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        imagePreview.innerHTML = `
          <div class="preview-container" style="position: relative; width: 60px; height: 60px;">
            <img src="${event.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
            <button type="button" class="remove-image" style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; border-radius: 50%; background: #ff4d4d; color: white; border: none; font-size: 14px; line-height: 1; cursor: pointer; padding: 0;" title="Remove image">×</button>
          </div>
        `;
        
        const removeButton = imagePreview.querySelector('.remove-image');
        removeButton.addEventListener('click', function(e) {
          e.stopPropagation();
          imageUpload.value = '';
          imagePreview.innerHTML = '';
          captionInput.value = '';
          captionContainer.style.display = 'none';
        });
      };
      reader.readAsDataURL(file);
    });
  }
  
  addImageButton.addEventListener('click', function(e) {
    e.preventDefault();
    const imageUploadContainer = document.querySelector('.image-upload-container');
    
    if (imageUploadContainer.style.display === 'none') {
      imageUploadContainer.style.display = 'block';
      addImageButton.textContent = 'Cancel';
    } else {
      imageUploadContainer.style.display = 'none';
      document.getElementById('image-preview').innerHTML = '';
      document.getElementById('image-upload').value = '';
      
      const captionInput = document.getElementById('image-caption');
      const captionContainer = document.querySelector('.caption-field');
      
      if (captionInput) captionInput.value = '';
      if (captionContainer) captionContainer.style.display = 'none';
      
      addImageButton.textContent = 'Add Event Image';
    }
  });
}

function setupInputValidation() {
  const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select, input[type="date"]');
  formInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('form-input-error');
      const errorEl = this.parentElement.querySelector('.form-error');
      if (errorEl) {
        errorEl.remove();
      }
    });
    
    input.addEventListener('focus', function() {
      this.classList.remove('form-input-error');
    });
  });
}

function clearValidationErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.remove());
  document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));
}

function displayError(inputElement, errorMessage) {
  inputElement.classList.add('form-input-error', 'shake-animation');
  
  setTimeout(() => {
    inputElement.classList.remove('shake-animation');
  }, 500);
  
  let errorEl = inputElement.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    inputElement.parentElement.appendChild(errorEl);
  }
  
  errorEl.textContent = errorMessage;
}