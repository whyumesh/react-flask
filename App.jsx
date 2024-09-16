import React, { useState } from 'react';
import './App.css'; // Make sure your CSS is properly imported

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="app-container">
      {!sidebarVisible && (
        <img
          src="public/sidebar.png" // Update the path as needed
          alt="Toggle Sidebar"
          className="toggle-sidebar-icon"
          onClick={toggleSidebar}
        />
      )}

      {sidebarVisible && (
        <div className="sidebar">
          {/* Sidebar content goes here */}
          <button onClick={toggleSidebar}>Close</button>
        </div>
      )}

      {/* Main app content */}
    </div>
  );
}

export default App;
