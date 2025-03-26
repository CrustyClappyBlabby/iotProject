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
        url: "https://h01st.grafana.net/d-solo/c1385932-e8b5-481e-a999-f716359f8cf2/overview-celsius?orgId=1&from=1742391372458&to=1742996172458&timezone=utc&var-DS_PROMETHEUS=grafanacloud-demoinfra-prom&var-DS_LOKI=grafanacloud-demoinfra-logs&var-location=London&var-forecast_day=$__all&panelId=3&__feature.dashboardSceneSolo"
      },
      {
        title: "Humidity",
        url: "https://h01st.grafana.net/d-solo/c1385932-e8b5-481e-a999-f716359f8cf2/overview-celsius?orgId=1&from=1742391372458&to=1742996172458&timezone=utc&var-DS_PROMETHEUS=grafanacloud-demoinfra-prom&var-DS_LOKI=grafanacloud-demoinfra-logs&var-location=London&var-forecast_day=$__all&panelId=5&__feature.dashboardSceneSolo"
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