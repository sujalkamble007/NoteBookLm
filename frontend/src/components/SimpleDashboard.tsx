import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SimpleDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome, {user?.name || user?.email}!
          </h2>
          <p className="text-gray-600">
            You are successfully logged in to your account.
          </p>
          {/* NotebookLM Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">NotebookLM</h3>
                <p className="text-gray-600 mb-4">
                  Upload documents and chat with your content using AI-powered analysis
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Document Upload</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">AI Q&A</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Vector Search</span>
                </div>
              </div>
              <div className="ml-6">
                <button
                  onClick={() => navigate('/notebook')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Open NotebookLM
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">User Information</h3>
            <div className="space-y-2">
              <p className="text-blue-700"><strong>Name:</strong> {user?.name || 'Not provided'}</p>
              <p className="text-blue-700"><strong>Email:</strong> {user?.email}</p>
              <p className="text-blue-700"><strong>User ID:</strong> {user?._id || 'N/A'}</p>
              <p className="text-blue-700"><strong>Plan:</strong> {user?.plan || 'N/A'}</p>
              <p className="text-blue-700"><strong>Email Verified:</strong> {user?.isEmailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleDashboard;