import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

// Connect to database
connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
