import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SensorChart from '../components/SensorChart';
import MetricsPanel from '../components/MetricsPanel';
import FilterControls from '../components/FilterControls';
import { parseCSV, autoDetectColumns } from '../utils/csvParser';
import { applyFilterToMultipleKeys } from '../utils/filters';
import { computeGaitMetrics, addMagnitudeColumn } from '../utils/gaitMetrics';
import { apiUploadCSV, apiGetSessions, apiSaveMetrics, apiGetSession, apiAddPatient, apiGetPatients } from '../utils/api';

export default function DoctorDashboard() {
  const [rawData, setRawData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [filter, setFilter] = useState('raw');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    email: '',
    password: '',
    phone: '',
  });
  const [patientCsvFile, setPatientCsvFile] = useState<File | null>(null);
  const [patientFormError, setPatientFormError] = useState<string | null>(null);
  const [patientFormSuccess, setPatientFormSuccess] = useState<string | null>(null);
  const [patientSubmitting, setPatientSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    apiGetSessions().then((sessions) => setSessions(sessions)).catch(() => {});
    apiGetPatients().then((res) => setPatients(res.patients || [])).catch(() => {});
  }, []);

  const handleFile = async (file: File, patientId: string | null) => {
    setLoading(true);
    try {
      const uploadResult = await apiUploadCSV(file, patientId || undefined);
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

  const handlePatientFormChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePatientAndUpload = async (e) => {
    e.preventDefault();
    setPatientFormError(null);
    setPatientFormSuccess(null);

    if (!patientForm.name || !patientForm.email || !patientForm.password) {
      setPatientFormError('Name, email, and password are required.');
      return;
    }

    if (!patientCsvFile) {
      setPatientFormError('Please select a CSV file to upload.');
      return;
    }

    setPatientSubmitting(true);
    try {
      const [firstName, ...rest] = patientForm.name.trim().split(' ');
      const lastName = rest.join(' ');

      const age = patientForm.age ? Number(patientForm.age) : undefined;
      const height = patientForm.height ? Number(patientForm.height) : undefined;
      const weight = patientForm.weight ? Number(patientForm.weight) : undefined;

      const patientRes = await apiAddPatient(
        firstName,
        lastName,
        patientForm.email,
        patientForm.password,
        patientForm.phone,
        age,
        height,
        weight
      );

      const newPatient = patientRes.patient;
      setPatients((prev) => [newPatient, ...prev]);
      setSelectedPatientId(newPatient.id);

      // Upload CSV for this patient in background, but stay on this screen
      const uploadResult = await apiUploadCSV(patientCsvFile, newPatient.id);
      setSessions((prev) => [uploadResult, ...prev]);

      setPatientFormSuccess('Patient created and CSV uploaded successfully. Select the patient on the left to view analysis.');
      setPatientForm({
        name: '',
        age: '',
        height: '',
        weight: '',
        email: '',
        password: '',
        phone: '',
      });
      setPatientCsvFile(null);
      setShowPatientForm(false);
    } catch (err: any) {
      setPatientFormError(err.message || 'Failed to create patient and upload CSV.');
    } finally {
      setPatientSubmitting(false);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);

    if (!sessions || sessions.length === 0) return;

    const sessionForPatient = sessions.find((s) => {
      if (!s.user_id) return false;
      if (typeof s.user_id === 'string') return s.user_id === patientId;
      return s.user_id._id === patientId;
    });

    if (!sessionForPatient || !sessionForPatient.data || sessionForPatient.data.length === 0) return;

    const data = sessionForPatient.data;
    const cols = autoDetectColumns(Object.keys(data[0]));
    setRawData(data);
    setColumns(cols);
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

  const processedData = useMemo(() => {
    if (!rawData || !columns) return null;

    const accelCols = columns.accelCols;
    const gyroCols = columns.gyroCols;
    const allSignalKeys = [...accelCols, ...gyroCols];

    let data = rawData.map((row, i) => ({ ...row, index: i }));

    if (accelCols.length >= 3) {
      data = addMagnitudeColumn(data, accelCols[0], accelCols[1], accelCols[2], 'accel_magnitude');
    }

    if (gyroCols.length >= 3) {
      data = addMagnitudeColumn(data, gyroCols[0], gyroCols[1], gyroCols[2], 'gyro_magnitude');
    }

    let filtered = data;
    if (filter !== 'raw') {
      const keysToFilter = [...allSignalKeys];
      if (accelCols.length >= 3) keysToFilter.push('accel_magnitude');
      if (gyroCols.length >= 3) keysToFilter.push('gyro_magnitude');
      filtered = applyFilterToMultipleKeys(data, filter, keysToFilter);
    }

    let metrics = null;
    if (accelCols.length >= 3) {
      metrics = computeGaitMetrics(filtered, accelCols[0], accelCols[1], accelCols[2]);
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

    return { data: filtered, metrics, accelCols, gyroCols };
  }, [rawData, columns, filter, sessionId]);

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar role="doctor" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Comprehensive gait signal analysis</p>
            </div>
            {rawData && <FilterControls activeFilter={filter} onFilterChange={setFilter} accentColor="doctor" />}
          </div>

          {!rawData && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-4 items-start">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300">Your Patients</h3>
                  <span className="text-xs text-gray-500">
                    {patients.length === 0 ? 'No patients yet' : `${patients.length} patient${patients.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                {patients.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Use the "Add Patient & Upload CSV" card below to register your first patient.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {patients.map((p) => {
                      const id = p.id || p._id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            navigate(`/doctor/patients/${id}`, {
                              state: { patient: p },
                            })
                          }
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm transition-colors ${
                            selectedPatientId === id
                              ? 'bg-doctor/20 text-white'
                              : 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{p.email}</p>
                          </div>
                          <div className="text-right ml-4">
                            {p.age && (
                              <p className="text-[11px] text-gray-400">
                                {p.age} yrs
                                {p.height_cm ? ` · ${p.height_cm} cm` : ''}
                                {p.weight_kg ? ` · ${p.weight_kg} kg` : ''}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-500">Tap to view analysis</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Add Patient & Upload CSV</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Create a new patient with basic details, then upload their gait CSV file for analysis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPatientForm((v) => !v)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-doctor/10 text-doctor hover:bg-doctor/20 transition-colors"
                  >
                    {showPatientForm ? 'Hide Form' : 'Add Patient'}
                  </button>
                </div>

                {showPatientForm && (
                  <form onSubmit={handleCreatePatientAndUpload} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Patient Name</label>
                        <input
                          type="text"
                          name="name"
                          value={patientForm.name}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={patientForm.email}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="patient@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Temporary Password</label>
                        <input
                          type="password"
                          name="password"
                          value={patientForm.password}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="Set a temporary password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Phone (optional)</label>
                        <input
                          type="tel"
                          name="phone"
                          value={patientForm.phone}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={patientForm.age}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="Age in years"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          name="height"
                          value={patientForm.height}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="Height in cm"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          name="weight"
                          value={patientForm.weight}
                          onChange={handlePatientFormChange}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-sm text-white focus:outline-none focus:border-doctor"
                          placeholder="Weight in kg"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Gait CSV File</label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setPatientCsvFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-doctor/20 file:text-doctor hover:file:bg-doctor/30"
                        />
                      </div>
                    </div>

                    {patientFormError && (
                      <p className="text-sm text-red-400">{patientFormError}</p>
                    )}
                    {patientFormSuccess && (
                      <p className="text-sm text-emerald-400">{patientFormSuccess}</p>
                    )}

                    <button
                      type="submit"
                      disabled={patientSubmitting}
                      className="px-4 py-2 rounded-lg bg-doctor text-white text-sm font-medium hover:bg-doctor/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {patientSubmitting ? 'Saving & Uploading...' : 'Save Patient & Upload CSV'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-doctor border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 mt-3">Processing sensor data...</p>
            </div>
          )}

          {processedData && (
            <>
              <MetricsPanel metrics={processedData.metrics} accentColor="doctor" />

              {processedData.accelCols.length > 0 && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={processedData.accelCols}
                  title="Acceleration (X, Y, Z)"
                  syncId="doctor"
                />
              )}

              {processedData.gyroCols.length > 0 && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={processedData.gyroCols}
                  title="Gyroscope (X, Y, Z)"
                  syncId="doctor"
                />
              )}

              {processedData.data[0]?.accel_magnitude !== undefined && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={['accel_magnitude']}
                  title="Acceleration Magnitude"
                  stepMarkers={processedData.metrics?.steps || []}
                  syncId="doctor"
                />
              )}

              {processedData.data[0]?.gyro_magnitude !== undefined && (
                <SensorChart
                  data={processedData.data}
                  dataKeys={['gyro_magnitude']}
                  title="Gyroscope Magnitude"
                  syncId="doctor"
                />
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setRawData(null);
                    setColumns(null);
                    setFilter('raw');
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
