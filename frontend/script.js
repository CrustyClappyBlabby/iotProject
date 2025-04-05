/**
 * JavaScript
 * Contains the UI functionality needed for the design
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI interactions
    initPlantToggles();
});

/**
 * Initialize plant toggle functionality
 * Handles expanding/collapsing plant detail sections
 */
function initPlantToggles() {
    // Find all plant headers with data-toggle-target attribute
    const toggleHeaders = document.querySelectorAll('.plant-header[data-toggle-target]');
    
    toggleHeaders.forEach(header => {
        const targetSelector = header.getAttribute('data-toggle-target');
        const targetElement = document.querySelector(targetSelector);
        
        if (targetElement) {
            // Set up the click handler
            header.addEventListener('click', function() {
                // Toggle the collapse state
                if (targetElement.classList.contains('show')) {
                    targetElement.classList.remove('show');
                    // Update the toggle icon orientation
                    const toggleIcon = header.querySelector('.toggle-icon span');
                    if (toggleIcon) {
                        toggleIcon.textContent = '⌄'; // Down arrow
                    }
                } else {
                    targetElement.classList.add('show');
                    // Update the toggle icon orientation
                    const toggleIcon = header.querySelector('.toggle-icon span');
                    if (toggleIcon) {
                        toggleIcon.textContent = '⌃'; // Up arrow
                    }
                    
                    // Refresh any iframes when expanding to ensure they load properly
                    const iframes = targetElement.querySelectorAll('iframe');
                    refreshIframes(iframes);
                }
            });
        }
    });
}

/**
 * Refresh iframes by reloading their source
 * Ensures Grafana charts render properly when becoming visible
 */
function refreshIframes(iframes) {
    iframes.forEach(iframe => {
        // Refresh the iframe by reloading its source
        const src = iframe.src;
        iframe.src = src;
    });
}