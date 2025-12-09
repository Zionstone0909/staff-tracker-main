// src/index.tsx (or main.tsx)

import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
// Ensure this path is correct for your Firebase initialization logic
import { initializeAuth } from "./firebase"; 

// Function to safely mount the React application
const mountApp = () => {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        // Log this error loudly if the main HTML element is missing
        console.error("Fatal Error: Root element not found!");
        // Stop execution if the root isn't found
        return; 
    }

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            {/* The AuthProvider handles initialization loading states internally now */}
            <AuthProvider> 
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </AuthProvider>
        </React.StrictMode>
    );
};

// With your AuthProvider handling its own `initialized` state internally (as updated in the last response), 
// we can simplify the startup file significantly. The <AuthProvider> will show a loading screen 
// until it is ready, and your <ProtectedRoute> will handle the rest.

// Simply mount the application directly
try {
    mountApp();
} catch (error) {
    console.error("An error occurred during application bootstrap:", error);
    // If React fails to render completely, ensure we show the user something basic
    const rootElement = document.getElementById("root");
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h1>Application Failed to Load</h1>
                <p>Please check the console for details.</p>
            </div>
        `;
    }
}
