export default function FilterControls({ activeFilter, onFilterChange, accentColor = 'doctor' }) {
  const filters = [
    { key: 'raw', label: 'Raw' },
    { key: 'moving_avg', label: 'Moving Average' },
    { key: 'kalman', label: 'Kalman' },
  ];

  const activeStyles = {
    doctor: 'bg-doctor text-white',
    patient: 'bg-patient text-white',
    researcher: 'bg-researcher text-white',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 uppercase tracking-wide mr-2">Filter:</span>
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            activeFilter === f.key
              ? activeStyles[accentColor]
              : 'bg-dark-700 text-gray-400 hover:text-gray-200 hover:bg-dark-600'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
