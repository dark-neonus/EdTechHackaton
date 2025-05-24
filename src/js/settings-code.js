document.addEventListener('DOMContentLoaded', function() {    
    async function loadUserData(retry = 3) {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }
        
        const response = await fetch('/auth/get_user_data', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          if (document.getElementById('first_name')) {
            document.getElementById('first_name').value = userData.first_name || '';
          }
          if (document.getElementById('last_name')) {
            document.getElementById('last_name').value = userData.last_name || '';
          }
          if (document.getElementById('email')) {
            document.getElementById('email').value = userData.email || '';
          }
          if (document.getElementById('bio')) {
            document.getElementById('bio').value = userData.bio || '';
          }
          
          const sidebarUsername = document.getElementById('sidebar-username');
          if (sidebarUsername) {
            sidebarUsername.textContent = `${userData.first_name} ${userData.last_name}`;
          }
          
          if (userData.id) {
            const profileLink = document.getElementById('sidebar-profile-link');
            const activityLink = document.getElementById('sidebar-activity-link');
            const userEventsLink = document.getElementById('user-events-link');

            if (profileLink) {
              profileLink.href = `/auth/profile/${userData.id}`;
            }

            if (activityLink) {
              activityLink.href = `/auth/profile/${userData.id}#activity`;
            }
            
            if (userEventsLink) {
              userEventsLink.href = `/events/user_events/${userData.id}`;
            }
          }
          
          return userData;
        } else {
          console.error("Failed to load user data:", response.status);
          throw new Error('Failed to load user data');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (retry > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return loadUserData(retry - 1);
        } else {
          showNotification('Failed to load user data', 'error');
          return null;
        }
      }
    }
    
    function validateSettingsForm(formData) {
      let isValid = true;
      const errors = {};
      
      document.querySelectorAll('.form-error').forEach(el => el.remove());
      document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));
      
      const firstName = formData.get('first_name').trim();
      if (!firstName) {
        const input = document.getElementById('first_name');
        input.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'First name is required';
        input.parentElement.appendChild(errorEl);
        
        errors.first_name = 'First name is required';
        isValid = false;
      } else if (firstName.length < 2 || firstName.length > 50) {
        const input = document.getElementById('first_name');
        input.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'First name must be between 2 and 50 characters';
        input.parentElement.appendChild(errorEl);
        
        errors.first_name = 'First name must be between 2 and 50 characters';
        isValid = false;
      }
      
      const lastName = formData.get('last_name').trim();
      if (!lastName) {
        const input = document.getElementById('last_name');
        input.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Last name is required';
        input.parentElement.appendChild(errorEl);
        
        errors.last_name = 'Last name is required';
        isValid = false;
      } else if (lastName.length < 2 || lastName.length > 50) {
        const input = document.getElementById('last_name');
        input.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Last name must be between 2 and 50 characters';
        input.parentElement.appendChild(errorEl);
        
        errors.last_name = 'Last name must be between 2 and 50 characters';
        isValid = false;
      }
      
      const email = formData.get('email').trim();
      const emailInput = document.getElementById('email');
      if (!email) {
        emailInput.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Email is required';
        emailInput.parentElement.appendChild(errorEl);
        
        errors.email = 'Email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Please enter a valid email address';
        emailInput.parentElement.appendChild(errorEl);
        
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }

      const bio = formData.get('bio').trim();
      if (bio && bio.length > 500) {
        const input = document.getElementById('bio');
        input.classList.add('form-input-error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Bio must be less than 500 characters';
        input.parentElement.appendChild(errorEl);
        
        errors.bio = 'Bio must be less than 500 characters';
        isValid = false;
      }
      
      if (formData.get('current_password') || formData.get('new_password') || formData.get('confirm_password')) {
        if (!formData.get('current_password')) {
          const input = document.getElementById('current_password');
          input.classList.add('form-input-error');
          
          const errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          errorEl.textContent = 'Current password is required';
          input.parentElement.appendChild(errorEl);
          
          errors.current_password = 'Current password is required';
          isValid = false;
        }
        
        const newPassword = formData.get('new_password');
        if (!newPassword) {
          const input = document.getElementById('new_password');
          input.classList.add('form-input-error');
          
          const errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          errorEl.textContent = 'New password is required';
          input.parentElement.appendChild(errorEl);
          
          errors.new_password = 'New password is required';
          isValid = false;
        } else {
          const hasMinLength = newPassword.length >= 8;
          const hasUppercase = /[A-Z]/.test(newPassword);
          const hasLowercase = /[a-z]/.test(newPassword);
          const hasNumbers = /[0-9]/.test(newPassword);
          
          if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumbers) {
            const input = document.getElementById('new_password');
            input.classList.add('form-input-error');
            
            const errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            errorEl.textContent = 'Password must be at least 8 characters and include uppercase, lowercase, and numbers';
            input.parentElement.appendChild(errorEl);
            
            errors.new_password = 'Password requirements not met';
            isValid = false;
          }
        }
        
        if (!formData.get('confirm_password')) {
          const input = document.getElementById('confirm_password');
          input.classList.add('form-input-error');
          
          const errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          errorEl.textContent = 'Please confirm your password';
          input.parentElement.appendChild(errorEl);
          
          errors.confirm_password = 'Please confirm your password';
          isValid = false;
        } else if (formData.get('new_password') !== formData.get('confirm_password')) {
          const input = document.getElementById('confirm_password');
          input.classList.add('form-input-error');
          
          const errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          errorEl.textContent = 'Passwords do not match';
          input.parentElement.appendChild(errorEl);
          
          errors.confirm_password = 'Passwords do not match';
          isValid = false;
        }
      }
      
      if (!isValid) {
        const firstErrorField = document.querySelector('.form-input-error');
        if (firstErrorField) {
          firstErrorField.focus();
        }
      }
      
      return { isValid, errors };
    }
    
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        const { isValid, errors } = validateSettingsForm(formData);
        
        if (!isValid) {
          showNotification('Please correct the errors in the form', 'error');
          return;
        }
        
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            window.location.href = '/auth/login';
            return;
          }
          
          const userData = {
            first_name: formData.get('first_name').trim(),
            last_name: formData.get('last_name').trim(),
            email: formData.get('email').trim(),
            bio: formData.get('bio').trim()
          };
                    
          if (formData.get('current_password') && formData.get('new_password')) {
            userData.current_password = formData.get('current_password');
            userData.new_password = formData.get('new_password');
          }
          
          const submitButton = settingsForm.querySelector('button[type="submit"]');
          const originalButtonText = submitButton.innerHTML;
          submitButton.disabled = true;
          submitButton.innerHTML = '<span class="spinner"></span> Saving...';
          
          const updateResponse = await fetch('/auth/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
          });
          
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
                    
          if (updateResponse.ok) {
            showNotification('Settings updated successfully', 'success');
            
            document.getElementById('current_password').value = '';
            document.getElementById('new_password').value = '';
            document.getElementById('confirm_password').value = '';
            
            await loadUserData();
          } else {
            const errorData = await updateResponse.json();
            console.error("Update failed:", errorData);
            throw new Error(errorData.detail || 'Failed to update settings');
          }
        } catch (error) {
          console.error('Error updating settings:', error);
          showNotification(`Failed to update settings: ${error.message}`, 'error');
        }
      });
      
      const formInputs = settingsForm.querySelectorAll('input, textarea');
      formInputs.forEach(input => {
        input.addEventListener('input', function() {
          this.classList.remove('form-input-error');
          const errorEl = this.parentElement.querySelector('.form-error');
          if (errorEl) errorEl.remove();
        });
      });
    } else {
      console.error("Settings form element not found");
    }
    
    const avatarUpload = document.getElementById('avatar_upload');
    if (avatarUpload) {
      avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            showNotification('File size exceeds 2MB limit', 'error');
            return;
          }
          
          const reader = new FileReader();
          reader.onload = function(event) {
            const currentAvatar = document.getElementById('current-avatar');
            if (currentAvatar) {
              currentAvatar.style.backgroundImage = `url(${event.target.result})`;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    const removeAvatar = document.getElementById('remove_avatar');
    if (removeAvatar) {
      removeAvatar.addEventListener('click', function() {
        const currentAvatar = document.getElementById('current-avatar');
        const avatarUpload = document.getElementById('avatar_upload');
        if (currentAvatar) currentAvatar.style.backgroundImage = '';
        if (avatarUpload) avatarUpload.value = '';
      });
    }
    
    const deleteAccountBtn = document.getElementById('delete_account');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', function() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
          modal.style.display = 'flex';
        } else {
          console.error("Confirmation modal not found");
        }
      });
    } else {
      console.error("Delete account button not found");
    }
    
    document.querySelectorAll('.close-modal').forEach(button => {
      button.addEventListener('click', function() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
          modal.style.display = 'none';
          const deleteConfirmation = document.getElementById('delete_confirmation');
          if (deleteConfirmation) {
            deleteConfirmation.value = '';
          }
          const confirmDeleteBtn = document.getElementById('confirm_delete');
          if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = true;
          }
        }
      });
    });
    
    const deleteConfirmationInput = document.getElementById('delete_confirmation');
    if (deleteConfirmationInput) {
      deleteConfirmationInput.addEventListener('input', function(e) {
        const confirmDeleteBtn = document.getElementById('confirm_delete');
        if (confirmDeleteBtn) {
          confirmDeleteBtn.disabled = e.target.value !== 'DELETE';
        }
      });
    } else {
      console.error("Delete confirmation input not found");
    }
    
    const confirmDeleteBtn = document.getElementById('confirm_delete');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async function() {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            window.location.href = '/auth/login';
            return;
          }
          
          confirmDeleteBtn.disabled = true;
          confirmDeleteBtn.innerHTML = '<span class="spinner"></span> Deleting...';
          
          const response = await fetch('/auth/delete_account', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = 'Permanently Delete Account';
                    
          if (response.ok) {
            localStorage.removeItem('access_token');
            showNotification('Account successfully deleted', 'success');
            
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            const errorData = await response.json();
            console.error("Delete failed:", errorData);
            throw new Error(errorData.detail || 'Failed to delete account');
          }
        } catch (error) {
          console.error('Error deleting account:', error);
          showNotification(`Failed to delete account: ${error.message}`, 'error');
        }
      });
    } else {
      console.error("Confirm delete button not found");
    }
    
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }
        
    setTimeout(() => {
      loadUserData();
    }, 100);
  });