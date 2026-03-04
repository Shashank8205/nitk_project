import { useCallback } from 'react';

export default function FileUpload({ onFileLoaded, accentColor = 'doctor' }) {
  const colorMap = {
    doctor: 'border-doctor/30 hover:border-doctor/60 text-doctor',
    patient: 'border-patient/30 hover:border-patient/60 text-patient',
    researcher: 'border-researcher/30 hover:border-researcher/60 text-researcher',
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) onFileLoaded(file);
    },
    [onFileLoaded]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) onFileLoaded(file);
    },
    [onFileLoaded]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed ${colorMap[accentColor]} rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 bg-dark-800/50`}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload" className="cursor-pointer">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-300 font-medium">Drop CSV file here or click to upload</p>
        <p className="text-gray-500 text-sm mt-1">Supports ESP32 MPU9250 sensor data format</p>
      </label>
    </div>
  );
}
