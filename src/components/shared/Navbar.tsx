"use client";

import { useState, CSSProperties, PropsWithChildren } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import { Menu, X, User as UserIcon } from "lucide-react";

// Import Auth context
import { useAuth } from "../../contexts/AuthContext"; // Adjust path as necessary

// --- Placeholder UI Components for Inline Styling ---

interface ComponentProps extends PropsWithChildren {
    style?: CSSProperties;
    className?: string; 
    asChild?: boolean;
    variant?: string;
    size?: string;
    align?: string;
    onClick?: () => void;
}

const Button: React.FC<ComponentProps> = ({ children, style, onClick }) => (
    <button style={style} onClick={onClick}>{children}</button>
);

const DropdownMenu: React.FC<ComponentProps> = ({ children }) => <>{children}</>;
const DropdownMenuTrigger: React.FC<ComponentProps> = ({ children }) => <>{children}</>;
const DropdownMenuContent: React.FC<ComponentProps> = ({ children, style }) => (
    <div style={{ ...style, position: 'absolute', right: 0, top: '100%', minWidth: '10rem', zIndex: 100 }}>{children}</div>
);
const DropdownMenuItem: React.FC<ComponentProps> = ({ children, style, onClick }) => (
    <div style={{ ...style, padding: '0.5rem 1rem', cursor: 'pointer' }} onClick={onClick}>{children}</div>
);
const DropdownMenuSeparator: React.FC = () => <div style={{ borderTop: '1px solid #e5e7eb', margin: '0.25rem 0' }} />;

// -----------------------------------------------------

// Links dynamically redirect based on user role (though static here for inline styling example)
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/admin-dashboard" }, // Updated to a specific dashboard route
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { logout, user } = useAuth(); // Get logout function and user info from context
  
  const primaryBlue = '#0B3D91';

  const handleLogout = () => {
    logout(); // Clear user from context and localStorage
    navigate('/'); // Redirect to the login page
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  return (
    <nav style={{ backgroundColor: primaryBlue, color: '#ffffff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', height: '4rem', alignItems: 'center' }}>
          
          {/* Logo/Home Link */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ height: '2.5rem', width: '4rem', borderRadius: '0.5rem', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: primaryBlue, fontWeight: '700' }}>Jireh</span>
            </div>
            <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>Fishes</span>
          </Link>

          {/* Desktop Nav Links and User/Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  transition: 'color 0.2s, background-color 0.2s',
                  textDecoration: 'none',
                  backgroundColor: location.pathname === link.href ? '#ffffff' : 'transparent',
                  color: location.pathname === link.href ? primaryBlue : '#ffffff',
                }}
              >
                {link.name}
              </Link>
            ))}

            {/* Profile Dropdown & Logout */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                    style={{ padding: '0.5rem', borderRadius: '0.375rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <UserIcon style={{ height: '1.25rem', width: '1.25rem' }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent style={{ backgroundColor: '#ffffff', color: primaryBlue, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                    Signed in as: **{user?.email || 'User'}**
                </div>
                <DropdownMenuSeparator />
                {/* Use the functional handleLogout */}
                <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button (Hidden on desktop only) */}
          <div style={{ display: 'none' /* Use media query for mobile visibility */ }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              {isMobileMenuOpen ? <X style={{ width: '1.5rem', height: '1.5rem' }} /> : <Menu style={{ width: '1.5rem', height: '1.5rem' }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Visibility controlled by state, styling is static) */}
      {isMobileMenuOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: primaryBlue, padding: '0.5rem 0', gap: '0.25rem' }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              style={{
                display: 'block',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '500',
                textDecoration: 'none',
                backgroundColor: location.pathname === link.href ? '#ffffff' : 'transparent',
                color: location.pathname === link.href ? primaryBlue : '#ffffff',
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Profile Dropdown in Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.375rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <UserIcon style={{ height: '1.25rem', width: '1.25rem' }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent style={{ backgroundColor: '#ffffff', color: primaryBlue }}>
              <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </nav>
  );
}
