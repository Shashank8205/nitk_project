import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['doctor', 'patient'], required: true },
    phone: { type: String, required: false },
    // Patient specific fields
    age: { type: Number, required: false },
    height_cm: { type: Number, required: false },
    weight_kg: { type: Number, required: false },
    // Doctor specific fields
    nmc_registration_number: { type: String, required: false },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default mongoose.model('User', userSchema);
