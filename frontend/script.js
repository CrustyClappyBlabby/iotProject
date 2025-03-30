/**
 * Simple Grafana Dashboard Loader
 */

// Load dashboards when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get dashboard container
    const container = document.querySelector('.dashboard-container');
    if (!container) return;
    
    // Dashboard definitions - easy to edit
    const dashboards = [
      {
        title: "Temperature",
        url: "https://h01st.grafana.net/d-solo/feh44r4tdzgn4e/temperature?orgId=1&timezone=browser&panelId=1&__feature.dashboardSceneSolo"
      },
      {
        title: "Humidity",
        url: "https://h01st.grafana.net/d-solo/eeh44w2ugyjnkd/humidity?orgId=1&timezone=browser&panelId=2&__feature.dashboardSceneSolo"
      }
    ];
    
    // Create and add each dashboard
    dashboards.forEach(function(dashboard) {
      // Create panel element
      const panel = document.createElement('div');
      panel.className = 'grafana-panel';
      
      // Add title
      const title = document.createElement('h2');
      title.textContent = dashboard.title;
      panel.appendChild(title);
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = dashboard.url;
      iframe.width = "100%";
      iframe.height = "200";
      
      // Add iframe to panel
      panel.appendChild(iframe);
      
      // Add panel to container
      container.appendChild(panel);
    });
  });

// Site builder based on variable input
const rooms = [
    { id: 'living-room', name: 'Living Room' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'bedroom-1', name: 'Bedroom 1' },
];

// Function to load rooms content
function loadRoomContent(roomId) {
    // Find the content container
    const contentContainer = document.querySelector('.content-area');
    if (!contentContainer) return;

    // Find room by ID
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Update room title if it exists
    const roomTitle = document.querySelector('.room-title');
    if (roomTitle) {
        roomTitle.textContent = room.name;
    }

    contentContainer.innerHTML = `
    <h3>${room.name}</h3>
    <p>All your plants are belong to us</p>
    `;
}

function makeRoom() {
    // Finds "navigation" section in HTML/CSS
    const navMenu = document.querySelector('.navigation');
    if (!navMenu) return;

    // Clear the items
    navMenu.innerHTML = '';

    // Finds room from hash or default to first room (måske deafult til front page)
    const currentRoomId = window.location.hash.substring(1) || rooms[0].id;

    // Create the rooms from const room
    rooms.forEach(room => {
        const li = document.createElement('li');
        const a = document.createElement('a');

        a.href = `#${room.id}`;
        a.className = 'nav-item';
        a.textContent = room.name;

        //checks if the room is active as dashboard
        if (room.id === currentRoomId) { // Fixed variable name from currentRoomID to currentRoomId
            a.classList.add('active');
        }

        // Listener for room selection
        a.addEventListener('click', function(e) {
            // Remove "active" class from nav-item s
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            this.classList.add('active');

            // Load the room content
            loadRoomContent(room.id);
        });

        li.appendChild(a);
        navMenu.appendChild(li);
    });

    // Load initial room content
    loadRoomContent(currentRoomId);
}

// Handle URL changes (back/forward buttons)
window.addEventListener('hashchange', function() {
    const roomId = window.location.hash.substring(1);
    if (roomId) {
        // Update active class in menu
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${roomId}`) {
                item.classList.add('active');
            }
        });

        // Load the room content
        loadRoomContent(roomId);
    }
});

// Call this when the page loads
document.addEventListener('DOMContentLoaded', makeRoom);