
import type { Dispatch, SetStateAction } from 'react';

export enum RoomStatus {
  Vacant = 'Vacant',
  Occupied = 'Occupied',
  Dirty = 'Dirty',
  Cleaning = 'Cleaning',
  OutOfOrder = 'Out of Order',
  Reserved = 'Reserved',
}

export enum HousekeepingStatus {
  Clean = 'Clean',
  Inspected = 'Inspected',
  Dirty = 'Dirty',
  Pickup = 'Pickup',
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
    SuperAdmin = 'Super Admin',
    Admin = 'Admin',
    Manager = 'Manager',
    Supervisor = 'Supervisor',
    FrontDesk = 'Front Desk',
    Housekeeping = 'Housekeeping',
    Accounts = 'Accounts',
    Restaurant = 'Restaurant',
    Maintenance = 'Maintenance',
    Staff = 'Staff'
}

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export interface ModulePermissions {
  id: string;
  name: string;
  isEnabled: boolean;
  actions: Permission;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  moduleAccess: ModulePermissions[];
  dataScope: 'All' | 'Single Branch' | 'Assigned Floor' | 'Specific Customers';
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerId?: number;
  status: 'Active' | 'Inactive';
}

export interface SystemSecuritySettings {
  passwordPolicy: 'Standard' | 'Strong' | 'Enterprise';
  enforce2FA: boolean;
  loginAttemptLimit: number;
  sessionTimeoutMinutes: number;
  ipWhitelist: string[];
}

export interface SystemIntegrationSettings {
  paymentGateway: string;
  posSystem: string;
  channelManagerApi: string;
  accountingSoftware: string;
}

export interface PropertyInfo {
  name: string;
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  currency: 'NGN' | 'USD';
  timezone: string;
  language: string;
  logo?: string;
  checkInTime: string;
  checkOutTime: string;
  brandColor?: string;
}

export interface BaseEntity {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    isDeleted: boolean;
}

export interface Staff extends BaseEntity {
    id: number;
    name: string;
    email: string;
    password?: string; 
    role: UserRole;
    branchId: string;
    status: 'Active' | 'Suspended' | 'Pending';
    department: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  userRole: string;
  ipAddress?: string;
  branchId?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  details: string;
}

export interface SecurityIncident extends BaseEntity {
    id: number;
    type: 'Breach' | 'Theft' | 'Maintenance Failure' | 'Staff Misconduct' | 'Other';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    location: string;
    description: string;
    timestamp: string;
    status: 'Open' | 'Investigating' | 'Resolved';
}

export interface Room extends BaseEntity {
  id: number;
  number: string;
  floor: number;
  type: string;
  rate: number;
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  maintenanceNotes?: string;
  statusNotes?: string;
  guestId?: number;
  isActive: boolean;
}

export interface RoomType extends BaseEntity {
  id: number;
  name: string;
  rates: {
    NGN: number;
    USD: number;
  };
  capacity: number;
  isActive: boolean;
}

export interface Expense extends BaseEntity {
    id: number;
    category: 'Payroll' | 'Utilities' | 'Supplies' | 'Maintenance' | 'Marketing' | 'Other';
    description: string;
    amount: number;
    date: string;
    supplierId?: number;
}

export interface MenuItem extends BaseEntity {
    id: number;
    name: string;
    category: 'Food' | 'Drink' | 'Other';
    price: number;
    isActive: boolean;
}

export interface CateringAsset extends BaseEntity {
  id: number;
  name: string;
  quantityTotal: number;
  quantityAvailable: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface Event extends BaseEntity {
  id: number;
  clientName: string;
  date: string;
  assetsAssigned: { assetId: number; quantity: number }[];
  status: 'Draft' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';
}

export interface RatePlan extends BaseEntity {
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

export interface DiscountRule extends BaseEntity {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  applicableRoles: UserRole[];
}

export interface TaxCharge extends BaseEntity {
  id: number;
  name: string;
  rate: number;
  isInclusive: boolean;
  showOnReceipt: boolean;
  isActive: boolean;
}

export interface TaxSettings {
    isEnabled: boolean;
    components: TaxCharge[];
}

export interface Guest extends BaseEntity {
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
  ledgerAccountId?: number;
  preferences?: string;
  vip?: boolean;
}

export interface Transaction extends BaseEntity {
  id: number;
  guestId: number;
  description: string;
  amount: number;
  date: string;
  type: 'charge' | 'payment';
  invoiceNumber?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  reference?: string;
}

export interface CityLedgerAccount extends BaseEntity {
    id: number;
    companyName: string;
    creditLimit: number;
    currentBalance: number;
    contactPerson: string;
    email: string;
    phone: string;
    paymentTerms: string;
    isActive: boolean;
}

export interface CityLedgerTransaction extends BaseEntity {
    id: number;
    accountId: number;
    guestId?: number;
    description: string;
    amount: number;
    date: string;
    type: 'charge' | 'payment';
    reference?: string;
}

export interface InventoryMovement extends BaseEntity {
    id: number;
    itemId: number;
    type: 'Stock In' | 'Adjustment' | 'Transfer Out' | 'Transfer In' | 'Usage';
    quantity: number;
    reason: string;
    date: string;
}

export interface Reservation extends BaseEntity {
    id: number;
    guestId?: number; // Linked existing guest
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    roomType: string;
    roomAssigned?: string;
    ota: string;
    paymentStatus: PaymentStatus;
    status: 'Pending' | 'Confirmed' | 'CheckedIn' | 'NoShow' | 'Cancelled' | 'CheckedOut';
}

export interface Order extends BaseEntity {
  id: number;
  roomId: number;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered';
}

export interface Employee extends BaseEntity {
  id: number;
  name: string;
  department: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  email: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profilePicture?: string;
  assignedAssets: string[];
  password?: string;
}

export interface SyncLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface MaintenanceRequest extends BaseEntity {
  id: number;
  roomId?: number;
  location: string;
  description: string;
  reportedAt: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
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

export enum InventoryCategory {
    Housekeeping = 'Housekeeping',
    Kitchen = 'Kitchen',
    Toiletries = 'Toiletries',
    Laundry = 'Laundry',
    Maintenance = 'Maintenance',
    FoodAndBeverage = 'Food & Beverage',
}

export interface InventoryItem extends BaseEntity {
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

export interface ProxyGuest extends Omit<Guest, keyof BaseEntity | 'id'> {
    id?: number;
}

export interface Supplier extends BaseEntity {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    category: string;
}

export interface HotelData {
  propertyInfo: PropertyInfo;
  securitySettings: SystemSecuritySettings;
  integrationSettings: SystemIntegrationSettings;
  branches: Branch[];
  customRoles: Role[];
  systemStatus: 'Active' | 'Maintenance' | 'Offline';
  licenseStatus: 'Trial' | 'Paid' | 'Expired';
  systemModules: Record<string, boolean>;
  
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  transactions: Transaction[];
  cityLedgerAccounts: CityLedgerAccount[];
  cityLedgerTransactions: CityLedgerTransaction[];
  inventoryMovements: InventoryMovement[];
  loyaltyTransactions: LoyaltyTransaction[];
  walkInTransactions: WalkInTransaction[];
  orders: Order[];
  employees: Employee[];
  staff: Staff[];
  syncLog: SyncLogEntry[];
  auditLog: AuditLogEntry[];
  securityIncidents: SecurityIncident[];
  maintenanceRequests: MaintenanceRequest[];
  roomTypes: RoomType[];
  cateringAssets: CateringAsset[];
  events: Event[];
  taxSettings: TaxSettings;
  taxCharges: TaxCharge[];
  ratePlans: RatePlan[];
  discountRules: DiscountRule[];
  stopSell: { [roomType: string]: boolean };
  inventory: InventoryItem[];
  suppliers: Supplier[];
  expenses: Expense[];
  menuItems: MenuItem[];

  // Actions
  updatePropertyInfo: (info: PropertyInfo) => void;
  updateSecuritySettings: (settings: SystemSecuritySettings) => void;
  updateIntegrationSettings: (settings: SystemIntegrationSettings) => void;
  updateSystemStatus: (status: HotelData['systemStatus']) => void;
  toggleModule: (moduleId: string) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (branch: Branch) => void;
  addCustomRole: (role: Omit<Role, 'id'>) => void;
  updateCustomRole: (role: Role) => void;
  deleteCustomRole: (roleId: string) => void;
  addStaff: (member: Omit<Staff, keyof BaseEntity | 'id'>) => void;
  updateStaff: (member: Staff) => void;
  deleteStaff: (staffId: number) => void;
  checkInGuest: (payload: { guest: Omit<Guest, keyof BaseEntity | 'id'>, roomId: number, charge: Omit<Transaction, keyof BaseEntity | 'id' | 'guestId'>, tax?: Omit<Transaction, keyof BaseEntity | 'id' | 'guestId'>, reservationId?: number }) => void;
  checkOutGuest: (payload: { roomId: number, guestId: number, reservationId?: number, payment?: Omit<Transaction, keyof BaseEntity | 'id' | 'guestId'> }) => void;
  addOrder: (order: Omit<Order, keyof BaseEntity | 'id'>) => void;
  updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number, notes?: string) => void;
  updateHousekeepingStatus: (roomId: number, status: HousekeepingStatus) => void;
  addTransaction: (transaction: Omit<Transaction, keyof BaseEntity | 'id'>) => void;
  addWalkInTransaction: (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => void;
  addEmployee: (employee: Omit<Employee, keyof BaseEntity | 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  addReservation: (reservation: Omit<Reservation, keyof BaseEntity | 'id'>) => void;
  updateReservation: (reservation: Reservation) => void;
  approveReservation: (id: number) => void;
  addSyncLogEntry: (message: string, level?: SyncLogEntry['level']) => void;
  logAudit: (action: string, entityType: string, entityId?: string | number, details?: string) => void;
  updateRate: (roomType: string, newRate: number, currency: 'NGN' | 'USD') => void;
  updateGuestDetails: (guestId: number, updatedGuest: Partial<Guest>) => void;
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, keyof BaseEntity | 'id' | 'reportedAt' | 'status'>) => void;
  updateMaintenanceRequestStatus: (requestId: number, status: MaintenanceStatus) => void;
  addLoyaltyPoints: (guestId: number, points: number, description: string) => void;
  redeemLoyaltyPoints: (guestId: number, pointsToRedeem: number) => Promise<{ success: boolean, message: string }>;
  addRoomType: (roomType: Omit<RoomType, keyof BaseEntity | 'id'>) => void;
  updateRoomType: (roomType: RoomType) => void;
  deleteRoomType: (roomTypeId: number) => void;
  addRoom: (room: { number: string; type: string; floor: number }) => void;
  updateRoom: (room: Room) => void;
  deleteRoom: (roomId: number) => void;
  clearAllData: () => void;
  updateOrderStatus: (orderId: number, status: Order['status']) => void;
  deleteTransaction: (transactionId: number) => void;
  deleteEmployee: (employeeId: number) => void;
  moveGuest: (payload: { guestId: number; oldRoomId: number; newRoomId: number }) => void;
  setStopSell: (stopSell: { [key: string]: boolean }) => void;
  setTaxSettings: (taxSettings: TaxSettings) => void;
  addCityLedgerAccount: (account: Omit<CityLedgerAccount, keyof BaseEntity | 'id'>) => void;
  postToCityLedger: (transaction: Omit<CityLedgerTransaction, keyof BaseEntity | 'id'>) => void;
  addInventoryItem: (item: Omit<InventoryItem, keyof BaseEntity | 'id'>) => void;
  updateInventoryItem: (item: InventoryItem, movement?: Omit<InventoryMovement, keyof BaseEntity | 'id' | 'itemId'>) => void;
  deleteInventoryItem: (itemId: number) => void;
  addSupplier: (supplier: Omit<Supplier, keyof BaseEntity | 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: number) => void;
  addCateringAsset: (asset: Omit<CateringAsset, keyof BaseEntity | 'id'>) => void;
  updateCateringAsset: (asset: CateringAsset) => void;
  deleteCateringAsset: (id: number) => void;
  addEvent: (event: Omit<Event, keyof BaseEntity | 'id'>) => void;
  updateEvent: (event: Event) => void;
  addRatePlan: (plan: Omit<RatePlan, keyof BaseEntity | 'id'>) => void;
  updateRatePlan: (plan: RatePlan) => void;
  deleteRatePlan: (planId: number) => void;
  addDiscountRule: (rule: Omit<DiscountRule, keyof BaseEntity | 'id'>) => void;
  updateDiscountRule: (rule: DiscountRule) => void;
  deleteDiscountRule: (ruleId: number) => void;
  addTaxCharge: (charge: Omit<TaxCharge, keyof BaseEntity | 'id'>) => void;
  updateTaxCharge: (charge: TaxCharge) => void;
  deleteTaxCharge: (chargeId: number) => void;
  addExpense: (expense: Omit<Expense, keyof BaseEntity | 'id'>) => void;
  deleteExpense: (id: number) => void;
  addMenuItem: (item: Omit<MenuItem, keyof BaseEntity | 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: number) => void;
  addSecurityIncident: (incident: Omit<SecurityIncident, keyof BaseEntity | 'id' | 'timestamp' | 'status'>) => void;
  updateSecurityIncidentStatus: (id: number, status: SecurityIncident['status']) => void;
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
