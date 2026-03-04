export default function MetricsPanel({ metrics, accentColor = 'doctor' }) {
  if (!metrics) return null;

  const colorMap = {
    doctor: 'border-doctor/20 text-doctor',
    patient: 'border-patient/20 text-patient',
    researcher: 'border-researcher/20 text-researcher',
  };

  const bgMap = {
    doctor: 'bg-doctor/5',
    patient: 'bg-patient/5',
    researcher: 'bg-researcher/5',
  };

  const cards = [
    { label: 'Step Count', value: metrics.stepCount, unit: 'steps' },
    { label: 'Cadence', value: metrics.cadence, unit: 'steps/min' },
    { label: 'Stride Time (avg)', value: metrics.strideMean, unit: 's' },
    { label: 'Stride Time (SD)', value: metrics.strideStdDev, unit: 's' },
    { label: 'Symmetry Index', value: metrics.symmetryIndex, unit: '%' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${bgMap[accentColor]} border ${colorMap[accentColor]} rounded-xl p-4`}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${colorMap[accentColor].split(' ')[1]}`}>
            {card.value ?? '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{card.unit}</p>
        </div>
      ))}
    </div>
  );
}
