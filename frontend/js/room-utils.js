/**
 * Room Utilities - Navigation and room ID handling
 */
class RoomUtils {
    constructor(plantManager = null) {
        // Use the provided plantManager or get it from the window, or create a new one.
        this.plantManager = plantManager || window.plantManager || new PlantManager();
    }

    /**
     * Converts a database-style room name to a more human-friendly format.
     * Example: "living_room" becomes "Living Room", "kitchen" becomes "Kitchen".
     * @param {string} dbRoomName - The room name from the database.
     * @returns {string} The human-friendly room name.
     */
    makeRoomNamesFriendly(dbRoomName) {
        // If the room name is missing or empty, return a default placeholder.
        if (!dbRoomName) {
            return 'Unnamed Room';
        }

        // Replace underscores with spaces.
        let friendlyName = dbRoomName.replace(/_/g, ' ');

        // Capitalize the first letter of each word.
        // And ensure the rest of the word is in lowercase (for consistency).
        friendlyName = friendlyName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        return friendlyName;
    }

    /**
     * Update sidebar navigation with dynamic room links
     */
    updateSidebar() {
        const sidebarNav = document.querySelector('.sidebar .nav.flex-column');
        // If the sidebar navigation element isn't found, log a warning and exit.
        if (!sidebarNav) {
            console.warn('Sidebar navigation element not found.');
            return;
        }
        
        // If the PlantManager hasn't loaded its data yet, log a warning and exit.
        // Data is needed to get the list of rooms.
        if (!this.plantManager.isLoaded) {
            console.warn('PlantManager data not loaded yet. Sidebar update deferred.');
            return;
        }
        
        const rooms = this.plantManager.getAllRooms();
        const currentPage = this.getCurrentPage(); // Get the name of the current HTML page.
        
        // Start building the navigation HTML with the "Overview" link.
        let navHtml = `
            <a class="nav-link ${currentPage === 'index' ? 'active' : ''}" href="index.html">
                <span class="nav-icon"></span> Overview
            </a>
        `;
        
        // Add a link for each room.
        for (const room of rooms) {
            const roomUrl = `room.html?id=${room.id}`; // Construct the URL for the room page.
            // Check if the current room link should be marked as active.
            const isActive = (currentPage === 'room' && this.getUrlParam('id') === room.id);
            // Get the display-friendly room name.
            const friendlyName = this.makeRoomNamesFriendly(room.name);
            
            navHtml += `
                <a class="nav-link ${isActive ? 'active' : ''}" href="${roomUrl}">
                    <span class="nav-icon"></span> ${friendlyName}
                </a>
            `;
        }
        
        // Set the inner HTML of the sidebar navigation.
        sidebarNav.innerHTML = navHtml;
        console.log('Sidebar updated with friendly room names.');
    }
    
    /**
     * Get current page name from URL (e.g., "index", "room").
     * @returns {string} The name of the current page.
     */
    getCurrentPage() {
        const path = window.location.pathname;
        // Get the last part of the path (filename).
        const filename = path.split('/').pop();
        
        // Specifically handle "room.html"
        if (filename === 'room.html') {
            return 'room';
        }
        
        // For other pages, remove the ".html" extension.
        return filename.replace('.html', '');
    }
    
    /**
     * Get URL parameter value by its name.
     * @param {string} param - The name of the URL parameter.
     * @returns {string|null} The value of the URL parameter, or null if not found.
     */
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
}

// Export the RoomUtils class to the global window object.
window.RoomUtils = RoomUtils;