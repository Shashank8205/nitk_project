import User from '../models/User.js';
import Session from '../models/Session.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, uniqueId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Role-specific validation
    if (role === 'doctor') {
      if (!phone || !uniqueId) {
        return res.status(400).json({ message: 'Phone and NMC Registration Number are required for doctors' });
      }
    } else if (role === 'patient') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone is required for patients' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user object
    const userData = {
      firstName: name,
      lastName: '',
      email,
      password_hash: hashed,
      role,
      phone
    };

    // Add doctor-specific fields
    if (role === 'doctor') {
      userData.nmc_registration_number = uniqueId;
    }

    // Create user
    const user = await User.create(userData);

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(role === 'doctor' && { nmc_registration_number: user.nmc_registration_number })
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate role matches
    if (user.role !== role) {
      return res.status(400).json({ message: `This account is registered as a ${user.role}` });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      message: 'Login successful',
      token, 
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
};

// Doctor-specific functions
export const addPatient = async (req, res) => {
  try {
    // Only doctors can add patients
    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can add patients' });
    }

    const { firstName, lastName, email, password, phone, age, height, weight } = req.body;

    // Validate required fields
    if (!firstName || !email || !password) {
      return res.status(400).json({ message: 'First name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create patient
    const patient = await User.create({
      firstName,
      lastName: lastName || '',
      email,
      password_hash: hashed,
      role: 'patient',
      phone: phone || '',
      age: age || undefined,
      height_cm: height || undefined,
      weight_kg: weight || undefined,
      doctor_id: req.userId // Link patient to the doctor
    });

    res.status(201).json({ 
      message: 'Patient added successfully',
      patient: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        role: patient.role
      }
    });
  } catch (error) {
    console.error('AddPatient error:', error);
    res.status(500).json({ message: error.message || 'Failed to add patient' });
  }
};

export const getPatients = async (req, res) => {
  try {
    // Only doctors can get patients
    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view patients' });
    }

    const patients = await User.find({ 
      doctor_id: req.userId,
      role: 'patient'
    }).select('-password_hash').sort({ created_at: -1 });

    res.json({ patients });
  } catch (error) {
    console.error('GetPatients error:', error);
    res.status(500).json({ message: error.message || 'Failed to get patients' });
  }
};

export const deletePatient = async (req, res) => {
  try {
    if (req.userRole !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can delete patients' });
    }

    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required' });
    }

    const patient = await User.findOne({
      _id: patientId,
      doctor_id: req.userId,
      role: 'patient',
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await Session.deleteMany({ user_id: patient._id });
    await User.deleteOne({ _id: patient._id });

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('DeletePatient error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete patient' });
  }
};
