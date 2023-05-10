import config from "config";
import jwt from "jsonwebtoken";
import mongoose, { InferSchemaType } from "mongoose";
import { z } from "zod";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024
  },
  isAdmin: Boolean,
  // v more complex applications, muze byt vice roli, pak bychom pridali:
  // roles: [...],        a nadefinovali operations:
  // operations: [...]
});

// potrebujeme zde pouzit "this", proto nemuzeme pouzit arrow function, ty this nemaji
userSchema.methods.generateAuthToken = function () {
  // pridame zde do toho tokenu i to, jestli je ten user admin.
  return jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'))
}

// tohle bylo potreba dodelat kvuli TS. Tvaril se, ze nevi, ze ta metoda existuje. Bylo potreba rozsrit to schema.
declare interface IUser extends InferSchemaType<typeof userSchema> {
  generateAuthToken(): string;
}
export const User = mongoose.model<IUser>('User', userSchema);
  
const schema = z.object({
    name: z.string().min(5).max(50),
    email: z.string().min(5).max(255).email(),
    password:z.string().min(5).max(1024),
  });
  
export const validateUser = (user: string) => {
    return schema.parse(user);
  };