
import type { Dispatch, SetStateAction } from 'react';

export enum RoomStatus {
  Vacant = 'Vacant',
  Occupied = 'Occupied',
  Dirty = 'Dirty',
  Cleaning = 'Cleaning',
  OutOfOrder = 'Out of Order',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Owing = 'Owing',
}

export enum LoyaltyTier {
    Bronze = 'Bronze',
    Silver = 'Silver',
    Gold = 'Gold',
    Platinum = 'Platinum',
}

export enum UserRole {
    Manager = 'Manager',
    FrontDesk = 'Front Desk',
    Housekeeping = 'Housekeeping',
    Accounts = 'Accounts',
    Restaurant = 'Restaurant',
    Maintenance = 'Maintenance',
}

export interface Staff {
    id: number;
    name: string;
    email: string;
    password: string; 
    role: UserRole;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string | number;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface Room {
  id: number;
  number: string;
  type: string;
  rate: number;
  status: RoomStatus;
  guestId?: number;
  isActive: boolean; // Admin Control
}

export interface RoomType {
  id: number;
  name: string;
  rates: {
    NGN: number;
    USD: number;
  };
  capacity: number;
  isActive: boolean; // Admin Control
}

export interface RatePlan {
  id: number;
  name: string;
  roomTypeId: number;
  rates: {
    NGN: number;
    USD: number;
  };
  isActive: boolean;
  description: string;
}

export interface DiscountRule {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  applicableRoles: UserRole[];
}

export interface TaxCharge {
  id: number;
  name: string;
  rate: number;
  isInclusive: boolean;
  isActive: boolean;
}

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthdate?: string;
  nationality?: string;
  idType: string;
  idNumber: string;
  idOtherType?: string;
  address?: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
  roomNumber: string;
  roomType: string;
  bookingSource: string;
  currency: 'NGN' | 'USD';
  discount?: number;
  specialRequests?: string;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  company?: string;
  preferences?: string;
  vip?: boolean;
}

export interface Reservation {
    id: number;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    roomType: string;
    ota: string;
}

export interface Transaction {
  id: number;
  guestId: number;
  description: string;
  amount: number;
  date: string;
}

export interface LoyaltyTransaction {
    id: number;
    guestId: number;
    points: number;
    description: string;
    date: string;
}

export interface WalkInTransaction {
  id: number;
  service: string;
  serviceDetails?: string;
  amount: number;
  discount: number;
  tax: number;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer';
  currency: 'NGN' | 'USD';
  date: string;
}

export interface Order {
  id: number;
  roomId: number;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered';
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  department: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  profilePicture?: string;
}

export interface SyncLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export enum MaintenanceStatus {
  Reported = 'Reported',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum MaintenancePriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface MaintenanceRequest {
  id: number;
  roomId?: number;
  location: string;
  description: string;
  reportedAt: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
}

export interface TaxSettings {
    isEnabled: boolean;
    rate: number;
}

export enum InventoryCategory {
    Housekeeping = 'Housekeeping',
    FoodAndBeverage = 'F&B',
}

export interface InventoryItem {
    id: number;
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    reorderLevel: number;
    costPerUnit: number;
    supplierId?: number;
    expiryDate?: string;
    location?: string;
}

export interface Supplier {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    category: InventoryCategory | 'General';
}

export interface HotelData {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  transactions: Transaction[];
  loyaltyTransactions: LoyaltyTransaction[];
  walkInTransactions: WalkInTransaction[];
  orders: Order[];
  employees: Employee[];
  syncLog: SyncLogEntry[];
  auditLog: AuditLogEntry[];
  maintenanceRequests: MaintenanceRequest[];
  roomTypes: RoomType[];
  taxSettings: TaxSettings;
  taxCharges: TaxCharge[];
  ratePlans: RatePlan[];
  discountRules: DiscountRule[];
  stopSell: { [roomType: string]: boolean };
  inventory: InventoryItem[];
  suppliers: Supplier[];

  // Action functions
  checkInGuest: (payload: { guest: Omit<Guest, 'id'>, roomId: number, charge: Omit<Transaction, 'id' | 'guestId'>, tax?: Omit<Transaction, 'id' | 'guestId'>, reservationId?: number }) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addWalkInTransaction: (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  addSyncLogEntry: (message: string, level?: SyncLogEntry['level']) => void;
  updateRate: (roomType: string, newRate: number, currency: 'NGN' | 'USD') => void;
  updateGuestDetails: (guestId: number, updatedGuest: Partial<Guest>) => void;
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => void;
  updateMaintenanceRequestStatus: (requestId: number, status: MaintenanceStatus) => void;
  addLoyaltyPoints: (guestId: number, points: number, description: string) => void;
  redeemLoyaltyPoints: (guestId: number, pointsToRedeem: number) => Promise<{ success: boolean, message: string }>;
  addRoomType: (roomType: Omit<RoomType, 'id'>) => void;
  updateRoomType: (roomType: RoomType) => void;
  deleteRoomType: (roomTypeId: number) => void;
  addRoom: (room: { number: string; type: string }) => void;
  updateRoom: (room: Room) => void;
  deleteRoom: (roomId: number) => void;
  clearAllData: () => void;
  updateOrderStatus: (orderId: number, status: Order['status']) => void;
  deleteTransaction: (transactionId: number) => void;
  deleteEmployee: (employeeId: number) => void;
  moveGuest: (payload: { guestId: number; oldRoomId: number; newRoomId: number }) => void;
  setStopSell: (stopSell: { [key: string]: boolean }) => void;
  setTaxSettings: (taxSettings: TaxSettings) => void;
  
  // Enterprise Admin Actions
  addRatePlan: (plan: Omit<RatePlan, 'id'>) => void;
  updateRatePlan: (plan: RatePlan) => void;
  deleteRatePlan: (id: number) => void;
  addDiscountRule: (rule: Omit<DiscountRule, 'id'>) => void;
  updateDiscountRule: (rule: DiscountRule) => void;
  deleteDiscountRule: (id: number) => void;
  addTaxCharge: (charge: Omit<TaxCharge, 'id'>) => void;
  updateTaxCharge: (charge: TaxCharge) => void;
  deleteTaxCharge: (id: number) => void;

  // Inventory Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: number) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: number) => void;
}
