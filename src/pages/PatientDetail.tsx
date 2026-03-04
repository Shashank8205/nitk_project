import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiDeletePatient } from '../utils/api';
import FileUpload from '../components/FileUpload';
import { apiUploadCSV } from '../utils/api';

type Patient = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
};

export default function PatientDetail() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { patient?: Patient } };
  const { patientId } = useParams<{ patientId: string }>();

  const patient = state?.patient;
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!patientId) return;

    const ok = window.confirm('Delete this patient? This will also delete their uploaded sessions.');
    if (!ok) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDeletePatient(patientId);
      navigate('/doctor/dashboard', { replace: true });
    } catch (e: any) {
      setDeleteError(e?.message || 'Failed to delete patient');
      setDeleting(false);
    }
  };

  const handleUploadUpdatedCsv = async (file: File) => {
    if (!patientId) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      await apiUploadCSV(file, patientId);
      setUploadSuccess('CSV uploaded successfully.');
    } catch (e: any) {
      setUploadError(e?.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <header className="px-6 py-4 border-b border-dark-700 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-lg bg-dark-700 text-gray-200 text-sm hover:bg-dark-600 transition-colors"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Patient Details</h1>
          <p className="text-xs text-gray-500">ID: {patientId}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={!patientId || deleting}
            className="px-3 py-1.5 rounded-lg bg-red-600/15 text-red-300 text-sm hover:bg-red-600/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete patient'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-xl mx-auto bg-dark-800 border border-dark-600 rounded-xl p-6 space-y-3">
          {deleteError && <p className="text-sm text-red-300">{deleteError}</p>}

          <div className="pb-2 border-b border-dark-700">
            <p className="text-sm font-semibold text-white">Upload updated CSV</p>
            <p className="text-xs text-gray-500 mt-1">
              Upload a new gait CSV for this patient to create a new session.
            </p>
          </div>
          {uploadError && <p className="text-sm text-red-300">{uploadError}</p>}
          {uploadSuccess && <p className="text-sm text-emerald-300">{uploadSuccess}</p>}
          <div className={uploading ? 'opacity-70 pointer-events-none' : ''}>
            <FileUpload onFileLoaded={handleUploadUpdatedCsv} accentColor="doctor" />
          </div>
          {uploading && <p className="text-xs text-gray-400">Uploading…</p>}

          {patient ? (
            <>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm text-white font-medium">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-200">{patient.email}</p>
              </div>
              {(patient.age || patient.height_cm || patient.weight_kg) && (
                <div>
                  <p className="text-xs text-gray-500">Profile</p>
                  <p className="text-sm text-gray-200">
                    {patient.age ? `${patient.age} yrs` : ''}
                    {patient.height_cm ? ` · ${patient.height_cm} cm` : ''}
                    {patient.weight_kg ? ` · ${patient.weight_kg} kg` : ''}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-300">
              No patient details were provided. Try opening this page again from the doctor dashboard.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

