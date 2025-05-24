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
        document.getElementById('goalsLoading').style.display = 'none';
        document.getElementById('goalsEmpty').style.display = 'block';
        document.getElementById('goalsEmpty').innerHTML = '<p>Failed to load goals. Please try refreshing the page.</p>';
    }
}

// Show authentication prompt
function showAuthPrompt() {
    document.getElementById('authPrompt').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('mainContent').appendChild(document.getElementById('authPrompt'));
    
    // Update auth section in header
    const authSection = document.getElementById('authSection');
    authSection.innerHTML = `
        <button class="btn btn-secondary" onclick="redirectToLogin()">Login</button>
        <button class="btn btn-primary" onclick="redirectToRegister()">Register</button>
    `;
}

// Show dashboard
function showDashboard() {
    document.getElementById('authPrompt').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('mainContent').appendChild(document.getElementById('dashboardContent'));
    
    // Update auth section in header
    const authSection = document.getElementById('authSection');
    const userName = currentUser ? currentUser.name || currentUser.email : 'User';
    authSection.innerHTML = `
        <span class="user-greeting">Hello, ${userName}</span>
        <button class="btn btn-secondary" onclick="logout()">Logout</button>
    `;
}

// Show loading state
function showLoadingState() {
    document.getElementById('goalsLoading').style.display = 'block';
    document.getElementById('goalsEmpty').style.display = 'none';
    document.getElementById('goalsGrid').innerHTML = '';
}

// Render goals
function renderGoals() {
    const goalsGrid = document.getElementById('goalsGrid');
    const goalsLoading = document.getElementById('goalsLoading');
    const goalsEmpty = document.getElementById('goalsEmpty');
    
    goalsLoading.style.display = 'none';
    
    if (!userGoals || userGoals.length === 0) {
        goalsEmpty.style.display = 'block';
        goalsGrid.innerHTML = '';
        return;
    }
    
    goalsEmpty.style.display = 'none';
    
    goalsGrid.innerHTML = userGoals.map(goal => `
        <div class="goal-card" data-goal-id="${goal.id}">
            <div class="goal-card-header">
                <h3 class="goal-card-title">${escapeHtml(goal.title)}</h3>
                <span class="goal-card-category">${escapeHtml(goal.category)}</span>
            </div>
            <p class="goal-card-description">${escapeHtml(goal.description || '')}</p>
            <div class="goal-card-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                </div>
                <span class="progress-text">${goal.progress || 0}%</span>
            </div>
            <div class="goal-card-meta">
                <span class="goal-card-due">Due: ${formatDate(goal.due_date)}</span>
                <span class="goal-card-steps">${goal.completed_steps || 0}/${goal.total_steps} steps</span>
            </div>
            <div class="goal-card-actions">
                <button class="btn btn-small btn-primary" onclick="viewGoal('${goal.id}')">View</button>
                <button class="btn btn-small btn-danger" onclick="deleteGoal('${goal.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update dashboard stats
function updateDashboardStats() {
    if (!userGoals) return;
    
    const totalGoals = userGoals.length;
    const activeGoals = userGoals.filter(goal => goal.status === 'active').length;
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
    
    // Update DOM
    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('goalsSummary').textContent = `${activeGoals} active, ${completedGoals} completed`;
    document.getElementById('overallProgress').textContent = `${overallProgress}%`;
    document.getElementById('monthlyGoals').textContent = monthlyCompleted;
}

// Modal functions
window.openNewGoalModal = function() {
    if (!isAuthenticated()) {
        createToast('Please log in to create goals', 'warning');
        return;
    }
    document.getElementById('newGoalModal').style.display = 'flex';
};

window.closeNewGoalModal = function() {
    document.getElementById('newGoalModal').style.display = 'none';
    document.getElementById('newGoalForm').reset();
};

// Goal management functions
window.viewGoal = function(goalId) {
    // Navigate to goal detail page
    window.location.href = `/goal/${goalId}`;
};

window.deleteGoal = async function(goalId) {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`/planner/delete_goal/${goalId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete goal: ${response.status}`);
        }
        
        createToast('Goal deleted successfully', 'success');
        await loadGoals();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to delete goal:', error);
        createToast('Failed to delete goal. Please try again.', 'error');
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
    
    // Show auth prompt
    showAuthPrompt();
    createToast('Logged out successfully', 'success');
};

// Form submission
document.getElementById('newGoalForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('goalTitle').value,
        description: document.getElementById('goalDescription').value,
        category: document.getElementById('goalCategory').value,
        due_date: document.getElementById('goalDueDate').value,
        total_steps: parseInt(document.getElementById('goalSteps').value),
        user_id: currentUser.id
    };
    
    try {
        const response = await fetchWithAuth('/planner/create_goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create goal: ${response.status}`);
        }
        
        createToast('Goal created successfully!', 'success');
        closeNewGoalModal();
        await loadGoals();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to create goal:', error);
        createToast('Failed to create goal. Please try again.', 'error');
    }
});

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
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