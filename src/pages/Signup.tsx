import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRegister } from '../utils/api';

export default function Signup() {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    // Doctor specific
    doctorName: '',
    doctorPhone: '',
    uniqueId: '',
    // Patient specific
    patientName: '',
    patientPhone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (role === 'doctor') {
      if (!formData.doctorName.trim() || !formData.doctorPhone.trim() || !formData.email.trim() || !formData.uniqueId.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
        setError('All fields are required');
        return;
      }
    } else {
      if (!formData.patientName.trim() || !formData.patientPhone.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
        setError('All fields are required');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: role
      };

      if (role === 'doctor') {
        payload.name = `Dr. ${formData.doctorName.trim()}`;
        payload.phone = formData.doctorPhone.trim();
        payload.uniqueId = formData.uniqueId.trim();
      } else {
        payload.name = formData.patientName.trim();
        payload.phone = formData.patientPhone.trim();
      }

      const data = await apiRegister(
        payload.email, 
        payload.password, 
        payload.role, 
        payload.name,
        payload.phone,
        payload.uniqueId
      );

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    doctor: {
      color: 'doctor',
      icon: (
        <svg className="w-8 h-8 text-doctor" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: 'Doctor Signup'
    },
    patient: {
      color: 'patient',
      icon: (
        <svg className="w-8 h-8 text-patient" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: 'Patient Signup'
    }
  };

  const config = roleConfig[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 p-8">
          {/* Role Selector */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              {['doctor', 'patient'].map((userRole) => (
                <button
                  key={userRole}
                  onClick={() => setRole(userRole)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-200 text-sm ${
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
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Doctor Signup Fields */}
            {role === 'doctor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 font-medium">Dr.</span>
                    <input
                      type="text"
                      name="doctorName"
                      value={formData.doctorName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-12 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                      placeholder="Rajesh Kumar"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {formData.doctorName && (
                    <p className="text-xs text-gray-400 mt-1">You will be registered as: <span className="text-gray-200 font-medium">Dr. {formData.doctorName}</span></p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="doctorPhone"
                    value={formData.doctorPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">NMC Registration Number</label>
                  <input
                    type="text"
                    name="uniqueId"
                    value={formData.uniqueId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                    placeholder="1234567/KA"
                    disabled={isLoading}
                    required
                  />
                </div>
              </>
            )}

            {/* Patient Signup Fields */}
            {role === 'patient' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                    placeholder="Arun Singh"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="patientPhone"
                    value={formData.patientPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                    required
                  />
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                placeholder="name@example.com"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                placeholder="••••••"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${config.color} focus:border-transparent transition`}
                placeholder="••••••"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-${config.color} hover:bg-${config.color}-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
