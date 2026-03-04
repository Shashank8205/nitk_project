import Session from '../models/Session.js';
import User from '../models/User.js';

export const uploadSession = async (req, res) => {
  const { filename, data, metrics, patientId } = req.body;

  // Patients can upload their own sessions
  if (req.userRole === 'patient') {
    const session = await Session.create({
      user_id: req.userId,
      filename,
      sample_count: data.length,
      duration_sec: metrics.duration,
      metrics,
      data
    });

    return res.json(session);
  }

  // Doctors can upload on behalf of their patients
  if (req.userRole === 'doctor') {
    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required when doctor uploads a session' });
    }

    const patient = await User.findOne({ _id: patientId, doctor_id: req.userId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or not linked to this doctor' });
    }

    const session = await Session.create({
      user_id: patient._id,
      filename,
      sample_count: data.length,
      duration_sec: metrics.duration,
      metrics,
      data
    });

    return res.json(session);
  }

  return res.status(403).json({ message: 'Access denied' });
};

export const getSessions = async (req, res) => {
  if (req.user.role === 'patient') {
    const sessions = await Session.find({
      user_id: req.user.id
    }).sort({ uploaded_at: -1 });

    return res.json(sessions);
  }

  if (req.user.role === 'doctor') {
    const patients = await User.find({ doctor_id: req.user.id });
    const ids = patients.map(p => p._id);

    const sessions = await Session.find({
      user_id: { $in: ids }
    })
      .populate('user_id', 'name email')
      .sort({ uploaded_at: -1 });

    return res.json(sessions);
  }

  res.status(403).json({ message: 'Access denied' });
};
