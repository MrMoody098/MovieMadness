import React, { useState } from 'react';
import Modal from 'react-modal';
import { useAuth } from '../../contexts/AuthContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onRequestClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          // Check if it's an approval error
          if (error.message && error.message.includes('approval')) {
            setError('Please wait for account approval before signing in.');
          } else {
            throw error;
          }
        } else {
          setSuccess('Successfully signed in!');
          setTimeout(() => {
            onRequestClose();
            resetForm();
          }, 1000);
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        setSuccess('Account created! Your account is pending approval. You will be able to sign in once approved.');
        setTimeout(() => {
          setMode('login');
          resetForm();
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setSuccess('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Authentication"
      className="auth-modal"
      overlayClassName="auth-modal-overlay"
    >
      <div className="auth-container">
        <button className="close-button" onClick={onRequestClose}>×</button>
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        
        {mode === 'signup' && (
          <p className="signup-description">
            Create an account to access additional features. Account approval required.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="switch-mode">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={switchMode} className="link-button">
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={switchMode} className="link-button">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;
