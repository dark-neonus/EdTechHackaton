import { formatEventDates } from './utils/post-format-utils.js';
import { getUserId } from './utils/auth-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.profile-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    function toggleSidebar() {
      sidebar.classList.toggle('active');
      sidebarToggle.classList.toggle('active');
      overlay.classList.toggle('active');
      
      if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (overlay) {
      overlay.addEventListener('click', toggleSidebar);
    }
    
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    function toggleMobileMenu() {
      mobileMenuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    }
    
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        const tabId = `${button.getAttribute('data-tab')}-tab`;
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });

    checkSettingsLinkVisibility();
    
    formatEventDates();
});

async function checkSettingsLinkVisibility() {
    try {
        const pathParts = window.location.pathname.split('/');
        const profileUserId = pathParts[pathParts.length - 1];
        
        const scriptTags = document.querySelectorAll('script[type="module"]');
        let isOwnProfile = false;
        
        for (const script of scriptTags) {
            if (script.src.includes('profile-edit.js')) {
                isOwnProfile = true;
                break;
            }
        }
        
        if (!isOwnProfile) {
            try {
                const currentUserId = await getUserId();
                isOwnProfile = String(currentUserId) === String(profileUserId);
            } catch (error) {
                console.error('Error getting current user ID:', error);
                isOwnProfile = false;
            }
        }
        
        if (!isOwnProfile) {
            const settingsLink = document.querySelector('.sidebar-nav-item[href="/auth/settings"]');
            if (settingsLink) {
                settingsLink.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking profile ownership:', error);
    }
}