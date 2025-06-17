import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/auth-helpers-react'; // <-- This is the corrected line

// Import our page components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/Home';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session data
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // We wait until the session is loaded before rendering the app
  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* The Home page is public and available at the root URL */}
        <Route path="/" element={<Home />} />

        {/* If the user is not logged in, show the login page.
            If they are logged in, redirect them away from /login to the /admin page. */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/admin" />} />

        {/* The Admin Dashboard is a protected page.
            If the user is logged in, show the dashboard.
            If not, redirect them to the /login page. */}
        <Route path="/admin" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;