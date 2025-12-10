import { useState, useEffect } from 'react'
import './App.css'
import GuestHome from './components/GuestHome'
import UserHome from './components/UserHome'
import { API_BASE_URL } from './config';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then(data => setUser(data))
      .catch(err => console.log("Session validation failed", err));
  }, []);

  const handleLogin = () => {
    // After login, fetch user data
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Login verification failed");
      })
      .then(data => setUser(data))
      .catch(console.error);
  }

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
      .finally(() => setUser(null));
  }

  return (
    <>
      {user ? (
        <UserHome user={user} onLogout={handleLogout} />
      ) : (
        <GuestHome onLogin={handleLogin} />
      )}
    </>
  )
}

export default App
