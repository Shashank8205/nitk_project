import { useState, useMemo, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import FileUpload from '../components/FileUpload';
import SensorChart from '../components/SensorChart';
import MetricsPanel from '../components/MetricsPanel';
import FilterControls from '../components/FilterControls';
import { parseCSV, autoDetectColumns } from '../utils/csvParser';
import { applyFilterToMultipleKeys } from '../utils/filters';
import { computeGaitMetrics, addMagnitudeColumn } from '../utils/gaitMetrics';
import { apiUploadCSV, apiGetSessions, apiSaveMetrics, apiGetSession } from '../utils/api';

export default function ResearcherDashboard() {
  const [rawData, setRawData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [filter, setFilter] = useState('raw');
  const [selectedAxis, setSelectedAxis] = useState('all');
  const [selectedSensor, setSelectedSensor] = useState('all');
  const [compareFilters, setCompareFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    apiGetSessions().then((res) => setSessions(res.sessions)).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    setLoading(true);
    try {
      const uploadResult = await apiUploadCSV(file);
      setSessionId(uploadResult.sessionId);

      const data = await parseCSV(file);
      const cols = autoDetectColumns(Object.keys(data[0]));
      setRawData(data);
      setColumns(cols);

      apiGetSessions().then((res) => setSessions(res.sessions)).catch(() => {});
    } catch (err) {
      console.error('CSV parse error:', err);
    }
    setLoading(false);
  };

  const loadSession = async (id) => {
    setLoading(true);
    try {
      const res = await apiGetSession(id);
      const cols = autoDetectColumns(Object.keys(res.data[0]));
      setRawData(res.data);
      setColumns(cols);
      setSessionId(id);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
    setLoading(false);
  };

  const filteredColumns = useMemo(() => {
    if (!columns) return { accel: [], gyro: [] };

    let accel = [...columns.accelCols];
    let gyro = [...columns.gyroCols];

    if (selectedAxis !== 'all') {
      const axisLetter = selectedAxis.toLowerCase();
      accel = accel.filter((c) => c.toLowerCase().includes(axisLetter));
      gyro = gyro.filter((c) => c.toLowerCase().includes(axisLetter));
    }

    if (selectedSensor !== 'all') {
      const sensorId = selectedSensor;
      accel = accel.filter((c) => {
        const lower = c.toLowerCase();
        return lower.includes(`s${sensorId}`) || lower.includes(`sensor${sensorId}`) || lower.includes(`sensor_${sensorId}`) || lower.includes(`mpu${sensorId}`);
      });
      gyro = gyro.filter((c) => {
        const lower = c.toLowerCase();
        return lower.includes(`s${sensorId}`) || lower.includes(`sensor${sensorId}`) || lower.includes(`sensor_${sensorId}`) || lower.includes(`mpu${sensorId}`);
      });
    }

    return { accel, gyro };
  }, [columns, selectedAxis, selectedSensor]);

  const processedData = useMemo(() => {
    if (!rawData || !columns) return null;

    let data = rawData.map((row, i) => ({ ...row, index: i }));

    if (columns.accelCols.length >= 3) {
      data = addMagnitudeColumn(data, columns.accelCols[0], columns.accelCols[1], columns.accelCols[2], 'accel_magnitude');
    }

    let filtered = data;
    if (filter !== 'raw') {
      const keysToFilter = [...columns.accelCols, ...columns.gyroCols];
      if (columns.accelCols.length >= 3) keysToFilter.push('accel_magnitude');
      filtered = applyFilterToMultipleKeys(data, filter, keysToFilter);
    }

    let metrics = null;
    if (columns.accelCols.length >= 3) {
      metrics = computeGaitMetrics(filtered, columns.accelCols[0], columns.accelCols[1], columns.accelCols[2]);
    }

    if (metrics && sessionId) {
      apiSaveMetrics(sessionId, {
        stepCount: metrics.stepCount,
        cadence: metrics.cadence,
        strideMean: metrics.strideMean,
        strideStdDev: metrics.strideStdDev,
        symmetryIndex: metrics.symmetryIndex,
      }).catch(() => {});
    }

    return { raw: data, data: filtered, metrics };
  }, [rawData, columns, filter, sessionId]);

  const comparisonData = useMemo(() => {
    if (!compareFilters || !rawData || !columns) return null;

    const data = rawData.map((row, i) => ({ ...row, index: i }));
    const keysToFilter = columns.accelCols.length >= 3 ? [columns.accelCols[0]] : [];
    if (keysToFilter.length === 0) return null;

    const key = keysToFilter[0];
    const maData = applyFilterToMultipleKeys(data, 'moving_avg', [key]);
    const kalmanData = applyFilterToMultipleKeys(data, 'kalman', [key]);

    return data.map((row, i) => ({
      index: i,
      raw: row[key],
      moving_avg: maData[i][key],
      kalman: kalmanData[i][key],
    }));
  }, [compareFilters, rawData, columns]);

  const handleExport = useCallback(() => {
    if (!processedData) return;
    const exportObj = {
      metadata: {
        exportedAt: new Date().toISOString(),
        filter,
        totalSamples: processedData.data.length,
      },
      metrics: processedData.metrics,
      data: processedData.data.slice(0, 1000),
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gait_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processedData, filter]);

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar role="researcher" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Researcher Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Full signal access & analysis tools</p>
            </div>
            {rawData && (
              <div className="flex items-center gap-3">
                <FilterControls activeFilter={filter} onFilterChange={setFilter} accentColor="researcher" />
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-researcher hover:bg-researcher-dark text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>

          {!rawData && sessions.length > 0 && (
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Previous Sessions</h3>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-left"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{s.filename}</p>
                      <p className="text-gray-500 text-xs">{s.sample_count} samples &middot; {s.duration_sec}s</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(s.uploaded_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!rawData && <FileUpload onFileLoaded={handleFile} accentColor="researcher" />}

          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-researcher border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 mt-3">Processing sensor data...</p>
            </div>
          )}

          {rawData && !loading && (
            <>
              <div className="flex flex-wrap items-center gap-4 bg-dark-800 rounded-xl border border-dark-600 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Axis:</span>
                  {['all', 'x', 'y', 'z'].map((axis) => (
                    <button
                      key={axis}
                      onClick={() => setSelectedAxis(axis)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedAxis === axis
                          ? 'bg-researcher text-white'
                          : 'bg-dark-700 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {axis.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="w-px h-8 bg-dark-600" />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Sensor:</span>
                  {['all', '1', '2', '3', '4'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSensor(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedSensor === s
                          ? 'bg-researcher text-white'
                          : 'bg-dark-700 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {s === 'all' ? 'ALL' : `S${s}`}
                    </button>
                  ))}
                </div>

                <div className="w-px h-8 bg-dark-600" />

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareFilters}
                    onChange={(e) => setCompareFilters(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-researcher focus:ring-researcher"
                  />
                  <span className="text-xs text-gray-400">Compare Filters</span>
                </label>
              </div>

              {processedData && <MetricsPanel metrics={processedData.metrics} accentColor="researcher" />}

              {processedData && filteredColumns.accel.length > 0 && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={filteredColumns.accel}
                  title={`Acceleration ${selectedAxis !== 'all' ? `(${selectedAxis.toUpperCase()})` : '(All Axes)'} ${selectedSensor !== 'all' ? `— Sensor ${selectedSensor}` : ''}`}
                  syncId="researcher"
                />
              )}

              {processedData && filteredColumns.gyro.length > 0 && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={filteredColumns.gyro}
                  title={`Gyroscope ${selectedAxis !== 'all' ? `(${selectedAxis.toUpperCase()})` : '(All Axes)'} ${selectedSensor !== 'all' ? `— Sensor ${selectedSensor}` : ''}`}
                  syncId="researcher"
                />
              )}

              {processedData?.data[0]?.accel_magnitude !== undefined && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={['accel_magnitude']}
                  title="Acceleration Magnitude"
                  stepMarkers={processedData.metrics?.steps || []}
                  syncId="researcher"
                />
              )}

              {compareFilters && comparisonData && (
                <SensorChart
                  data={comparisonData}
                  dataKeys={['raw', 'moving_avg', 'kalman']}
                  title="Filter Comparison (First Accel Column)"
                  syncId="researcher-compare"
                />
              )}

              <div className="flex justify-between">
                <div className="text-xs text-gray-500">
                  {processedData?.data.length ?? 0} samples loaded &middot; {columns?.allColumns.length ?? 0} columns detected
                </div>
                <button
                  onClick={() => {
                    setRawData(null);
                    setColumns(null);
                    setFilter('raw');
                    setSelectedAxis('all');
                    setSelectedSensor('all');
                    setCompareFilters(false);
                    setSessionId(null);
                  }}
                  className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 text-sm transition-colors"
                >
                  Upload New File
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
