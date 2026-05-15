import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB підключено успішно');
  } catch (err) {
    console.error('Помилка підключення до MongoDB:', err.message);
    process.exit(1); 
  }
};

export default connectDB;