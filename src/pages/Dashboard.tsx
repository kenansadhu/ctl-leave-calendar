import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/auth-helpers-react';
import TeamMembers from '../components/TeamMembers';
import PublicHolidays from '../components/PublicHolidays';
import LeaveManager from '../components/LeaveManager';
import { Link } from 'react-router-dom';
import './Dashboard.css';

// This defines the type for the props our component will receive
interface DashboardProps {
  session: Session;
}

const Dashboard = ({ session }: DashboardProps) => {

  // This function calls Supabase to sign the user out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome, Admin!</h2>
      <Link to="/">Go to Public Calendar View</Link>
      <p>You are logged in as: <strong>{session.user.email}</strong></p>
      <button onClick={handleSignOut}>
        Sign Out
      </button>
      <hr style={{ margin: '2rem 0' }}/>

      {/* The rest of our admin tools will go here */}
      <h3>Leave Management Dashboard</h3>
      <LeaveManager />
      <PublicHolidays />
      <TeamMembers />
    </div>
  );
};

export default Dashboard;