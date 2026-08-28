import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/env.js';

export class AuthService {
  /**
   * Generates a signed JWT token.
   */
  static generateToken(userId, role) {
    return jwt.sign({ id: userId, role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });
  }

  /**
   * Registers a new user.
   */
  static async register({ name, email, password, role = 'student' }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'student'
    });

    const token = this.generateToken(user._id, user.role);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Authenticates user and issues token.
   */
  static async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id, user.role);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token
    };
  }

  /**
   * Retrieves profile by user ID.
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }
}

export default AuthService;
