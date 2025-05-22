document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // --- HAMBURGER MENU FUNCTIONALITY ---
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');
    const desktopNav = document.getElementById('desktop-nav');

    // Toggle mobile menu
    function toggleHamburgerMenu() {
        if (hamburger && navLinks) {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
            
            // Animate hamburger icon
            const hamburgerIcon = hamburger.querySelector('.hamburger-icon');
            if (hamburgerIcon) {
                const spans = hamburgerIcon.querySelectorAll('span');
                if (!isExpanded) {
                    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
                } else {
                    spans[0].style.transform = '';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = '';
                }
            }
        }
    }


    // Handle window resize
    function handleResize() {
        const isMobile = window.innerWidth < 992;
        if (hamburger) hamburger.style.display = isMobile ? 'flex' : 'none';
        if (desktopNav) desktopNav.style.display = isMobile ? 'none' : 'flex';
        if (navLinks && !isMobile) navLinks.classList.remove('active');
    }
    
    // Event listeners for hamburger menu
    if (hamburger) {
        hamburger.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            toggleHamburgerMenu();
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks && navLinks.classList.contains('active') && 
            hamburger && !hamburger.contains(e.target) && 
            !navLinks.contains(e.target)) {
            toggleHamburgerMenu();
        }
    });

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    // --- END HAMBURGER MENU FUNCTIONALITY ---

    // --- MODAL FUNCTIONALITY ---
    // Store the current scroll position
    let scrollPosition = 0;

    // Function to lock body scroll when modal is open
    function lockBodyScroll() {
        scrollPosition = window.pageYOffset;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = '100%';
    }

    // Function to unlock body scroll when modal is closed
    function unlockBodyScroll() {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollPosition);
    }

    // Open modal function
    function openModal(modalId) {
        console.log('Opening modal:', modalId);
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('Modal not found:', modalId);
            return false;
        }

        // Close any open modals first
        closeAllModals();
        
        // Lock body scroll
        lockBodyScroll();
        
        // Show the modal
        modal.style.display = 'flex';
        
        // Force reflow
        void modal.offsetHeight;
        
        // Add show class for animation
        modal.classList.add('show');
        
        // Focus the modal for better accessibility
        modal.setAttribute('aria-hidden', 'false');
        
        return false;
    }
    
    // Close all modals
    function closeAllModals() {
        console.log('Closing all modals');
        
        // Unlock body scroll
        unlockBodyScroll();
        
        // Close all modals with animation
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.classList.contains('show')) {
                modal.classList.remove('show');
                
                // Wait for the fade-out animation to complete before hiding
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                }, 300); // Match this with CSS transition time
            }
        });
        
        return false;
    }

    // Handle all modal interactions
    document.addEventListener('click', function(event) {
        // Check if we clicked on a modal open button
        const openButton = event.target.closest('[data-modal]') || 
                          (event.target.id === 'openFullStoryModal' ? event.target : null);
        
        if (openButton) {
            event.preventDefault();
            event.stopPropagation();
            
            const modalId = openButton.getAttribute('data-modal') || 'fullStoryModal';
            openModal(modalId);
            return false;
        }
        
        // Handle close button clicks
        if (event.target.closest('.close')) {
            event.preventDefault();
            event.stopPropagation();
            closeAllModals();
            return false;
        }
        
        // Handle clicks on modal overlay (outside content)
        if (event.target.classList.contains('modal') && event.target.id) {
            event.preventDefault();
            event.stopPropagation();
            closeAllModals();
            return false;
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
            return false;
        }
    });
    // --- END MODAL FUNCTIONALITY ---

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a modal link or empty anchor
            if (href === '#' || href.startsWith('#!') || href === '#openFullStoryModal') {
                return;
            }
            
            const targetId = href.substring(1);
            if (!targetId) return;
            
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                // Close mobile menu if open
                if (navLinks && navLinks.classList.contains('active')) {
                    toggleHamburgerMenu();
                }
                
                const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const offsetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
