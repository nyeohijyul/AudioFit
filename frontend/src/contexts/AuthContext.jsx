import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import '../firebaseConfig';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUserState) => {
      if (firebaseUserState) {
        const idToken = await firebaseUserState.getIdToken();
        setFirebaseUser(firebaseUserState);
        setUser({ uid: firebaseUserState.uid, email: firebaseUserState.email, name: firebaseUserState.displayName });
        setToken(idToken);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const getToken = useCallback(async (forceRefresh = false) => {
    if (!firebaseUser) {
      return null;
    }
    try {
      const idToken = await firebaseUser.getIdToken(forceRefresh);
      setToken(idToken);
      return idToken;
    } catch (error) {
      console.error('Failed to refresh Firebase token', error);
      return null;
    }
  }, [firebaseUser]);

  const loginWithGoogle = () => {
    const auth = getAuth();
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    const auth = getAuth();
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, token, getToken, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
