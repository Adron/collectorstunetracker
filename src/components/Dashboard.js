import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Correct hook for navigation in React

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Use navigate instead of useRouter

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login'); // Use navigate instead of useRouter for redirection
    }
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Notes:</strong> {user.notes || 'No notes available'}</p>
      <p><strong>Message:</strong> {user.message || 'No message available'}</p>
    </div>
  );
}

export default Dashboard;
