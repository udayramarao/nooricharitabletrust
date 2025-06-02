document.addEventListener('DOMContentLoaded', function() {
    let slideIndex = 0;
    let slideInterval;
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    
    // Initialize the slideshow
    function initSlideshow() {
        if (slides.length === 0) return;
        
        // Show the first slide
        showSlides();
        
        // Start automatic slideshow
        startAutoSlide();
    }
    
    // Show slides function
    function showSlides() {
        // Hide all slides
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
            dots[i].classList.remove("active");
        }
        
        // Increment slide index
        slideIndex++;
        
        // Reset to first slide if at the end
        if (slideIndex > slides.length) {
            slideIndex = 1;
        }
        
        // Display the current slide
        slides[slideIndex - 1].style.display = "block";
        dots[slideIndex - 1].classList.add("active");
    }
    
    // Start automatic slideshow
    function startAutoSlide() {
        // Clear any existing interval
        clearInterval(slideInterval);
        
        // Set interval for automatic slide change (5 seconds)
        slideInterval = setInterval(showSlides, 5000);
    }
    
    // Function to move slides manually
    window.moveSlide = function(n) {
        // Clear automatic slideshow when manually navigating
        clearInterval(slideInterval);
        
        // Calculate new slide index
        slideIndex += n - 1; // -1 because showSlides will increment it
        
        // Handle edge cases
        if (slideIndex < 0) slideIndex = slides.length - 1;
        if (slideIndex >= slides.length) slideIndex = 0;
        
        // Show the slide
        showSlides();
        
        // Restart automatic slideshow
        startAutoSlide();
    };
    
    // Function to show a specific slide
    window.currentSlide = function(n) {
        // Clear automatic slideshow when manually navigating
        clearInterval(slideInterval);
        
        // Set slide index
        slideIndex = n - 1; // -1 because showSlides will increment it
        
        // Show the slide
        showSlides();
        
        // Restart automatic slideshow
        startAutoSlide();
    };
    
    // Add CSS for active dots
    const style = document.createElement('style');
    style.textContent = `
        .dot.active {
            background-color: #717171 !important;
        }
        
        .fade {
            animation-name: fade;
            animation-duration: 1.5s;
        }
        
        @keyframes fade {
            from {opacity: .4}
            to {opacity: 1}
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the slideshow
    initSlideshow();
});
