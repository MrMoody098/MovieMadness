import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [pendingContributors, setPendingContributors] = useState([]);
  const [approvedContributors, setApprovedContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAdmin && user) {
      fetchContributors();
    }
  }, [isAdmin, user]);

  const fetchContributors = async () => {
    try {
      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pending = data.filter(c => !c.is_approved);
      const approved = data.filter(c => c.is_approved);

      setPendingContributors(pending);
      setApprovedContributors(approved);
    } catch (error) {
      console.error('Error fetching contributors:', error);
      setMessage({ type: 'error', text: 'Failed to load contributors' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (contributorId, approve) => {
    try {
      const { error } = await supabase
        .from('contributors')
        .update({ is_approved: approve })
        .eq('id', contributorId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: approve ? 'Contributor approved!' : 'Contributor unapproved!',
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      fetchContributors();
    } catch (error) {
      console.error('Error updating contributor:', error);
      setMessage({ type: 'error', text: 'Failed to update contributor' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You must be an admin to access this panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel - User Management</h1>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="contributors-section">
        <h2>Pending Approval ({pendingContributors.length})</h2>
        {pendingContributors.length === 0 ? (
          <p className="empty-state">No pending contributors</p>
        ) : (
          <div className="contributors-list">
            {pendingContributors.map((contributor) => (
              <div key={contributor.id} className="contributor-card">
                <div className="contributor-info">
                  <h3>{contributor.display_name || 'No name'}</h3>
                  <p className="email">{contributor.email}</p>
                  <p className="date">
                    Joined: {new Date(contributor.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="contributor-actions">
                  <button
                    className="approve-button"
                    onClick={() => handleApproval(contributor.id, true)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleApproval(contributor.id, false)}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="contributors-section">
        <h2>Approved Contributors ({approvedContributors.length})</h2>
        {approvedContributors.length === 0 ? (
          <p className="empty-state">No approved contributors</p>
        ) : (
          <div className="contributors-list">
            {approvedContributors.map((contributor) => (
              <div key={contributor.id} className="contributor-card approved">
                <div className="contributor-info">
                  <h3>{contributor.display_name || 'No name'}</h3>
                  <p className="email">{contributor.email}</p>
                  <p className="date">
                    Approved: {new Date(contributor.updated_at || contributor.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="contributor-actions">
                  <button
                    className="revoke-button"
                    onClick={() => handleApproval(contributor.id, false)}
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
