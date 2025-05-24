document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const factorialInput = document.getElementById('factorial-number');
    const calculateButton = document.getElementById('calculate-factorial');
    const factorialResult = document.getElementById('factorial-result');
    const factorialError = document.getElementById('factorial-error');
    const easterEgg = document.querySelector('.easter-egg');
    
    let maxFactorial = -1;

    // Fetch maximum available factorial on page load
    async function fetchMaxFactorial() {
      try {
        const response = await fetch('/api/max_factorial');
        const data = await response.json();
        maxFactorial = data.max_factorial;
        factorialInput.setAttribute('max', maxFactorial + 1);
      } catch (error) {
        console.error('Error fetching maximum factorial:', error);
      }
    }

    function setupSearch() {
      if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
              window.location.href = `/forum/?search=${encodeURIComponent(query)}`;
            }
          }
        });
      }
    }
    
    function setupFeatureCards() {
      document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(-5px)';
        });
      });
    }

    async function calculateFactorial() {
      const number = parseInt(factorialInput.value);
      factorialError.textContent = '';
      factorialResult.style.display = 'none';
      
      if (isNaN(number)) {
        factorialError.textContent = 'Please enter a valid number';
        return;
      }

      if (number < 0) {
        factorialError.textContent = 'Factorial is not defined for negative numbers';
        return;
      }

      if (maxFactorial >= 0 && number > maxFactorial + 1) {
        factorialError.textContent = `Maximum available factorial is ${maxFactorial + 1}`;
        return;
      }

      try {
        const response = await fetch(`/api/factorial/${number}`);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result) {
          factorialResult.textContent = `${number}! = ${data.result}`;
          factorialResult.style.display = 'block';
        } else {
          factorialError.textContent = data.error || 'Failed to calculate factorial';
        }
      } catch (error) {
        factorialError.textContent = `Error: ${error.message}`;
        console.error('Error calculating factorial:', error);
      }
    }

    // Easter egg zoom detection
    function checkZoomLevel() {
        // Method 1: Using devicePixelRatio (works better in some browsers)
        const browserZoomLevel = Math.round(window.devicePixelRatio * 100);
        
        // Method 2: Using window dimensions (works better in other browsers)
        const zoomLevel = Math.round((window.outerWidth / window.innerWidth) * 100);
        
        // Method 3: Visual viewport (more modern approach)
        const visualViewport = window.visualViewport ? 
            Math.round((window.visualViewport.width / document.documentElement.clientWidth) * 100) : 100;
        
        // For debugging
        console.log(`Zoom detection: Method 1: ${browserZoomLevel}%, Method 2: ${zoomLevel}%, Method 3: ${visualViewport}%`);
        
        // Show easter egg when zoomed out significantly (using any method)
        // Note: "Zoomed out to 25%" often registers as values around 25-33% depending on the browser
        if (browserZoomLevel <= 33 || zoomLevel <= 33 || visualViewport <= 33) {
            easterEgg.style.display = 'block';
            console.log("Easter egg visible!");
        } else {
            easterEgg.style.display = 'none';
        }
    }

    // Listen for window resize events (which happen during zoom)
    window.addEventListener('resize', checkZoomLevel);
    
    // Make sure the easter egg is checked on load and on scroll
    window.addEventListener('scroll', checkZoomLevel);
    document.addEventListener('wheel', checkZoomLevel);

    // Initial check
    checkZoomLevel();

    // Setup factorial calculator
    if (calculateButton) {
      calculateButton.addEventListener('click', calculateFactorial);
    }

    if (factorialInput) {
      factorialInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          calculateFactorial();
        }
      });
    }
    
    fetchMaxFactorial();
    setupSearch();
    setupFeatureCards();
});