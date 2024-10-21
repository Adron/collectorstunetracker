import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './components/Login';
import About from './components/About';
import Collections from './components/Collections';
import Dashboard from './components/Dashboard';  // Make sure to import Dashboard

function App() {
  return (
    <Router>
      <div>
      

        <Routes>
          <Route path="/" element={<h1>Welcome to Collector's Tune Tracker</h1>} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/collections" element={<Collections />} />
        
        </Routes>

        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li><Link to="/dashboard">Dashboard</Link></li>

            <li>
              <Link to="/collections">Collections</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            
          </ul>
        </nav>
      </div>
    </Router>
  );
}

export default App;
