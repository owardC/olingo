import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function OlingoMascot() {
  return (
    <svg viewBox="0 0 200 200" className="mascot" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="130" rx="50" ry="55" fill="#4CAF50"/>
      <ellipse cx="100" cy="140" rx="35" ry="40" fill="#A5D6A7"/>
      <circle cx="100" cy="70" r="40" fill="#4CAF50"/>
      <circle cx="100" cy="75" r="30" fill="#C8E6C9"/>
      <circle cx="88" cy="65" r="10" fill="white"/>
      <circle cx="112" cy="65" r="10" fill="white"/>
      <circle cx="90" cy="64" r="5" fill="#333"/>
      <circle cx="114" cy="64" r="5" fill="#333"/>
      <circle cx="92" cy="62" r="2" fill="white"/>
      <circle cx="116" cy="62" r="2" fill="white"/>
      <ellipse cx="100" cy="80" rx="8" ry="6" fill="#FF9800"/>
      <path d="M92 80 Q100 88 108 80" fill="none" stroke="#E65100" strokeWidth="1.5"/>
      <ellipse cx="55" cy="125" rx="15" ry="30" fill="#388E3C" transform="rotate(-15 55 125)"/>
      <ellipse cx="145" cy="125" rx="15" ry="30" fill="#388E3C" transform="rotate(15 145 125)"/>
      <ellipse cx="85" cy="182" rx="12" ry="6" fill="#FF9800"/>
      <ellipse cx="115" cy="182" rx="12" ry="6" fill="#FF9800"/>
      <rect x="78" y="35" width="44" height="6" fill="#333" rx="2"/>
      <rect x="90" y="28" width="20" height="10" fill="#333"/>
      <circle cx="100" cy="28" r="4" fill="#FFD700"/>
      <path d="M60 65 Q60 40 100 38 Q140 40 140 65" fill="none" stroke="#555" strokeWidth="4"/>
      <circle cx="60" cy="68" r="8" fill="#777"/>
      <circle cx="140" cy="68" r="8" fill="#777"/>
    </svg>
  );
}

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isSignup ? '/api/signup' : '/api/login';
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Authentication failed'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('email', email);
      onLogin(data.user_id, data.token, email);
    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing">
      <div className="landing-hero">
        <OlingoMascot />
        <h1 className="landing-title">Olingo</h1>
        <p className="landing-subtitle">Learn Vietnamese & Venezuelan Spanish the fun way</p>
        <div className="landing-features">
          <div className="feature">
            <span className="feature-icon">🎮</span>
            <span>90 interactive lessons per language</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✍️</span>
            <span>Type answers & drag-and-drop exercises</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💡</span>
            <span>Hover hints for instant translations</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <span>Track progress & earn XP</span>
          </div>
        </div>
      </div>
      <div className="landing-auth">
        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="auth-desc">
          {isSignup 
            ? "Start your language journey today — it's free!" 
            : 'Continue where you left off'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={4}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : isSignup ? 'Get Started Free' : 'Log In'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <button 
          type="button" 
          className="toggle-auth"
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
        >
          {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up free"}
        </button>
      </div>
    </div>
  );
}
