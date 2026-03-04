import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#06b6d4'];

export default function SensorChart({
  data,
  dataKeys,
  title,
  xKey = 'index',
  height = 300,
  stepMarkers = [],
  syncId,
}) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((row, i) => ({
    ...row,
    index: row[xKey] ?? i,
  }));

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 p-4">
      {title && <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} syncId={syncId}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="index"
            stroke="#475569"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
          />
          <YAxis
            stroke="#475569"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          {dataKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={1.5}
              name={key}
            />
          ))}
          {stepMarkers.map((step, i) => (
            <ReferenceDot
              key={i}
              x={step.index}
              y={step.value}
              r={4}
              fill="#ef4444"
              stroke="#ef4444"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
