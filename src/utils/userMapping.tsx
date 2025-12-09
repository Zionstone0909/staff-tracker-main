// src/utils/userMapping.ts

interface UserInfo {
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

// ✅ User mapping - maps emails to names
export const USER_MAPPING: Record<string, UserInfo> = {
  'd62809238@gmail.com': { email: 'd62809238@gmail.com', name: 'Jireh Admin', role: 'admin' },
  'staff1@gmail.com': { email: 'staff1@gmail.com', name: 'Jireh Staff 1', role: 'staff' },
  'staff2@gmail.com': { email: 'staff2@gmail.com', name: 'Jireh Staff 2', role: 'staff' },
  'staff3@gmail.com': { email: 'staff3@gmail.com', name: 'Jireh Staff 3', role: 'staff' },
  'staff4@gmail.com': { email: 'staff4@gmail.com', name: 'Jireh Staff 4', role: 'staff' },
  'staff5@gmail.com': { email: 'staff5@gmail.com', name: 'Jireh Staff 5', role: 'staff' },
  'staff6@gmail.com': { email: 'staff6@gmail.com', name: 'Jireh Staff 6', role: 'staff' },
  'staff7@gmail.com': { email: 'staff7@gmail.com', name: 'Jireh Staff 7', role: 'staff' },
  'staff8@gmail.com': { email: 'staff8@gmail.com', name: 'Jireh Staff 8', role: 'staff' },
  'staff9@gmail.com': { email: 'staff9@gmail.com', name: 'Jireh Staff 9', role: 'staff' },
  'staff10@gmail.com': { email: 'staff10@gmail.com', name: 'Jireh Staff 10', role: 'staff' },
};

// ✅ Get user name from email or UID
export const getUserDisplayName = (identifier: string): string => {
  if (!identifier || identifier === 'unknown') return 'Unknown';
  
  // Check if it's a known email in mapping
  if (USER_MAPPING[identifier]) {
    return USER_MAPPING[identifier].name;
  }
  
  // Check if it's an email (not in mapping)
  if (identifier.includes('@')) {
    const namePart = identifier.split('@')[0];
    
    // Check for admin
    if (namePart.toLowerCase().includes('admin')) return 'Admin';
    
    // Check for staff pattern
    const staffMatch = namePart.match(/^staff(\d+)$/i);
    if (staffMatch) {
      return `Jireh Staff ${staffMatch[1]}`;
    }
    
    // Capitalize first letter
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }
  
  // If it's a UID, show shortened version
  return `User ${identifier.substring(0, 8)}`;
};

// ✅ Get user info from current auth user
export const getUserInfo = (user: any): { identifier: string; name: string } => {
  const identifier = user?.email || user?.uid || 'unknown';
  const name = getUserDisplayName(identifier);
  return { identifier, name };
};
