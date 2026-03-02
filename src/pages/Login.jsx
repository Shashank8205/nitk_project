import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleConfig = {
    doctor: {
      color: 'doctor',
      icon: (
        <svg className="w-8 h-8 text-doctor" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: 'Doctor Portal',
      placeholder: 'doctor@gait.com',
      buttonText: 'Sign In as Doctor',
      dashboard: '/doctor/dashboard'
    },
    patient: {
      color: 'patient',
      icon: (
        <svg className="w-8 h-8 text-patient" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: 'Patient Portal',
      placeholder: 'patient@gait.com',
      buttonText: 'Sign In as Patient',
      dashboard: '/patient/dashboard'
    }
  };

  const config = roleConfig[role];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(email, password, role);
      if (result.success) {
        navigate(config.dashboard);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 p-8">
          {/* Role Selector */}
          <div className="mb-8">
            <div className="flex gap-4 mb-6">
              {['doctor', 'patient'].map((userRole) => (
                <button
                  key={userRole}
                  onClick={() => setRole(userRole)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    role === userRole
                      ? `bg-${roleConfig[userRole].color} text-white`
                      : 'bg-dark-700 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 bg-${config.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              {config.icon}
            </div>
            <h1 className="text-2xl font-bold text-white">{config.title}</h1>
            <p className="text-gray-400 mt-1">Gait Signal Analysis Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                placeholder={config.placeholder}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                placeholder="••••••"
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-${config.color} hover:bg-${config.color}-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Signing in...' : config.buttonText}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
