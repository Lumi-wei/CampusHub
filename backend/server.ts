import 'dotenv/config';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';

import coursesRouter from './routes/courses';
import assignmentsRouter from './routes/assignments';
import checkinsRouter from './routes/checkins';
import todosRouter from './routes/todos';
import notificationsRouter from './routes/notifications';
import statsRouter from './routes/stats';

import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../shared/types/api';
import { usersRepository } from './repositories/users';
import { insertUserSchema } from './db/schema';

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
import cors from 'cors';
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// User management using database

// Initialize test user
async function initializeTestUser() {
  try {
    const existingUser = await usersRepository.getByEmail('test@example.com');
    if (!existingUser) {
      const passwordHash = await hashPassword('password123');
      const testUser = await usersRepository.create({
        email: 'test@example.com',
        passwordHash,
        name: '李明远',
        role: 'student',
      });
      console.log('Test user created:', testUser.email);
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper function to verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

import jwt from 'jsonwebtoken';

function generateToken(userId: string): string {
  const secretKey = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(
    { userId },
    secretKey,
    { expiresIn: '24h' }
  );
  return token;
}

function verifyToken(token: string): string | null {
  try {
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secretKey) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Auth Routes
app.post('/api/auth/login', async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '请提供邮箱和密码',
      });
    }

    const user = await usersRepository.getByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '邮箱或密码错误',
      });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '邮箱或密码错误',
      });
    }

    const token = generateToken(user.id);
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword as User,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '登录失败，请稍后重试',
    });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '请提供邮箱、密码和姓名',
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '密码长度至少为6个字符',
      });
    }

    const existingUser = await usersRepository.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '该邮箱已被注册',
      });
    }

    // Hash the password before storing
    const passwordHash = await hashPassword(password);

    const newUser = await usersRepository.create({
      email,
      passwordHash,
      name,
      role: 'student',
    });

    const token = generateToken(newUser.id);
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword as User,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '注册失败，请稍后重试',
    });
  }
});

app.post('/api/auth/validate', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '请提供认证令牌',
      });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '认证令牌无效',
      });
    }

    const user = await usersRepository.getById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '认证令牌无效',
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword as User,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '验证失败，请稍后重试',
    });
  }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供邮箱',
      });
    }

    const user = await usersRepository.getByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '该邮箱未注册',
      });
    }

    res.json({
      success: true,
      data: null,
      message: '密码重置链接已发送到您的邮箱',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '操作失败，请稍后重试',
    });
  }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供重置令牌和新密码',
      });
    }

    // Mock password reset logic
    // In a real app, you would validate the resetToken and update the user's password
    res.json({
      success: true,
      data: null,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '操作失败，请稍后重试',
    });
  }
});

app.post('/api/auth/me', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '缺少认证令牌',
      });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '无效的认证令牌',
      });
    }

    const user = await usersRepository.getById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '无效的认证令牌',
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword as User,
      message: '获取用户信息成功',
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '获取用户信息失败，请稍后重试',
    });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    res.json({
      success: true,
      data: null,
      message: '登出成功',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '登出失败，请稍后重试',
    });
  }
});

// Admin routes for user management
app.get('/api/auth/users', async (req: Request, res: Response<ApiResponse<User[]>>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '请提供认证令牌',
      });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '认证令牌无效',
      });
    }

    const currentUser = await usersRepository.getById(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null as any,
        message: '权限不足',
      });
    }

    const users = await usersRepository.getAll();
    const usersWithoutPassword = users.map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: usersWithoutPassword as User[],
      message: '获取用户列表成功',
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '获取用户列表失败，请稍后重试',
    });
  }
});

app.delete('/api/auth/users/:id', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '请提供认证令牌',
      });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '认证令牌无效',
      });
    }

    const currentUser = await usersRepository.getById(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null as any,
        message: '权限不足',
      });
    }

    const targetUserId = req.params.id;
    if (targetUserId === userId) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '不能删除自己的账户',
      });
    }

    const deleted = await usersRepository.delete(targetUserId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        data: null as any,
        message: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: null,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '删除用户失败，请稍后重试',
    });
  }
});

app.put('/api/auth/users/:id/role', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '请提供认证令牌',
      });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '认证令牌无效',
      });
    }

    const currentUser = await usersRepository.getById(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null as any,
        message: '权限不足',
      });
    }

    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!role || !['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '请提供有效的角色',
      });
    }

    const updatedUser = await usersRepository.update(targetUserId, { role });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        data: null as any,
        message: '用户不存在',
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      data: userWithoutPassword as User,
      message: '角色更新成功',
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '更新角色失败，请稍后重试',
    });
  }
});

app.put('/api/auth/update-profile', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { name } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '缺少认证令牌',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        data: null as any,
        message: '请提供昵称',
      });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '无效的认证令牌',
      });
    }

    const user = await usersRepository.getById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null as any,
        message: '无效的认证令牌',
      });
    }

    const updatedUser = await usersRepository.update(userId, { name });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        data: null as any,
        message: '用户不存在',
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      data: userWithoutPassword as User,
      message: '昵称更新成功',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      data: null as any,
      message: '更新失败，请稍后重试',
    });
  }
});

const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(REACT_BUILD_FOLDER, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

// API Routes
app.use('/api/courses', coursesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/stats', statsRouter);

// SPA Fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

app.use(errorHandler as ErrorRequestHandler);

app.listen(SERVER_CONFIG.PORT, async () => {
  console.log(`Server ready on port ${SERVER_CONFIG.PORT}`);
  // Initialize test user
  await initializeTestUser();
});

export default app;