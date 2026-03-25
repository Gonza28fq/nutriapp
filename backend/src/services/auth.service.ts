import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UsuarioModel } from "../models/usuario.model";
import { AppError } from "../middlewares/error.middleware";

const SALT_ROUNDS = 12;

export interface TokenPayload {
  id: number;
  email: string;
  nombre: string;
  rol: "admin" | "nutricionista";
}

export const AuthService = {

  async login(email: string, password: string) {
    const usuario = await UsuarioModel.findByEmail(email.toLowerCase().trim());
    if (!usuario) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    const payload: TokenPayload = {
      id:     usuario.id,
      email:  usuario.email,
      nombre: usuario.nombre,
      rol:    usuario.rol,
    };

const secret = process.env.JWT_SECRET ?? "fallback_secret";
const expira = (process.env.JWT_EXPIRES_IN ?? "8h") as jwt.SignOptions["expiresIn"];

const token = jwt.sign(payload, secret, { expiresIn: expira });
    return {
      token,
      usuario: {
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol,
      },
    };
  },

  async crearUsuarioInicial(nombre: string, email: string, password: string): Promise<number> {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return UsuarioModel.create(nombre, email, hash, "nutricionista");
  },

  async cambiarPassword(usuarioId: number, passwordActual: string, passwordNueva: string): Promise<void> {
    const usuario = await UsuarioModel.findById(usuarioId);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);
    const valida = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!valida) throw new AppError("La contrasena actual es incorrecta", 400);
    const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
    await UsuarioModel.updatePassword(usuarioId, nuevoHash);
  },
};