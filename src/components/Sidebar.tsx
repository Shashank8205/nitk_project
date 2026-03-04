import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();

  const colorMap = {
    doctor: { bg: 'bg-doctor', text: 'text-doctor', hover: 'hover:bg-doctor/10', active: 'bg-doctor/10 text-doctor' },
    patient: { bg: 'bg-patient', text: 'text-patient', hover: 'hover:bg-patient/10', active: 'bg-patient/10 text-patient' },
    researcher: { bg: 'bg-researcher', text: 'text-researcher', hover: 'hover:bg-researcher/10', active: 'bg-researcher/10 text-researcher' },
  };
  const c = colorMap[role];

  const roleLabels = { doctor: 'Doctor', patient: 'Patient', researcher: 'Researcher' };

  return (
    <aside className="w-64 min-h-screen bg-dark-800 border-r border-dark-600 flex flex-col">
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">GA</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Gait Analysis</h2>
            <p className={`text-xs ${c.text}`}>{roleLabels[role]} Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to={`/${role}/dashboard`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
              isActive ? c.active : `text-gray-400 ${c.hover}`
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Dashboard
        </NavLink>
      </nav>

      <div className="p-4 border-t border-dark-600">
        <div className="flex items-center gap-3 px-4 py-2 mb-3">
          <div className={`w-8 h-8 ${c.bg} rounded-full flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.firstName || user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
