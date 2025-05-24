import {isAuthenticated, redirectToLogin, getUserData } from '/src/js/utils/auth-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const registerButton = document.querySelector('.register-button');
    const logoutButton = document.querySelector('.logout-button');
    const navContainer = document.querySelector('.auth-links');
    
    const avatarColors = ['#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12', '#1abc9c', '#d35400'];
    
    async function handleAuthState() {
        try {
            if (isAuthenticated()) {
                hideLoginElements();
                await createProfileElement();
            } else {
                showLoginElements();
                removeProfileElement();
                
                const requiresAuth = document.body.hasAttribute('data-requires-auth');
                if (requiresAuth) {
                    redirectToLogin();
                }
            }
        } catch (error) {
            console.error('Error handling authentication state:', error);
        }
    }
    
    function hideLoginElements() {
        if (loginButton) loginButton.style.display = 'none';
        if (registerButton) registerButton.style.display = 'none';
    }
    
    function showLoginElements() {
        if (loginButton) loginButton.style.display = 'inline-flex';
        if (registerButton) registerButton.style.display = 'inline-flex';
        if (logoutButton) logoutButton.style.display = 'none';
    }
    
    function removeProfileElement() {
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) profileContainer.remove();
    }
    
    async function createProfileElement() {
        let profileContainer = document.querySelector('.profile-container');
        if (profileContainer || !navContainer) return;
        
        try {
            const userData = await getUserData();
            const username = userData.first_name || 'User';
            const userId = userData.id;
            
            const userInitial = username[0].toUpperCase() || '?';
            
            const bgColor = getAvatarColor(username);
            
            profileContainer = document.createElement('div');
            profileContainer.className = 'profile-container';
            
            profileContainer.innerHTML = createProfileHTML(userId, bgColor, userInitial, username);
            
            navContainer.appendChild(profileContainer);
            
            setupProfileEvents(profileContainer);
            
        } catch (error) {
            console.error('Error creating profile element:', error);
            
            if (error.message && error.message.includes('Authentication expired')) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                showLoginElements();
            }
        }
    }
    
    function getAvatarColor(username) {
        let colorIndex = 0;
        if (username && username.length > 0) {
            colorIndex = Math.abs(username.charCodeAt(0)) % avatarColors.length;
        }
        return avatarColors[colorIndex];
    }
    
    function createProfileHTML(userId, bgColor, userInitial, username) {
        const profileLink = `/auth/profile/${userId}`;
        
        return `
            <a href="${profileLink}" class="profile-link">
                <div class="profile-avatar" style="background-color: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; font-weight: bold; font-size: 16px;">
                    ${userInitial}
                </div>
            </a>
            <div class="profile-dropdown">
                <div class="dropdown-header">
                    <div class="profile-avatar-large" style="background-color: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; font-weight: bold; font-size: 22px; margin-right: 10px;">
                        ${userInitial}
                    </div>
                    <div class="user-info">
                        <div class="username">User</div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="${profileLink}" class="dropdown-item">My Profile</a>
                <a href="/auth/settings" class="dropdown-item">Settings</a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-dropdown-item">Logout</a>
            </div>
        `;
    }
    
    function setupProfileEvents(profileContainer) {
        const profileLinkElement = profileContainer.querySelector('.profile-link');
        if (profileLinkElement) {
            profileLinkElement.addEventListener('click', handleProfileClick);
        }
        
        const logoutDropdownItem = profileContainer.querySelector('.logout-dropdown-item');
        if (logoutDropdownItem) {
            logoutDropdownItem.addEventListener('click', handleLogout);
        }
    }
    
    function handleProfileClick(e) {
        e.preventDefault();
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.classList.toggle('active');
        }
    }
    
    function handleLogout(e) {
        e.preventDefault();
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        showNotification('You have been logged out successfully.');
        
        window.location.reload();
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    handleAuthState();
    
    document.addEventListener('click', function(e) {
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer && !profileContainer.contains(e.target)) {
            profileContainer.classList.remove('active');
        }
    });
});