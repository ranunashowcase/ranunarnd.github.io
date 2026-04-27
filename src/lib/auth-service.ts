import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSheetData, appendSheetData, initializeSheetHeaders } from './sheets-service';

// ============================================
// AUTH SERVICE — Google Sheets + JWT + Bcrypt
// ============================================

const SHEET_NAME = 'USERS';
const HEADERS = ['user_id', 'email', 'password_hash', 'nama', 'role', 'created_at'];
const JWT_SECRET = process.env.JWT_SECRET || 'sbj-rnd-system-secret-key-2026';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

export interface UserRecord {
  user_id: string;
  email: string;
  password_hash: string;
  nama: string;
  role: 'admin' | 'viewer';
  created_at: string;
}

export interface UserPublic {
  user_id: string;
  email: string;
  nama: string;
  role: 'admin' | 'viewer';
}

export interface JwtPayload {
  user_id: string;
  email: string;
  nama: string;
  role: 'admin' | 'viewer';
}

/**
 * Initialize the USERS sheet with headers + default admin account.
 */
export async function initializeUsersSheet(): Promise<void> {
  await initializeSheetHeaders(SHEET_NAME, HEADERS);

  // Check if admin already exists
  const users = await getSheetData<UserRecord>(SHEET_NAME);
  const hasAdmin = users.some((u) => u.role === 'admin');

  if (!hasAdmin) {
    // Create default admin account
    const hashedPassword = await bcrypt.hash('kuasaadminherbal123', SALT_ROUNDS);
    await appendSheetData(SHEET_NAME, [
      'USR-001',
      'ranunaaasbj@gmail.com',
      hashedPassword,
      'Admin Ranuna',
      'admin',
      new Date().toISOString(),
    ]);
    console.log('[Auth] Default admin created: ranunaaasbj@gmail.com');
  }
}

/**
 * Register a new user (admin-only operation).
 */
export async function registerUser(
  email: string,
  password: string,
  nama: string,
  role: 'admin' | 'viewer' = 'viewer'
): Promise<UserPublic> {
  await initializeSheetHeaders(SHEET_NAME, HEADERS);

  // Check for duplicate email
  const users = await getSheetData<UserRecord>(SHEET_NAME);
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('Email sudah terdaftar');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate ID
  const maxNum = users.reduce((max, u) => {
    const match = u.user_id?.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const newId = `USR-${String(maxNum + 1).padStart(3, '0')}`;

  await appendSheetData(SHEET_NAME, [
    newId,
    email.toLowerCase(),
    hashedPassword,
    nama,
    role,
    new Date().toISOString(),
  ]);

  return { user_id: newId, email: email.toLowerCase(), nama, role };
}

/**
 * Authenticate a user by email + password.
 * Returns a JWT token if successful.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: UserPublic }> {
  await initializeSheetHeaders(SHEET_NAME, HEADERS);

  const users = await getSheetData<UserRecord>(SHEET_NAME);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error('Email atau password salah');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Email atau password salah');
  }

  const payload: JwtPayload = {
    user_id: user.user_id,
    email: user.email,
    nama: user.nama,
    role: (user.role as 'admin' | 'viewer') || 'viewer',
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      nama: user.nama,
      role: payload.role,
    },
  };
}

/**
 * Verify a JWT token and return the payload.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if a user has admin role.
 */
export function isAdmin(payload: JwtPayload | null): boolean {
  return payload?.role === 'admin';
}

/**
 * Get all users (admin-only). Returns public info only.
 */
export async function getAllUsers(): Promise<UserPublic[]> {
  await initializeSheetHeaders(SHEET_NAME, HEADERS);
  const users = await getSheetData<UserRecord>(SHEET_NAME);
  return users.map((u) => ({
    user_id: u.user_id,
    email: u.email,
    nama: u.nama,
    role: (u.role as 'admin' | 'viewer') || 'viewer',
  }));
}
