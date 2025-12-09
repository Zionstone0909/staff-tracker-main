// src/pages/DashboardRedirector.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth"; 

const DashboardRedirector: React.FC = () => {
  const navigate = useNavigate();
  
  // 💡 CORRECTION: Destructure the actual properties exported by useAuth: 'role' and 'loading'
  const { role, loading } = useAuth(); 

  useEffect(() => {
    // Wait for the authentication state to finish loading
    if (!loading) {
      if (role === 'admin') {
        // Redirect Admin users to the dedicated path
        navigate('/admin', { replace: true });
      } else if (role === 'staff') {
        // Redirect Staff users to the dedicated path
        navigate('/staff', { replace: true });
      } else {
        // Redirect to login if role is null or unrecognized
        navigate('/login', { replace: true });
      }
    }
  }, [role, loading, navigate]); // Depend on 'role' and 'loading'

  return <div>Loading Dashboard...</div>;
};

export default DashboardRedirector;