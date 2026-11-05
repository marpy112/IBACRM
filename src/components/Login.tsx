import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { login, signup } from '../services/api';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }

        // Call signup API
        const result = await signup(email, password, confirmPassword);
        localStorage.setItem('currentAdmin', result.email);
        onLoginSuccess(result.email);
      } else {
        // Call login API
        const result = await login(email, password);
        localStorage.setItem('currentAdmin', result.email);
        onLoginSuccess(result.email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-story">
        <Link to="/" className="login-brand"><img src="/iba-logo.png" alt="IBA College of Mindanao" /><span>Research Atlas<small>IBA College of Mindanao Inc.</small></span></Link>
        <div className="login-story-copy"><p className="eyebrow">The research community</p><h1>Every study.<br />A sense of place.</h1><p>Bring research to life. Connect discoveries with the people and places that make them possible.</p><Link to="/">Explore the public map <Icon name="arrow" /></Link></div>
        <p className="login-story-footer">Knowledge connected to place.</p>
      </div>
      <div className="login-form-side">
      <Link to="/" className="text-link login-back">← Back to the map</Link>
      <div className="login-card">
        <p className="eyebrow">Admin portal</p>
        <h2 className="login-title">{isSignUp ? 'Join the workspace.' : 'Welcome back.'}</h2>
        <p className="login-subtitle">{isSignUp ? 'Create an account to manage the research collection.' : 'Sign in to manage your research and locations.'}</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@iba.edu.ph"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <label className="show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show password</label>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          )}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'} <Icon name="arrow" width={17} height={17} />
          </button>
        </form>

        <p className="toggle-link">
          {isSignUp ? 'Already have an account? ' : 'Need an account? '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="toggle-button"
            disabled={isSubmitting}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
