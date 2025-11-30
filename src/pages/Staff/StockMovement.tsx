import React, { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  Auth, 
  User as FirebaseUser 
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  addDoc, 
  Firestore, 
  FieldValue 
} from 'firebase/firestore';
import { ArrowUp, ArrowDown, Package, Plus, User, Loader2 } from 'lucide-react';

// --- Type Definitions for Firebase Globals & Environment Access ---
const environmentGlobals = typeof window !== 'undefined' ? (window as any) : {};

const appId: string = typeof environmentGlobals.__app_id !== 'undefined' ? environmentGlobals.__app_id : 'default-app-id';
const firebaseConfig: object = typeof environmentGlobals.__firebase_config !== 'undefined' ? JSON.parse(environmentGlobals.__firebase_config) : {};
const initialAuthToken: string | undefined = typeof environmentGlobals.__initial_auth_token !== 'undefined' ? environmentGlobals.__initial_auth_token : undefined;


// --- Type Definitions for Components ---

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled: boolean;
  className?: string; 
  type?: 'button' | 'submit' | 'reset';
  // FIX: Added style prop to ButtonProps to resolve TS error 2322
  style?: React.CSSProperties; 
}

/** Renders a professional, primary button. */
const Button: React.FC<ButtonProps> = ({ children, onClick, disabled, className = '', type = 'button', style }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem', // space-x-2
        padding: '0.5rem 1rem', // px-4 py-2
        fontSize: '0.875rem', // text-sm
        fontWeight: '600', // font-semibold
        backgroundColor: disabled ? 'rgba(99, 102, 241, 0.5)' : '#4f46e5', // bg-indigo-600, disabled:opacity-50
        color: 'white',
        borderRadius: '0.5rem', // rounded-lg
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // shadow-md
        transition: 'all 0.2s ease-in-out', // transition-all duration-200
        cursor: disabled ? 'not-allowed' : 'pointer', // disabled:cursor-not-allowed
        border: 'none',
        outline: 'none',
        ...style // Apply any additional styles passed via the prop
    }}
    className={className}
  >
    {children}
  </button>
);

interface InputProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

/** Renders a clean input field. */
const Input: React.FC<InputProps> = ({ label, id, type = 'text', value, onChange, placeholder, className = '' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563', marginBottom: '0.25rem' }}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '0.5rem 0.75rem', // px-3 py-2
        border: '1px solid #d1d5db', // border border-gray-300
        borderRadius: '0.5rem', // rounded-lg
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
        outline: 'none',
      }}
      className={className}
      min={type === 'number' ? '1' : undefined}
    />
  </div>
);

interface Movement {
  id: string;
  productName: string;
  quantity: number;
  type: 'IN' | 'OUT';
  timestamp: { seconds: number; nanoseconds: number } | FieldValue;
}

interface MovementItemProps {
  movement: Movement;
}

/** Renders a professional stock movement item in the list. */
const MovementItem: React.FC<MovementItemProps> = ({ movement }) => {
  const isIncoming = movement.type === 'IN';
  const icon = isIncoming ? <ArrowUp style={{ width: '1rem', height: '1rem' }} /> : <ArrowDown style={{ width: '1rem', height: '1rem' }} />;
  
  const colorStyle = isIncoming 
    ? { backgroundColor: '#f0fdf4', color: '#065f46', borderLeftColor: '#4ade80' } 
    : { backgroundColor: '#fef2f2', color: '#991b1b', borderLeftColor: '#f87171' };
    
  const iconBg = isIncoming 
    ? { backgroundColor: '#10b981', color: 'white' } 
    : { backgroundColor: '#ef4444', color: 'white' };

  const formattedDate = movement.timestamp && typeof (movement.timestamp as any).seconds === 'number'
    ? new Date((movement.timestamp as any).seconds * 1000).toLocaleString()
    : 'Pending...';

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1rem', 
        borderLeft: '4px solid', 
        borderRadius: '0.5rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)', 
        ...colorStyle 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ padding: '0.5rem', borderRadius: '9999px', ...iconBg }}>
          {icon}
        </span>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>{movement.productName}</p>
          <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>
            {isIncoming ? 'Stock In' : 'Stock Out'} - {movement.quantity} units
          </p>
          </div>
        </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563' }}>{formattedDate}</p>
      </div>
    </div>
  );
};


// --- Main Application Component ---
const App: React.FC = () => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [_, setAuth] = useState<Auth | null>(null); 
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase configuration is missing. Cannot initialize app.");
        setIsAuthReady(true);
        return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      const authenticate = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (error) {
          console.error("Firebase Auth Error: Failed to sign in.", error);
        }
      };

      const unsubscribe = onAuthStateChanged(authInstance, (user: FirebaseUser | null) => {
        if (user) {
          setUserId(user.uid);
        } else {
          setUserId(crypto.randomUUID()); 
        }
        setIsAuthReady(true);
      });

      authenticate();

      return () => unsubscribe();
    } catch (e) {
        console.error("Error initializing Firebase:", e);
        setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;
    const movementsCollectionPath = `artifacts/${appId}/users/${userId}/stock_movements`;
    const q = query(
      collection(db, movementsCollectionPath),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMovements: Movement[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Movement, 'id'>
      }));
      setMovements(newMovements);
    }, (error) => {
      console.error("Error fetching stock movements:", error);
    });

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);


  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseInt(quantity, 10);

    if (!productName.trim() || !quantityNum || quantityNum <= 0) {
      return;
    }

    if (!db || !userId) {
        return;
    }

    setIsSubmitting(true);

    try {
      const movementData = {
        productName: productName.trim(),
        quantity: quantityNum,
        type: type,
        timestamp: serverTimestamp(),
      };

      const movementsCollectionPath = `artifacts/${appId}/users/${userId}/stock_movements`;
      await addDoc(collection(db, movementsCollectionPath), movementData);

      setProductName('');
      setQuantity('');
      setType('IN');

    } catch (error) {
      console.error("Error adding stock movement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'white', color: '#1f2937' }}>
        <Loader2 style={{ width: '2rem', height: '2rem', marginRight: '0.5rem', color: '#4f46e5' }} className="animate-spin" /> 
        Loading Stock Tracker...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package style={{ width: '2rem', height: '2rem', marginRight: '0.75rem', color: '#4f46e5' }} />
          Inventory Movement Tracker
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
          User ID: <span style={{ fontFamily: 'monospace', color: '#4f46e5', marginLeft: '0.25rem', fontWeight: '500' }}>{userId}</span>
        </p>
      </header>

      <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* === Stock Movement Form === */}
        <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Record Movement</h2>
          <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Product Name"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Screws 5mm"
            />
            <Input
              label="Quantity"
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Minimum 1"
            />

            {/* Type Selection */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563', marginBottom: '0.25rem', display: 'block' }}>Movement Type</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setType('IN')}
                  style={{
                    flexGrow: 1,
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.15s ease-in-out',
                    border: type === 'IN' ? '1px solid #14532d' : '1px solid #d1d5db',
                    backgroundColor: type === 'IN' ? '#16a34a' : '#f3f4f6',
                    color: type === 'IN' ? 'white' : '#4b5563',
                  }}
                >
                  <ArrowUp style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.25rem' }} /> Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  style={{
                    flexGrow: 1,
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.15s ease-in-out',
                    border: type === 'OUT' ? '1px solid #7f1d1d' : '1px solid #d1d5db',
                    backgroundColor: type === 'OUT' ? '#dc2626' : '#f3f4f6',
                    color: type === 'OUT' ? 'white' : '#4b5563',
                  }}
                >
                  <ArrowDown style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.25rem' }} /> Stock Out
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !productName || !quantity || parseInt(quantity, 10) <= 0} 
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  Add Movement
                </>
              )}
            </Button>
          </form>
        </div>

        {/* === Recent Movements List === */}
        <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Recent Movements ({movements.length})</h2>

          {movements.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', color: '#6b7280', fontStyle: 'italic' }}>
              No stock movements recorded yet. Add one using the form on the left.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {movements.map((movement) => (
                <MovementItem key={movement.id} movement={movement} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;