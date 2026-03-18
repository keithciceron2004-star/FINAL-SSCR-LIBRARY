export type Role = 'student' | 'faculty' | 'librarian' | 'supervisor';

export interface User {
  id: string;
  schoolId: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  yearLevel?: 'IBED' | 'JHS/SHS' | 'College' | 'College of Law';
  mustChangePassword?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string; // genre/category (e.g., Sci-Fi, Computer Science)
  yearLevel?: 'IBED' | 'JHS/SHS' | 'College' | 'College of Law' | 'All';
  status: 'available' | 'borrowed';
}

export interface Loan {
  id: string;
  bookId: string;
  borrowerId: string;
  borrowDate: string;
  dueDate: string;
  status: 'active' | 'returned' | 'pending_return' | 'pending_renewal' | 'pending' | 'declined';
}

const DEFAULT_USERS: User[] = [
  { id: '1', schoolId: '2023102738', fullName: 'Anderson Ciceron', email: '2023102738@example.com', password: 'AndersonCiceron', role: 'student', yearLevel: 'College', mustChangePassword: false },
  { id: '2', schoolId: 'admin', fullName: 'Head Librarian', email: 'librarian@sscr.edu', password: 'Admin', role: 'librarian', mustChangePassword: false },
  { id: '3', schoolId: 'host', fullName: 'Supervisor', email: 'supervisor@sscr.edu', password: 'Host', role: 'supervisor', mustChangePassword: false },
  { id: '4', schoolId: '2023103001', fullName: 'Maria Santos', email: '2023103001@example.com', password: 'gobaste123', role: 'faculty', mustChangePassword: true },
  // default faculty/student with default password should force change on first login
  { id: '4a', schoolId: '2024100001', fullName: 'Sample Student', email: 'sample@student.example', password: 'gobaste123', role: 'student', yearLevel: 'IBED', mustChangePassword: true },
  // Additional library accounts
  { id: '5', schoolId: 'ibed.sscr', fullName: 'IBED Librarian', email: 'ibed@sscr.edu', password: 'Ibedlib', role: 'librarian', yearLevel: 'IBED', mustChangePassword: false },
  { id: '6', schoolId: 'jsashs.sscr', fullName: 'JHS and SHS Librarian', email: 'jsashs@sscr.edu', password: 'Highlib', role: 'librarian', yearLevel: 'JHS/SHS', mustChangePassword: false },
  { id: '7', schoolId: 'law.sscr', fullName: 'College of Law Librarian', email: 'law@sscr.edu', password: 'Lawlib', role: 'librarian', yearLevel: 'College of Law', mustChangePassword: false },
];

const DEFAULT_BOOKS: Book[] = [
  { id: '1', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', yearLevel: 'College', status: 'available' },
  { id: '2', title: 'Clean Code', author: 'Robert C. Martin', category: 'Software Engineering', yearLevel: 'College', status: 'available' },
  { id: '3', title: 'Design Patterns', author: 'Gang of Four', category: 'Software Engineering', yearLevel: 'College', status: 'available' },
  { id: '4', title: 'The Pragmatic Programmer', author: 'David Thomas', category: 'Software Engineering', yearLevel: 'College', status: 'available' },
  { id: '5', title: 'Database Systems', author: 'Ramez Elmasri', category: 'Computer Science', yearLevel: 'College', status: 'available' },
  { id: '6', title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', yearLevel: 'All', status: 'available' },
  { id: '7', title: 'Dune', author: 'Frank Herbert', category: 'Sci-Fi', yearLevel: 'All', status: 'available' },
];

function getStore<T>(key: string, defaults: T[]): T[] {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const setUsers = (users: User[]) => setStore('lms_users', users);

export const getUsers = (): User[] => {
  const data = localStorage.getItem('lms_users');
  if (!data) {
    localStorage.setItem('lms_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    const users = JSON.parse(data) as User[];
    // Merge in any DEFAULT_USERS that are missing (by schoolId) without overwriting existing users
    let added = false;
    for (const du of DEFAULT_USERS) {
      if (!users.find(u => u.schoolId === du.schoolId)) {
        users.push(du);
        added = true;
      }
    }
    if (added) localStorage.setItem('lms_users', JSON.stringify(users));
    return users;
  } catch (e) {
    // If parsing fails, reset to defaults
    localStorage.setItem('lms_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
};

export const getBooks = () => getStore<Book>('lms_books', DEFAULT_BOOKS);
export const setBooks = (books: Book[]) => setStore('lms_books', books);

export const getLoans = () => getStore<Loan>('lms_loans', []);
export const setLoans = (loans: Loan[]) => setStore('lms_loans', loans);

// Cascading delete: Remove a user and all their associated loans
export const deleteUserCascade = (userId: string): void => {
  const users = getUsers();
  const loans = getLoans();
  
  // Remove the user
  const updatedUsers = users.filter(u => u.id !== userId);
  setUsers(updatedUsers);
  
  // Remove all loans for this user
  const updatedLoans = loans.filter(l => l.borrowerId !== userId);
  setLoans(updatedLoans);
};

// Cascading delete: Remove a book and all its associated loans
export const deleteBookCascade = (bookId: string): void => {
  const books = getBooks();
  const loans = getLoans();
  
  // Remove the book
  const updatedBooks = books.filter(b => b.id !== bookId);
  setBooks(updatedBooks);
  
  // Remove all loans for this book
  const updatedLoans = loans.filter(l => l.bookId !== bookId);
  setLoans(updatedLoans);
};

export const resetDefaults = () => {
  setUsers(DEFAULT_USERS);
  setBooks(DEFAULT_BOOKS);
  setLoans([]);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem('lms_current_user');
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) localStorage.setItem('lms_current_user', JSON.stringify(user));
  else localStorage.removeItem('lms_current_user');
};

export const login = (schoolId: string, password: string): User | null => {
  const users = getUsers();
  const id = schoolId.trim();
  const user = users.find(u => u.schoolId === id && u.password === password);
  if (user) setCurrentUser(user);
  return user || null;
};

export const logout = () => setCurrentUser(null);

let counter = Date.now();
export const genId = () => String(counter++);

export interface Filters {
  genre?: string;
  yearLevel?: string;
}

export const getFilters = (): Filters => {
  const data = localStorage.getItem('lms_filters');
  return data ? JSON.parse(data) : { genre: undefined, yearLevel: undefined };
};

export const setFilters = (f: Partial<Filters>) => {
  const cur = getFilters();
  const updated = { ...cur, ...f };
  localStorage.setItem('lms_filters', JSON.stringify(updated));
  return updated;
};
