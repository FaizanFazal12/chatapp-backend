const prisma = require('../db/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserController = {
  createUser: async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        let error={
          status:401,
          message:'User already exists'
        }
        return next(error);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name }
      });
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      });
      return res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
      next(err);
    }
  },

  loginUser: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      console.log(token);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.status(200).json({ message: 'Login successful', user: user, token: token });
    } catch (err) {
      next(err);
    }
  },
  getMe: async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    return res.json({ user: user });
  },
  getUsers: async (req, res) => {
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: req.user.id
        }
      }
    });
    return res.json(users);
  },

  getUserById: async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    return res.json(user);
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id },
      data: { email, password: hashedPassword }
    });
    return res.json(user);
  },

  deleteUser: async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.delete({ where: { id } });
    return res.json(user);
  }
};

module.exports = UserController;
