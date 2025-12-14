import React from 'react';
import ReactDOM from 'react-dom/client';

// Temporary placeholder component for testing Vite setup
function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Tramp Freighter Blues - React Migration</h1>
      <p>Vite setup successful! React 18+ is running.</p>
      <p>
        This is a placeholder. The full application will be implemented in
        subsequent tasks.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
