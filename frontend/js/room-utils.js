/**
 * Room Utilities - Navigation and room ID handling
 */
class RoomUtils {
    constructor(plantManager = null) {
        this.plantManager = plantManager || window.plantManager || new PlantManager();
    }
    
    /**
     * Convert database format to frontend format
     * Example: 'living_room' -> 'livingRoom'
     */
    normalizeRoomId(roomId) {
        if (!roomId || !roomId.includes('_')) return roomId;
        
        return roomId
            .split('_')
            .map((part, index) => {
                if (index === 0) {
                    return part.toLowerCase();
                } else {
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                }
            })
            .join('');
    }
    
    /**
     * Convert frontend format to database format
     * Example: 'livingRoom' -> 'living_room'
     */
    denormalizeRoomId(roomId) {
        if (!roomId) return roomId;
        
        let result = '';
        
        for (let i = 0; i < roomId.length; i++) {
            const char = roomId[i];
            
            if (/[A-Z]/.test(char)) {
                if (i > 0) {
                    result += '_';
                }
                result += char.toLowerCase();
            } else {
                result += char;
            }
        }
        
        return result;
    }
    
    /**
     * Update sidebar navigation with dynamic room links
     */
    updateSidebar() {
        const sidebarNav = document.querySelector('.sidebar .nav.flex-column');
        if (!sidebarNav) {
            console.warn('Sidebar not found');
            return;
        }
        
        if (!this.plantManager.isLoaded) {
            console.warn('PlantManager not loaded yet');
            return;
        }
        
        const rooms = this.plantManager.getAllRooms();
        const currentPage = this.getCurrentPage();
        
        // Build navigation HTML
        let navHtml = `
            <a class="nav-link ${currentPage === 'index' ? 'active' : ''}" href="index.html">
                <span class="nav-icon"></span> Overview
            </a>
        `;
        
        // Add room links
        for (const room of rooms) {
            const roomUrl = `room.html?id=${room.id}`;
            const isActive = (currentPage === 'room' && this.getUrlParam('id') === room.id);
            
            navHtml += `
                <a class="nav-link ${isActive ? 'active' : ''}" href="${roomUrl}">
                    <span class="nav-icon"></span> ${room.name}
                </a>
            `;
        }
        
        sidebarNav.innerHTML = navHtml;
        console.log('Sidebar updated');
    }
    
    /**
     * Get current page name from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename === 'room.html') {
            return 'room';
        }
        
        return filename.replace('.html', '');
    }
    
    /**
     * Get URL parameter value
     */
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
}

// Export globally
window.RoomUtils = RoomUtils;