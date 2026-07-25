import fs from 'fs';
import path from 'path';

// Define the file path for the local persistent JSON database
const DB_FILE_PATH = path.join(process.cwd(), 'data-hub-db.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Simulated password hash
  fullName: string;
  phone: string;
  walletBalance: number;
  role: 'admin' | 'customer';
  notificationPrefs: {
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
  };
  favorites: string[]; // List of favorite package IDs
  createdAt: string;
}

export interface Package {
  id: string;
  network: 'MTN' | 'Telecel' | 'AirtelTigo';
  category: 'AirtelTigo iShare' | 'AirtelTigo Big Time' | 'MTN Regular' | 'Telecel Special' | 'Default';
  name: string;
  dataAmount: string; // e.g. "1.5GB", "10GB"
  price: number; // in GHS
  validity: string; // e.g. "30 Days"
  isOnline: boolean;
  isHidden: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  network: 'MTN' | 'Telecel' | 'AirtelTigo';
  category: string;
  recipientPhone: string;
  amountPaid: number;
  dataAmount: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'purchase' | 'refund';
  amount: number;
  reference: string; // e.g. "DMH-482917" or MoMo Transaction ID
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaymentClaim {
  id: string;
  userId: string;
  userEmail: string;
  transactionId: string; // MoMo transaction ID
  amount: number;
  referenceCodeUsed?: string;
  screenshotUrl?: string; // Optional simulated URL or base64 representation
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  screenshotUrl?: string;
  status: 'open' | 'resolved';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  networkSpecific?: 'MTN' | 'Telecel' | 'AirtelTigo' | null;
  scheduledFor?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DatabaseState {
  users: User[];
  packages: Package[];
  orders: Order[];
  transactions: WalletTransaction[];
  claims: PaymentClaim[];
  complaints: Complaint[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
}

const DEFAULT_PACKAGES: Package[] = [
  { id: 'mtn-1', network: 'MTN', category: 'Default', name: 'MTN 1GB', dataAmount: '1GB', price: 10, validity: '30 Days', isOnline: true, isHidden: false, sortOrder: 1 },
  { id: 'mtn-2', network: 'MTN', category: 'Default', name: 'MTN 5GB', dataAmount: '5GB', price: 45, validity: '30 Days', isOnline: true, isHidden: false, sortOrder: 2 },
  { id: 'telecel-1', network: 'Telecel', category: 'Default', name: 'Telecel 2GB', dataAmount: '2GB', price: 18, validity: '30 Days', isOnline: true, isHidden: false, sortOrder: 3 },
  { id: 'airtel-ishare-1', network: 'AirtelTigo', category: 'AirtelTigo iShare', name: 'iShare 3GB', dataAmount: '3GB', price: 25, validity: '30 Days', isOnline: true, isHidden: false, sortOrder: 4 },
  { id: 'airtel-bigtime-1', network: 'AirtelTigo', category: 'AirtelTigo Big Time', name: 'Big Time 10GB', dataAmount: '10GB', price: 75, validity: '30 Days', isOnline: true, isHidden: false, sortOrder: 5 },
];

const INITIAL_DB: DatabaseState = {
  users: [
    {
      id: 'admin-user-id',
      email: 'donmacdatahub@gmail.com',
      passwordHash: 'admin123', // Demo plaintext simulated hash
      fullName: 'Donmac Admin',
      phone: '0241234567',
      walletBalance: 1000000,
      role: 'admin',
      notificationPrefs: { email: true, sms: true, orderUpdates: true },
      favorites: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'customer-user-id',
      email: 'customer@test.com',
      passwordHash: 'customer123',
      fullName: 'Yaw Boateng',
      phone: '0557654321',
      walletBalance: 50,
      role: 'customer',
      notificationPrefs: { email: true, sms: true, orderUpdates: true },
      favorites: ['mtn-1'],
      createdAt: new Date().toISOString()
    }
  ],
  packages: DEFAULT_PACKAGES,
  orders: [],
  transactions: [
    {
      id: 'tx-initial',
      userId: 'customer-user-id',
      type: 'deposit',
      amount: 50,
      reference: 'MOMO-987654',
      description: 'Initial Wallet Balance Loading',
      status: 'completed',
      createdAt: new Date().toISOString()
    }
  ],
  claims: [],
  complaints: [],
  announcements: [
    {
      id: 'ann-1',
      title: 'Welcome to Donmac Data Hub!',
      content: 'Enjoy the fastest automated wallet topups and high-speed data bundles.',
      networkSpecific: null,
      createdAt: new Date().toISOString()
    }
  ],
  auditLogs: []
};

// Helper to ensure db file exists and read it
export function readDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading simulated database:', error);
    return INITIAL_DB;
  }
}

// Helper to write db file
export function writeDatabase(state: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing simulated database:', error);
  }
}

// Helper to log audit actions
export function logAudit(userId: string, userEmail: string, action: string, details: string) {
  const db = readDatabase();
  const logEntry: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userEmail,
    action,
    details,
    createdAt: new Date().toISOString()
  };
  db.auditLogs.unshift(logEntry);
  writeDatabase(db);
}
