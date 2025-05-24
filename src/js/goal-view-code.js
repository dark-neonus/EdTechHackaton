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
let currentGoal = null;
let goalTasks = [];
let goalId = null;

// Get goal ID from URL
function getGoalIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const goalIndex = pathParts.indexOf('goal');
    if (goalIndex !== -1 && pathParts[goalIndex + 1]) {
        return pathParts[goalIndex + 1];
    }
    return null;
}

// Initialize the application
async function initApp() {
    try {
        // Setup server reconnection monitoring
        setupServerReconnection();
        
        // Get goal ID from URL
        goalId = getGoalIdFromUrl();
        if (!goalId) {
            createToast('Invalid goal ID', 'error');
            window.location.href = '/planner';
            return;
        }
        
        // Check authentication status
        if (!isAuthenticated()) {
            redirectToLogin();
            return;
        }
        
        // Load user data and goal details
        await loadUserData();
        await loadGoalDetails();
        await loadGoalTasks();
        
    } catch (error) {
        console.error('App initialization failed:', error);
        createToast('Failed to load goal details', 'error');
        setTimeout(() => {
            window.location.href = '/planner';
        }, 2000);
    }
}

// Load user data
async function loadUserData() {
    try {
        currentUser = await getUserData();
    } catch (error) {
        console.error('Failed to load user data:', error);
        redirectToLogin();
    }
}

// Load goal details
async function loadGoalDetails() {
    try {
        const response = await fetchWithAuth(`/planner/api/goal/${goalId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Goal not found');
            }
            throw new Error(`Failed to fetch goal: ${response.status}`);
        }
        
        currentGoal = await response.json();
        renderGoalHeader();
        
    } catch (error) {
        console.error('Failed to load goal details:', error);
        createToast(`Failed to load goal: ${error.message}`, 'error');
        
        const goalHeader = document.getElementById('goalHeader');
        if (goalHeader) {
            goalHeader.innerHTML = `
                <div class="error-state">
                    <p>Failed to load goal details</p>
                    <button class="btn btn-primary" onclick="loadGoalDetails()">Retry</button>
                </div>
            `;
        }
    }
}

// Load goal tasks
async function loadGoalTasks() {
    try {
        const response = await fetchWithAuth(`/planner/goal/${goalId}/tasks`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.status}`);
        }
        
        goalTasks = await response.json();
        renderTasksSection();
        renderProgressSection(); // Render progress after loading tasks
        
    } catch (error) {
        console.error('Failed to load tasks:', error);
        createToast('Failed to load tasks', 'error');
        
        const tasksSection = document.getElementById('tasksSection');
        if (tasksSection) {
            tasksSection.innerHTML = `
                <div class="error-state">
                    <p>Failed to load tasks</p>
                    <button class="btn btn-primary" onclick="loadGoalTasks()">Retry</button>
                </div>
            `;
        }
    }
}

// Render goal header
function renderGoalHeader() {
    const goalHeader = document.getElementById('goalHeader');
    if (!goalHeader || !currentGoal) return;
    
    goalHeader.className = 'goal-header-content';
    goalHeader.innerHTML = `
        <div class="goal-title-section">
            <h1 class="goal-title">${escapeHtml(currentGoal.title)}</h1>
            <div class="goal-meta">
                <span class="goal-category">${escapeHtml(currentGoal.category || 'Uncategorized')}</span>
                <span class="goal-status status-${(currentGoal.status || 'active').toLowerCase()}">
                    ${currentGoal.status || 'Active'}
                </span>
            </div>
        </div>
        
        <div class="goal-actions">
            <button class="btn btn-secondary" onclick="editGoal()">Edit Goal</button>
            <button class="btn btn-danger" onclick="deleteGoal()">Delete Goal</button>
        </div>
    `;
}

// Render progress section
function renderProgressSection() {
    const progressSection = document.getElementById('progressSection');
    if (!progressSection || !currentGoal) return;
    
    const completedTasks = goalTasks.filter(task => task.completed).length;
    const totalTasks = goalTasks.length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    progressSection.className = 'progress-content';
    progressSection.innerHTML = `
        <div class="progress-grid">
            <div class="progress-card">
                <div class="progress-card-header">
                    <h3>Overall Progress</h3>
                    <span class="progress-percentage">${currentGoal.progress || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${currentGoal.progress || 0}%"></div>
                </div>
            </div>
            
            <div class="progress-card">
                <div class="progress-card-header">
                    <h3>Tasks Progress</h3>
                    <span class="progress-percentage">${taskProgress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${taskProgress}%"></div>
                </div>
                <div class="progress-details">
                    ${completedTasks} of ${totalTasks} tasks completed
                </div>
            </div>
            
            <div class="progress-card">
                <div class="progress-card-header">
                    <h3>Due Date</h3>
                </div>
                <div class="due-date">
                    ${currentGoal.due_date ? formatDate(currentGoal.due_date) : 'No due date set'}
                </div>
            </div>
        </div>
        
        ${currentGoal.description ? `
            <div class="goal-description">
                <h3>Description</h3>
                <p>${escapeHtml(currentGoal.description)}</p>
            </div>
        ` : ''}
    `;
}

// Render tasks section
function renderTasksSection() {
    const tasksSection = document.getElementById('tasksSection');
    if (!tasksSection) return;
    
    if (!goalTasks || goalTasks.length === 0) {
        tasksSection.className = 'empty-tasks';
        tasksSection.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No tasks yet</h3>
                <p>Break down your goal into actionable tasks to track your progress.</p>
                <button class="btn btn-primary" onclick="openAddTaskModal()">Add Your First Task</button>
            </div>
        `;
        return;
    }
    
    tasksSection.className = 'tasks-content';
    tasksSection.innerHTML = `
        <div class="tasks-grid">
            ${goalTasks.map(task => `
                <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-checkbox">
                            <input type="checkbox" 
                                id="task-${task.id}" 
                                ${task.completed ? 'checked' : ''}
                                onchange="toggleTask('${task.id}', this.checked)">
                            <label for="task-${task.id}"></label>
                        </div>
                        <h4 class="task-title">${escapeHtml(task.title)}</h4>
                        <button class="task-delete" onclick="deleteTask('${task.id}')" title="Delete task">×</button>
                    </div>
                    
                    <div class="task-meta">
                        ${task.due_date ? `
                            <span class="task-due-date">Due: ${formatDate(task.due_date)}</span>
                        ` : ''}
                        
                        ${task.completed && task.completed_date ? `
                            <span class="task-completed-date">Completed: ${formatDate(task.completed_date)}</span>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Modal functions
function openAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) modal.style.display = 'flex';
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    const form = document.getElementById('addTaskForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

// Task management functions
async function toggleTask(taskId, completed) {
    try {
        const response = await fetchWithAuth(`/planner/task/${taskId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        
        const updatedTask = await response.json();
        
        // Update local data
        const taskIndex = goalTasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            goalTasks[taskIndex] = updatedTask;
        }
        
        // Update UI
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
            if (completed) {
                taskCard.classList.add('completed');
            } else {
                taskCard.classList.remove('completed');
            }
        }
        
        // Update progress
        renderProgressSection();
        
        createToast(completed ? 'Task completed!' : 'Task marked as incomplete', 'success');
        
    } catch (error) {
        console.error('Failed to toggle task:', error);
        createToast('Failed to update task', 'error');
        
        // Revert checkbox state
        const checkbox = document.getElementById(`task-${taskId}`);
        if (checkbox) checkbox.checked = !completed;
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetchWithAuth(`/planner/delete_task/${taskId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        
        // Remove from local data
        goalTasks = goalTasks.filter(task => task.id !== taskId);
        
        // Re-render
        renderTasksSection();
        renderProgressSection();
        
        createToast('Task deleted successfully', 'success');
        
    } catch (error) {
        console.error('Failed to delete task:', error);
        createToast('Failed to delete task', 'error');
    }
}

// Goal management functions
function editGoal() {
    createToast('Edit goal functionality coming soon!', 'info');
}

async function deleteGoal() {
    if (!confirm('Are you sure you want to delete this goal and all its tasks? This cannot be undone.')) return;
    
    try {
        const response = await fetchWithAuth(`/planner/delete_goal/${goalId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete goal');
        }
        
        createToast('Goal deleted successfully', 'success');
        window.location.href = '/planner';
        
    } catch (error) {
        console.error('Failed to delete goal:', error);
        createToast('Failed to delete goal', 'error');
    }
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('taskTitle')?.value?.trim() || '',
                goal_id: goalId
            };
            
            // Validate required fields
            if (!formData.title) {
                createToast('Task title is required', 'warning');
                return;
            }
            
            try {
                const response = await fetchWithAuth('/planner/create_task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Failed to create task');
                }
                
                const newTask = await response.json();
                
                // Add to local data
                goalTasks.push(newTask);
                
                // Re-render
                renderTasksSection();
                renderProgressSection();
                
                createToast('Task created successfully!', 'success');
                closeAddTaskModal();
                
            } catch (error) {
                console.error('Failed to create task:', error);
                createToast(`Failed to create task: ${error.message}`, 'error');
            }
        });
    }
});

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
    const modal = document.getElementById('addTaskModal');
    if (event.target === modal) {
        closeAddTaskModal();
    }
});

// Make functions available globally for onclick handlers
window.openAddTaskModal = openAddTaskModal;
window.closeAddTaskModal = closeAddTaskModal;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.loadGoalDetails = loadGoalDetails;
window.loadGoalTasks = loadGoalTasks;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);