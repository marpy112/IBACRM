import { useState, useEffect } from 'react';
import { fetchAccounts, createAccount, deleteAccount, updateAccountPassword } from '../services/api';
import './AccountManagement.css';

export interface AdminAccount {
  _id: string;
  email: string;
  createdAt?: string;
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchAccounts();
      setAccounts(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await createAccount(formData.email, formData.password);
      setSuccess(`Account "${formData.email}" created successfully!`);
      setFormData({ email: '', password: '', confirmPassword: '' });
      setShowAddForm(false);
      await loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  const handleDeleteAccount = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete account "${email}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteAccount(id);
      setSuccess(`Account "${email}" deleted successfully!`);
      await loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const handleChangePassword = async (e: React.FormEvent, accountId: string) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordForm.newPassword) {
      setError('New password is required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await updateAccountPassword(accountId, passwordForm.newPassword);
      setSuccess('Password updated successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  if (loading) {
    return <div className="account-management">Loading accounts...</div>;
  }

  return (
    <div className="account-management">
      <div className="account-header">
        <h2>Account Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-account-button"
        >
          {showAddForm ? '✕ Cancel' : '+ Add New Account'}
        </button>
      </div>

      {error && <div className="account-error">{error}</div>}
      {success && <div className="account-success">{success}</div>}

      {showAddForm && (
        <form onSubmit={handleAddAccount} className="account-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              required
            />
          </div>

          <button type="submit" className="submit-button">
            Create Account
          </button>
        </form>
      )}

      <div className="accounts-list">
        <h3>Admin Accounts ({accounts.length})</h3>

        {accounts.length === 0 ? (
          <p className="no-accounts">No admin accounts found.</p>
        ) : (
          <div className="accounts-table">
            <div className="table-header">
              <div className="table-cell">Email</div>
              <div className="table-cell">Created</div>
              <div className="table-cell">Actions</div>
            </div>

            {accounts.map((account) => (
              <div key={account._id} className="table-row">
                <div className="table-cell">{account.email}</div>
                <div className="table-cell">
                  {account.createdAt
                    ? new Date(account.createdAt).toLocaleDateString()
                    : 'N/A'}
                </div>
                <div className="table-cell actions">
                  <button
                    onClick={() =>
                      setShowPasswordForm(
                        showPasswordForm === account._id ? null : account._id
                      )
                    }
                    className="change-password-button"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account._id, account.email)}
                    className="delete-account-button"
                  >
                    Delete
                  </button>
                </div>

                {showPasswordForm === account._id && (
                  <form
                    onSubmit={(e) => handleChangePassword(e, account._id)}
                    className="password-form"
                  >
                    <div className="form-group">
                      <label htmlFor={`newPassword-${account._id}`}>
                        New Password *
                      </label>
                      <input
                        type="password"
                        id={`newPassword-${account._id}`}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="At least 6 characters"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`confirmPassword-${account._id}`}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        id={`confirmPassword-${account._id}`}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm password"
                        required
                      />
                    </div>

                    <button type="submit" className="submit-button">
                      Update Password
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
