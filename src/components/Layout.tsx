// src/components/Layout.tsx
// This component wraps the Navbar around the page content (children).

import React, { PropsWithChildren } from 'react';
import Navbar from './shared/Navbar'; // Adjust the import path if Navbar is elsewhere

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      <Navbar />
      {/* Main content area */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
