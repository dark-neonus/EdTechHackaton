document.addEventListener('DOMContentLoaded', function() {
  const postsContainer = document.querySelector('.posts-container');
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  let currentTagFilter = null;
  
  async function fetchForumData() {
    try {
      let serverData = { questions: [] };
      try {
        const response = await fetch('/src/json/data.json');
        if (response.ok) {
          serverData = await response.json();
        }
      } catch (error) {
        console.error('Could not fetch from server, using local data only');
      }
      
      const localQuestions = JSON.parse(localStorage.getItem('forumQuestions')) || [];
      
      return {
        questions: [...localQuestions, ...serverData.questions]
      };
    } catch (error) {
      console.error('Error fetching forum data:', error);
      return { questions: [] };
    }
  }
  
  async function renderPosts() {
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '<div class="loading-state">Loading...</div>';
    
    try {
      const forumData = await fetchForumData();
      postsContainer.innerHTML = '';
      
      let posts = forumData.questions;
      
      if (currentTagFilter) {
        posts = posts.filter(post => post.tag === currentTagFilter);
      }
      
      const activeFilterTab = document.querySelector('.filter-tab.active');
      const filterType = activeFilterTab?.querySelector('span:last-child')?.textContent.toLowerCase() || 
                          activeFilterTab?.textContent.trim().toLowerCase();
                          
      if (filterType === 'top') {
        posts = posts.sort((a, b) => b.votes - a.votes);
      } else if (filterType === 'closed') {
        posts = posts.filter(post => post.closed);
      } else {
        posts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state">No questions available</div>';
        return;
      }
      
      posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        let postContent = `
          <div class="post-header">
            <div class="user-info">
              <div class="avatar">
                <img src="https://via.placeholder.com/40" alt="User avatar">
              </div>
              <div class="user-meta">
                <p class="username">${post.username}</p>
                <p class="time">${post.timeAgo}</p>
              </div>
            </div>
            <button>
              <span class="icon icon-more"></span>
            </button>
          </div>
          <h3 class="post-title">${post.title}</h3>
        `;
        
        if (post.content || post.excerpt) {
          postContent += `<p class="post-excerpt">${post.content || post.excerpt}</p>`;
        }
        
        postContent += `
          <div class="post-footer">
            <span class="post-tag" data-tag="${post.tag}">${post.tag}</span>
            <div class="post-stats">
              <div class="stat">
                <span class="icon icon-eye"></span>
                <span>${post.views}</span>
              </div>
              <div class="stat">
                <span class="icon icon-message"></span>
                <span>${post.comments}</span>
              </div>
              <div class="stat">
                <span class="icon icon-arrow-up"></span>
                <span>${post.votes}</span>
              </div>
            </div>
          </div>
        `;
        
        postElement.innerHTML = postContent;
        postsContainer.appendChild(postElement);
      });
      
      document.querySelectorAll('.post-tag').forEach(tagElement => {
        tagElement.addEventListener('click', function() {
          const tag = this.getAttribute('data-tag');
          filterPostsByTag(tag);
        });
      });
      
      makePostsClickable();
    } catch (error) {
      console.error('Error rendering posts:', error);
      postsContainer.innerHTML = '<div class="error-state">Failed to load questions</div>';
    }
  }

  function makePostsClickable() {
    const posts = document.querySelectorAll('.post');
    
    posts.forEach(post => {
      post.addEventListener('click', function(e) {
        if (e.target.closest('.post-tag') || 
            e.target.closest('button') ||
            e.target.closest('.post-stats')) {
          return;
        }
        
        const postData = {
          title: post.querySelector('.post-title').textContent,
          content: post.querySelector('.post-excerpt')?.textContent || '',
          username: post.querySelector('.username').textContent,
          tag: post.querySelector('.post-tag').textContent
        };
        
        localStorage.setItem('currentPost', JSON.stringify(postData));
        
      });
    });
  }
  
  function filterPostsByTag(tag) {
    if (!postsContainer) return;
    
    currentTagFilter = tag;
    
    const tagHeading = document.createElement('div');
    tagHeading.className = 'tag-filter-heading';
    tagHeading.innerHTML = `
      <h3>Questions tagged: ${tag}</h3>
      <button class="clear-tag-filter">Clear filter</button>
    `;
    
    const existingHeading = document.querySelector('.tag-filter-heading');
    if (existingHeading) {
      existingHeading.remove();
    }
    
    postsContainer.parentNode.insertBefore(tagHeading, postsContainer);
    
    document.querySelector('.clear-tag-filter').addEventListener('click', function() {
      currentTagFilter = null;
      tagHeading.remove();
      renderPosts();
    });
    
    renderPosts();
  }
  
  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        renderPosts();
      });
    });
  }
  
  if (postsContainer) {
    renderPosts();
  }
});