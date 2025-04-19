import mongoose from "mongoose"
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  photo: String
});

 const model = mongoose.model('User', userSchema);
export default model