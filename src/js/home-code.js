// Import authentication utilities
import { 
    isAuthenticated, 
    getUserData, 
    redirectToLogin, 
    setupServerReconnection,
    fetchWithAuth 
} from '/src/js/utils/auth-utils.js';

import { createToast } from '/src/js/utils/toast-utils.js';

// Global variables
let currentUser = null;
let userGoals = [];

// Initialize the application
async function initApp() {
    try {
        // Setup server reconnection monitoring
        setupServerReconnection();
        
        // Check authentication status
        if (isAuthenticated()) {
            await loadUserData();
            showDashboard();
        } else {
            showAuthPrompt();
        }
    } catch (error) {
        console.error('App initialization failed:', error);
        showAuthPrompt();
    }
}

// Load user data and goals
async function loadUserData() {
    try {
        // Show loading state
        showLoadingState();
        
        // Get user data
        currentUser = await getUserData();
        
        // Load user goals
        await loadGoals();
        
        // Update dashboard stats
        updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to load user data:', error);
        createToast('Failed to load user data. Please try refreshing the page.', 'error');
        showAuthPrompt();
    }
}

// Load goals from backend
async function loadGoals() {
    try {
        const response = await fetchWithAuth('/planner/get_goals');

        if (!response.ok) {
            throw new Error(`Failed to fetch goals: ${response.status}`);
        }
        
        userGoals = await response.json();
        renderGoals();
        
    } catch (error) {
        console.error('Failed to load goals:', error);
        const goalsLoading = document.getElementById('goalsLoading');
        const goalsEmpty = document.getElementById('goalsEmpty');
        
        if (goalsLoading) goalsLoading.style.display = 'none';
        if (goalsEmpty) {
            goalsEmpty.style.display = 'block';
            goalsEmpty.innerHTML = '<p>Failed to load goals. Please try refreshing the page.</p>';
        }
    }
}

// Show authentication prompt
function showAuthPrompt() {
    const authPrompt = document.getElementById('authPrompt');
    const dashboardContent = document.getElementById('dashboardContent');
    const mainContent = document.getElementById('mainContent');
    
    if (authPrompt) authPrompt.style.display = 'block';
    if (dashboardContent) dashboardContent.style.display = 'none';
    if (mainContent && authPrompt) mainContent.appendChild(authPrompt);
    
    // Update auth section in header
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.innerHTML = `
            <button class="btn btn-secondary" onclick="redirectToLogin()">Login</button>
            <button class="btn btn-primary" onclick="redirectToRegister()">Register</button>
        `;
    }
}

// Show dashboard
function showDashboard() {
    const authPrompt = document.getElementById('authPrompt');
    const dashboardContent = document.getElementById('dashboardContent');
    const mainContent = document.getElementById('mainContent');
    
    if (authPrompt) authPrompt.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'block';
    if (mainContent && dashboardContent) mainContent.appendChild(dashboardContent);
    
    // Update auth section in header
    const authSection = document.getElementById('authSection');
    if (authSection && currentUser) {
        const userName = currentUser.name || currentUser.email || 'User';
        authSection.innerHTML = `
            <span class="user-greeting">Hello, ${escapeHtml(userName)}</span>
            <button class="btn btn-secondary" onclick="logout()">Logout</button>
        `;
    }
}

// Show loading state
function showLoadingState() {
    const goalsLoading = document.getElementById('goalsLoading');
    const goalsEmpty = document.getElementById('goalsEmpty');
    const goalsGrid = document.getElementById('goalsGrid');
    
    if (goalsLoading) goalsLoading.style.display = 'block';
    if (goalsEmpty) goalsEmpty.style.display = 'none';
    if (goalsGrid) goalsGrid.innerHTML = '';
}

// Render goals
function renderGoals() {
    const goalsGrid = document.getElementById('goalsGrid');
    const goalsLoading = document.getElementById('goalsLoading');
    const goalsEmpty = document.getElementById('goalsEmpty');
    
    if (goalsLoading) goalsLoading.style.display = 'none';
    
    if (!userGoals || userGoals.length === 0) {
        if (goalsEmpty) goalsEmpty.style.display = 'block';
        if (goalsGrid) goalsGrid.innerHTML = '';
        return;
    }
    
    if (goalsEmpty) goalsEmpty.style.display = 'none';
    
    if (goalsGrid) {
        goalsGrid.innerHTML = userGoals.map(goal => `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div class="goal-card-header">
                    <h3 class="goal-card-title">${escapeHtml(goal.title)}</h3>
                    <span class="goal-card-category">${escapeHtml(goal.category || 'Uncategorized')}</span>
                </div>
                <p class="goal-card-description">${escapeHtml(goal.description || 'No description')}</p>
                <div class="goal-card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                    </div>
                    <span class="progress-text">${goal.progress || 0}%</span>
                </div>
                <div class="goal-card-meta">
                    <span class="goal-card-due">Due: ${formatDate(goal.due_date)}</span>
                    <span class="goal-card-status status-${(goal.status || 'active').toLowerCase()}">${goal.status || 'Active'}</span>
                </div>
                <div class="goal-card-actions">
                    <button class="btn btn-small btn-primary" onclick="viewGoal('${goal.id}')">View</button>
                    <button class="btn btn-small btn-secondary" onclick="editGoal('${goal.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteGoal('${goal.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }
}

// Update dashboard stats
function updateDashboardStats() {
    if (!userGoals) return;
    
    const totalGoals = userGoals.length;
    const activeGoals = userGoals.filter(goal => (goal.status || 'active') === 'active').length;
    const completedGoals = userGoals.filter(goal => goal.status === 'completed').length;
    
    // Calculate overall progress
    let overallProgress = 0;
    if (totalGoals > 0) {
        const totalProgress = userGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0);
        overallProgress = Math.round(totalProgress / totalGoals);
    }
    
    // Calculate monthly completed goals
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCompleted = userGoals.filter(goal => {
        if (goal.status !== 'completed' || !goal.completed_date) return false;
        const completedDate = new Date(goal.completed_date);
        return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
    }).length;
    
    // Update DOM elements if they exist
    const totalGoalsEl = document.getElementById('totalGoals');
    const goalsSummaryEl = document.getElementById('goalsSummary');
    const overallProgressEl = document.getElementById('overallProgress');
    const monthlyGoalsEl = document.getElementById('monthlyGoals');
    
    if (totalGoalsEl) totalGoalsEl.textContent = totalGoals;
    if (goalsSummaryEl) goalsSummaryEl.textContent = `${activeGoals} active, ${completedGoals} completed`;
    if (overallProgressEl) overallProgressEl.textContent = `${overallProgress}%`;
    if (monthlyGoalsEl) monthlyGoalsEl.textContent = monthlyCompleted;
}

// Modal functions
window.openNewGoalModal = function() {
    if (!isAuthenticated()) {
        createToast('Please log in to create goals', 'warning');
        return;
    }
    const modal = document.getElementById('newGoalModal');
    if (modal) modal.style.display = 'flex';
};

window.closeNewGoalModal = function() {
    const modal = document.getElementById('newGoalModal');
    const form = document.getElementById('newGoalForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
};

// Goal management functions
window.viewGoal = function(goalId) {
    if (!goalId) {
        createToast('Invalid goal ID', 'error');
        return;
    }
    
    // Navigate to goal detail page with proper URL structure
    window.location.href = `/planner/goal/${goalId}`;
};

window.editGoal = function(goalId) {
    // TODO: Implement edit goal functionality
    createToast('Edit goal functionality coming soon!', 'info');
};

window.deleteGoal = async function(goalId) {
    if (!goalId) {
        createToast('Invalid goal ID', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`/planner/delete_goal/${goalId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to delete goal: ${response.status}`);
        }
        
        createToast('Goal deleted successfully', 'success');
        await loadGoals();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to delete goal:', error);
        createToast(`Failed to delete goal: ${error.message}`, 'error');
    }
};

// Auth functions
window.redirectToLogin = function() {
    window.location.href = '/auth/login';
};

window.redirectToRegister = function() {
    window.location.href = '/auth/register';
};

window.logout = function() {
    // Clear auth tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Reset state
    currentUser = null;
    userGoals = [];
    
    // Show auth prompt
    showAuthPrompt();
    createToast('Logged out successfully', 'success');
};

// Form submission
const newGoalForm = document.getElementById('newGoalForm');
if (newGoalForm) {
    newGoalForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            createToast('Please log in to create goals', 'error');
            return;
        }
        
        const formData = {
            title: document.getElementById('goalTitle')?.value?.trim() || '',
            description: document.getElementById('goalDescription')?.value?.trim() || '',
            category: document.getElementById('goalCategory')?.value?.trim() || 'General',
            due_date: document.getElementById('goalDueDate')?.value || null,
            user_id: currentUser.id
        };
        
        // Validate required fields
        if (!formData.title) {
            createToast('Goal title is required', 'warning');
            return;
        }
        
        try {
            const response = await fetchWithAuth('/planner/create_goal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Failed to create goal: ${response.status}`);
            }
            
            const newGoal = await response.json();
            createToast('Goal created successfully!', 'success');
            closeNewGoalModal();
            
            // Add to local array and re-render
            userGoals.push(newGoal);
            renderGoals();
            updateDashboardStats();
            
        } catch (error) {
            console.error('Failed to create goal:', error);
            createToast(`Failed to create goal: ${error.message}`, 'error');
        }
    });
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'No date set';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return 'Invalid date';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('newGoalModal');
    if (event.target === modal) {
        closeNewGoalModal();
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make functions available globally
window.initApp = initApp;