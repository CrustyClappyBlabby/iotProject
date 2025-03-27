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
        url: "https://h01st.grafana.net/d-solo/feh44r4tdzgn4e/temperature?orgId=1&from=1743088363400&to=1743088411599&timezone=browser&panelId=1&__feature.dashboardSceneSolo"
      },
      {
        title: "Humidity",
        url: "https://h01st.grafana.net/d-solo/eeh44w2ugyjnkd/humidity?orgId=1&from=1743088428826&to=1743088464831&timezone=browser&panelId=2&__feature.dashboardSceneSolo"
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