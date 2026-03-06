# Gait Signal Analysis Platform

A full-stack web application for analysing human gait data collected from IMU (accelerometer + gyroscope) sensors. Doctors can manage patients, upload CSV sensor data, and review computed walking metrics. Patients can log in to view their own results.

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- Recharts
- React Router DOM v6
- PapaParse (CSV parsing)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

---

## Project Structure

```
├── src/                        # Frontend source
│   ├── App.tsx                 # Root router with protected routes
│   ├── auth/                   # AuthContext, ProtectedRoute
│   ├── dashboards/
│   │   ├── DoctorDashboard.tsx
│   │   └── PatientDashboard.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── PatientDetail.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── MetricsPanel.tsx
│   │   └── FilterControls.tsx
│   └── utils/
│       ├── api.js              # All fetch calls to the backend
│       ├── gaitMetrics.js      # Step detection, cadence, stride, symmetry
│       └── filters.js          # Moving average & Kalman filter
│
└── server/                     # Backend source
    └── src/
        ├── app.js              # Express app setup
        ├── server.js           # Entry point
        ├── config/db.js        # MongoDB connection
        ├── models/
        │   ├── User.js
        │   └── Session.js
        ├── controllers/
        │   ├── authController.js
        │   └── sessionController.js
        ├── routes/
        │   ├── authRoutes.js
        │   └── sessionRoutes.js
        └── middleware/
            └── authMiddleware.js
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### Frontend Setup

1. Install dependencies from the project root:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001/api
```

3. Start the dev server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.

---

### Backend Setup

1. Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

2. Create a `.env` file inside `server/`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/gait
JWT_SECRET=your_secret_key_here
PORT=3001
```

3. Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:3001`.

---

## User Roles

| Role | Access |
|---|---|
| **Doctor** | Registers via signup (requires NMC number). Manages patients, uploads CSV data, views gait analysis. |
| **Patient** | Account created by their doctor. Can log in to view their own sessions and metrics. |

> Doctors and patients share the same signup page — the role is selected at the top and the form adjusts accordingly.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new doctor or patient |
| POST | `/login` | No | Login and receive JWT |
| GET | `/me` | Yes | Get current user |
| POST | `/patients` | Doctor | Add a patient |
| GET | `/patients` | Doctor | List all patients |
| DELETE | `/patients/:patientId` | Doctor | Delete a patient and their sessions |

### Sessions — `/api/sessions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/upload` | Yes | Upload a new session with CSV data |
| GET | `/` | Yes | Get sessions for current user |
| GET | `/:id` | Yes | Get a specific session |
| PUT | `/:id/metrics` | Yes | Save computed metrics to a session |
| DELETE | `/:id` | Yes | Delete a session |

---

## Gait Metrics

Metrics are computed client-side from the accelerometer columns in the uploaded CSV file.

| Metric | Description |
|---|---|
| **Step Count** | Total steps detected via peak detection on the magnitude signal |
| **Cadence** | Steps per minute |
| **Stride Time (Mean)** | Average time between steps in seconds |
| **Stride Time (SD)** | Standard deviation of stride intervals |
| **Symmetry Index** | Balance between first and second half of the session (100% = perfect) |

### Signal Filters

- **Raw** — unmodified sensor data
- **Moving Average** — smooths noise with a window of 7 samples
- **Kalman** — adaptive filter for smoother estimates while tracking real changes

---

## Database Models

### User

```
firstName, lastName, email, password_hash, role (doctor | patient),
phone, age, height_cm, weight_kg, nmc_registration_number, doctor_id
```

### Session

```
user_id, filename, sample_count, duration_sec,
metrics { step_count, cadence, avg_stride_time, symmetry_index },
data [ { row_index, values } ]
```

---

## Scripts

### Frontend

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

### Backend

```bash
npm run dev       # Start with hot reload
```
