export enum RoomStatus {
  Vacant = 'Vacant',
  Occupied = 'Occupied',
  Dirty = 'Dirty',
  Cleaning = 'Cleaning',
  OutOfOrder = 'Out of Order',
}

export interface Room {
  id: number;
  number: string;
  type: string;
  rate: number;
  status: RoomStatus;
  guestId?: number;
}

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Transaction {
  id: number;
  guestId: number;
  description: string;
  amount: number; // positive for charges, negative for payments
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
  position: string;
  salary: number;
  hireDate: string;
}

export interface HotelData {
  rooms: Room[];
  guests: Guest[];
  transactions: Transaction[];
  orders: Order[];
  employees: Employee[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
}
