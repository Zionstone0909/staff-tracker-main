// src/index.tsx (or main.tsx)

import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
// 1. IMPORT THE DATAPROVIDER
import { DataProvider } from "./contexts/DataContext"; 
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
            {/* The AuthProvider must be at the top to handle user authentication first */}
            <AuthProvider> 
                {/* 2. WRAP THE APPLICATION INSIDE THE DATAPROVIDER */}
                {/* Components like Customers/Sales will now have access to useData() */}
                <DataProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </DataProvider>
            </AuthProvider>
        </React.StrictMode>
    );
};

// Simply mount the application directly
try {
    // initializeAuth() should be called if necessary, but we keep the logic clean here
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