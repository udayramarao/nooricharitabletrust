document.addEventListener('DOMContentLoaded', () => {
    // Gallery elements
    const galleryGrid = document.getElementById('galleryGrid');
    
    // Only initialize gallery if the gallery grid exists on the page
    if (!galleryGrid) {
        return; // Exit if not on a page with gallery
    }
    
    const galleryModal = document.getElementById('galleryModal');
    const galleryModalImg = document.getElementById('galleryModalImg');
    const galleryModalClose = document.getElementById('galleryModalClose');
    const galleryModalTitle = document.getElementById('galleryModalTitle');
    const galleryModalDesc = document.getElementById('galleryModalDesc');
    const galleryPrev = document.getElementById('galleryPrev');
    const galleryNext = document.getElementById('galleryNext');
    
    // Gallery home button
    const goHomeBtn = document.getElementById('goHomeBtn');
    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '#';
        });
    }
    
    // Current active gallery item for carousel
    let currentIndex = 0;
    const galleryItems = [];
    
    // Function to scan directory for images (simulated with known images)
    // In a real server environment, this would be done server-side
    function getGalleryImages() {
        // This is a static list based on the files found in your images/gallery folder
        return [
            'photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg', 'photo5.jpg',
            'photo6.jpg', 'photo7.jpg', 'photo8.jpg', 'photo9.jpg', 'photo10.jpg',
            'photo11.jpg', 'photo12.jpg', 'photo13.jpg', 'photo14.jpg', 'photo15.jpg',
            'photo16.jpg', 'photo17.jpg', 'photo18.jpg', 'photo19.jpg', 'photo20.jpg',
            'phot14.jpg' // Also found in your directory
        ];
    }
    
    // Get all gallery images
    const galleryImages = getGalleryImages();
    
    // We'll keep categories in the data structure but not display the filter buttons
    // This allows us to maintain the category icons for visual interest
    const categories = ['education', 'medical', 'outreach', 'environment'];
    
    // No different card sizes needed anymore
    
    // Clear existing gallery grid
    galleryGrid.innerHTML = '';
    
    // Dynamically create gallery cards
    galleryImages.forEach((image, index) => {
        // Randomly assign categories for demonstration
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Create image date (for demonstration)
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[Math.floor(Math.random() * months.length)];
        const year = 2022 + Math.floor(Math.random() * 3); // 2022-2024
        const date = `${month} ${year}`;
        
        // Create image title (for demonstration)
        const titles = {
            'education': ['School Program', 'Education Initiative', 'Learning Center', 'Student Support', 'Classroom Project'],
            'medical': ['Health Camp', 'Medical Outreach', 'Healthcare Initiative', 'Vaccination Drive', 'Medical Support'],
            'outreach': ['Community Service', 'Food Distribution', 'Elderly Care', 'Youth Program', 'Support Drive'],
            'environment': ['Tree Planting', 'Clean-up Drive', 'Environmental Project', 'Conservation Effort', 'Sustainability Initiative']
        };
        const title = titles[category][Math.floor(Math.random() * titles[category].length)];
        
        // Create gallery card
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-category', category);
        
        // Set card HTML - without any text overlays
        card.innerHTML = `
            <img src="images/gallery/${image}" alt="Gallery Image" class="gallery-img">
        `;
        
        // Add card to gallery grid
        galleryGrid.appendChild(card);
        
        // Add to gallery items array for carousel - without titles or descriptions
        galleryItems.push({
            src: `images/gallery/${image}`,
            index: index
        });
    });
    
    // Get category icon
    function getCategoryIcon(category) {
        switch(category) {
            case 'education': return 'fa-book';
            case 'medical': return 'fa-heartbeat';
            case 'outreach': return 'fa-hands-helping';
            case 'environment': return 'fa-leaf';
            default: return 'fa-image';
        }
    }
    
    // Update gallery cards variable after dynamic creation
    const galleryCards = document.querySelectorAll('.gallery-card');
    
    // No filter functionality needed since we removed the filter buttons
    
    // Open gallery modal - without titles or descriptions
    galleryCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const img = card.querySelector('.gallery-img');
            openGalleryModal(img.src, index);
        });
    });
    
    // Open gallery modal function - without titles or descriptions
    function openGalleryModal(src, index) {
        galleryModalImg.src = src;
        currentIndex = index;
        galleryModal.classList.add('active');
    }
    
    // Close gallery modal
    if (galleryModalClose) {
        galleryModalClose.addEventListener('click', (e) => {
            e.preventDefault();
            if (galleryModal) galleryModal.classList.remove('active');
        });
    }
    
    // Click outside to close modal
    if (galleryModal) {
        galleryModal.addEventListener('click', (e) => {
            if (e.target === galleryModal) {
                galleryModal.classList.remove('active');
            }
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (galleryModal && galleryModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                galleryModal.classList.remove('active');
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateGallery('prev');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateGallery('next');
            }
        }
    });
    
    // Carousel navigation
    if (galleryPrev) {
        galleryPrev.addEventListener('click', (e) => {
            e.preventDefault();
            navigateGallery('prev');
        });
    }
    
    if (galleryNext) {
        galleryNext.addEventListener('click', (e) => {
            e.preventDefault();
            navigateGallery('next');
        });
    }
    
    // Navigate gallery function
    function navigateGallery(direction) {
        if (direction === 'prev') {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        } else {
            currentIndex = (currentIndex + 1) % galleryItems.length;
        }
        
        // Add animation
        galleryModalImg.style.opacity = '0';
        galleryModalTitle.style.opacity = '0';
        galleryModalDesc.style.opacity = '0';
        
        setTimeout(() => {
            const item = galleryItems[currentIndex];
            galleryModalImg.src = item.src;
            galleryModalImg.style.opacity = '1';
        }, 300);
    }
    
    // Touch swipe for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (galleryModal) {
        galleryModal.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        galleryModal.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        if (touchEndX < touchStartX) {
            // Swipe left
            navigateGallery('next');
        } else if (touchEndX > touchStartX) {
            // Swipe right
            navigateGallery('prev');
        }
    }
    
    // Pinch to zoom for mobile (basic implementation)
    let initialPinchDistance = 0;
    let currentScale = 1;
    
    galleryModal.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDistance = getPinchDistance(e);
        }
    });
    
    galleryModal.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const currentPinchDistance = getPinchDistance(e);
            const pinchRatio = currentPinchDistance / initialPinchDistance;
            
            // Limit zoom scale
            currentScale = Math.min(Math.max(pinchRatio, 0.5), 3);
            
            galleryModalImg.style.transform = `scale(${currentScale})`;
            e.preventDefault(); // Prevent page scroll
        }
    });
    
    galleryModal.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = 0;
        }
    });
    
    function getPinchDistance(e) {
        return Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );
    }
    
    // Reset zoom on modal close
    galleryModalClose.addEventListener('click', () => {
        currentScale = 1;
        galleryModalImg.style.transform = 'scale(1)';
    });
});
