import { useState, useMemo, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import FileUpload from '../components/FileUpload';
import { parseCSV, autoDetectColumns } from '../utils/csvParser';
import { computeGaitMetrics } from '../utils/gaitMetrics';
import { apiUploadCSV, apiGetSessions, apiSaveMetrics, apiGetSession } from '../utils/api';

export default function PatientDashboard() {
  const [rawData, setRawData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    apiGetSessions().then((sessions) => setSessions(sessions)).catch(() => {});
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

      apiGetSessions().then((sessions) => setSessions(sessions)).catch(() => {});
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

  const metrics = useMemo(() => {
    if (!rawData || !columns) return null;
    const accelCols = columns.accelCols;
    if (accelCols.length < 3) return null;
    const m = computeGaitMetrics(rawData, accelCols[0], accelCols[1], accelCols[2]);

    if (m && sessionId) {
      apiSaveMetrics(sessionId, {
        stepCount: m.stepCount,
        cadence: m.cadence,
        strideMean: m.strideMean,
        strideStdDev: m.strideStdDev,
        symmetryIndex: m.symmetryIndex,
      }).catch(() => {});
    }

    return m;
  }, [rawData, columns, sessionId]);

  const progressPercent = useMemo(() => {
    if (!metrics) return 0;
    const target = 100;
    return Math.min(100, Math.round((metrics.stepCount / target) * 100));
  }, [metrics]);

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar role="patient" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Patient Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Your gait activity summary</p>
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

          {!rawData && <FileUpload onFileLoaded={handleFile} accentColor="patient" />}

          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-patient border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 mt-3">Analyzing your data...</p>
            </div>
          )}

          {metrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800 border border-patient/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-patient/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-patient" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Steps Detected</p>
                      <p className="text-3xl font-bold text-patient">{metrics.stepCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800 border border-patient/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-patient/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-patient" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Cadence</p>
                      <p className="text-3xl font-bold text-patient">{metrics.cadence}</p>
                      <p className="text-xs text-gray-500">steps/min</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 border border-patient/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Activity Progress</p>
                    <p className="text-xs text-gray-500 mt-1">Based on detected steps</p>
                  </div>
                  <span className="text-2xl font-bold text-patient">{progressPercent}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-patient-dark to-patient h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>0 steps</span>
                  <span>Target: 100 steps</span>
                </div>
              </div>

              <div className="bg-dark-800 border border-patient/20 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Session Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-dark-600">
                    <span className="text-gray-400 text-sm">Average Stride Time</span>
                    <span className="text-white font-medium">{metrics.strideMean}s</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-dark-600">
                    <span className="text-gray-400 text-sm">Stride Variability</span>
                    <span className="text-white font-medium">{metrics.strideStdDev}s</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Gait Symmetry</span>
                    <span className="text-white font-medium">{metrics.symmetryIndex}%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setRawData(null);
                    setColumns(null);
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
