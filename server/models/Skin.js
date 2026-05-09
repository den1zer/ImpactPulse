import mongoose from 'mongoose';

const SkinSchema = new mongoose.Schema({
  skinId: { type: String, required: true, unique: true }, 
  name: { type: String, required: true }, 
  previewIcon: { type: String }, 
  cssClass: { type: String, required: true }, 
  unlockedByBadge: { type: String, required: true, unique: true } 
});

const Skin = mongoose.model('Skin', SkinSchema);
export default Skin;