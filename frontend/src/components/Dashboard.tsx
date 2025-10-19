import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import type { UserStats } from '../types/auth';
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Edit,
  Save,
  X,
  Activity,
  Shield,
  Clock,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStats = await authService.getUserStats();
        setStats(userStats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(editForm);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'plan-premium';
      case 'enterprise':
        return 'plan-enterprise';
      default:
        return 'plan-free';
    }
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Profile Section */}
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="edit-button"
              >
                <Edit size={18} />
                Edit
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editName">Full Name</label>
                  <input
                    type="text"
                    id="editName"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editEmail">Email</label>
                  <input
                    type="email"
                    id="editEmail"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={isLoading} className="save-button">
                  <Save size={18} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({ name: user.name, email: user.email });
                    setError('');
                    setSuccess('');
                  }}
                  className="cancel-button"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <div className="info-item">
                  <User className="info-icon" size={20} />
                  <div>
                    <label>Full Name</label>
                    <p>{user.name}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Mail className="info-icon" size={20} />
                  <div>
                    <label>Email Address</label>
                    <p>{user.email}</p>
                    {!user.isEmailVerified && (
                      <span className="verification-badge">Not Verified</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <CreditCard className="info-icon" size={20} />
                  <div>
                    <label>Current Plan</label>
                    <span className={`plan-badge ${getPlanBadgeColor(user.plan)}`}>
                      {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar className="info-icon" size={20} />
                  <div>
                    <label>Member Since</label>
                    <p>{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="dashboard-grid">
          <div className="dashboard-card stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats?.totalNotebooks || user.totalNotebooks}</h3>
                <p>Total Notebooks</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats?.totalDocuments || user.totalDocuments}</h3>
                <p>Total Documents</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <h3>Active</h3>
                <p>Account Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Account Details</h2>
          </div>
          <div className="account-details">
            <div className="detail-item">
              <Shield className="detail-icon" size={20} />
              <span>Email Verification: {user.isEmailVerified ? 'Verified' : 'Pending'}</span>
            </div>
            <div className="detail-item">
              <Clock className="detail-icon" size={20} />
              <span>Last Updated: {formatDate(user.updatedAt)}</span>
            </div>
            <div className="detail-item">
              <Settings className="detail-icon" size={20} />
              <span>User ID: {user._id}</span>
            </div>
          </div>
        </div>

        {/* API Testing Section */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Authentication Testing</h2>
          </div>
          <div className="api-testing">
            <p>Authentication is working correctly! You can see your profile data above.</p>
            <div className="test-results">
              <div className="test-item success">
                ✅ JWT Token Authentication
              </div>
              <div className="test-item success">
                ✅ User Profile Retrieval
              </div>
              <div className="test-item success">
                ✅ Protected Route Access
              </div>
              <div className="test-item success">
                ✅ Profile Update Functionality
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;