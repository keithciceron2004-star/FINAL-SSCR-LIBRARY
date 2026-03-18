import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Trash2, Check, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import EditDetailsDialog from '@/components/EditDetailsDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { getCurrentUser, getBooks, setBooks, getLoans, setLoans, getUsers, genId, deleteBookCascade, type User, type Book } from '@/lib/store';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

type Tab = 'catalog' | 'borrowers' | 'reservations';

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [tab, setTab] = useState<Tab>('catalog');
  const [books, setBooksList] = useState(getBooks());
  const [loans, setLoansList] = useState(getLoans());
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newYearLevel, setNewYearLevel] = useState<'IBED' | 'JHS/SHS' | 'College' | 'College of Law' | 'All'>('All');
  const [editBookOpen, setEditBookOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editYearLevel, setEditYearLevel] = useState<'IBED' | 'JHS/SHS' | 'College' | 'College of Law' | 'All'>('All');
  
  
  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(user?.mustChangePassword ?? false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auth check on mount and when user changes
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'librarian') {
      navigate('/');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  if (!user) return null;

  const users = getUsers();
  let filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()));

  // If the logged-in user is a librarian assigned to a specific year level,
  // only show books for that year level plus any books marked 'All'.
  if (user.role === 'librarian' && user.yearLevel) {
    filteredBooks = filteredBooks.filter(b => (b.yearLevel || 'All') === user.yearLevel || (b.yearLevel === 'All'));
  }
  // Show only books that match this librarian's assigned year level
  if (user.role === 'librarian' && user.yearLevel) {
    filteredBooks = filteredBooks.filter(b => b.yearLevel === user.yearLevel);
  }

  const handleAddBook = () => {
    if (!newTitle.trim() || !newAuthor.trim()) { toast.error('Fill in title and author'); return; }
    // Ensure any book added by a librarian is assigned to that librarian's year level
    const assignedYear = (user.role === 'librarian' && user.yearLevel) ? user.yearLevel : newYearLevel;
    const book: Book = { id: genId(), title: newTitle.trim(), author: newAuthor.trim(), category: (newGenre.trim() || newCategory.trim() || 'General'), yearLevel: assignedYear, status: 'available' };
    const updated = [...books, book]; setBooks(updated); setBooksList(updated);
    setNewTitle(''); setNewAuthor(''); setNewCategory(''); setAddOpen(false);
    toast.success('Book added');
  };

  const openEditBook = (book: Book) => {
    setEditingId(book.id);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCategory(book.category);
    setEditYearLevel(book.yearLevel || 'All');
    setEditBookOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    if (!editTitle.trim() || !editAuthor.trim()) { toast.error('Fill in title and author'); return; }
    // Ensure librarian cannot change yearLevel to another lib's year if they are librarian
    const finalYear = (user.role === 'librarian' && user.yearLevel) ? user.yearLevel : editYearLevel;
    const updated = books.map(b => b.id === editingId ? { ...b, title: editTitle.trim(), author: editAuthor.trim(), category: editCategory.trim() || 'General', yearLevel: finalYear } : b);
    setBooks(updated); setBooksList(updated);
    setEditBookOpen(false); setEditingId(null);
    toast.success('Book updated');
  };

  const handleDeleteBook = (id: string) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    if (!window.confirm(`Delete book "${book.title}" by ${book.author}? This will also delete all associated loans. This action cannot be undone.`)) return;
    deleteBookCascade(id);
    setBooksList(getBooks());
    setLoansList(getLoans());
    toast.success('Book and all associated loans deleted');
  };

  const handleClearBorrowers = () => {
    // kept for compatibility but now delegates to coreClearBorrowers which performs the work
    if (!window.confirm('Are you sure you want to clear borrower requests and active loans for this librarian? This cannot be undone.')) return;
    coreClearBorrowers();
  };

  const coreClearBorrowers = () => {
    const myYear = user.yearLevel;
    const allLoans = getLoans();
    const allBooks = getBooks();
    const allUsers = getUsers();

    const loansToRemove = new Set<string>();
    for (const l of allLoans) {
      if (!myYear) continue;
      const book = allBooks.find(b => b.id === l.bookId);
      if (book && book.yearLevel === myYear) {
        loansToRemove.add(l.id);
        continue;
      }
      const borrower = allUsers.find(u => u.id === l.borrowerId);
      if (borrower && borrower.yearLevel === myYear) loansToRemove.add(l.id);
    }

    if (loansToRemove.size === 0) return false as any;

    const remaining = allLoans.filter(l => !loansToRemove.has(l.id));
    const removedBookIds = new Set<string>();
    for (const l of allLoans) if (loansToRemove.has(l.id)) removedBookIds.add(l.bookId);
    const updatedBooks = allBooks.map(b => removedBookIds.has(b.id) ? { ...b, status: 'available' as const } : b);

    setLoans(remaining);
    setLoansList(remaining);
    setBooks(updatedBooks);
    setBooksList(updatedBooks);
    return true as any;
  };

  // Automatic daily clear: store last clear date per user in localStorage under key 'lms_last_clear'
  useEffect(() => {
    if (!user) return;
    const doCheck = () => {
      const today = new Date().toISOString().split('T')[0];
      const mapRaw = localStorage.getItem('lms_last_clear');
      const map = mapRaw ? JSON.parse(mapRaw) : {};
      const last = map[user.id];
      if (last !== today) {
        // perform clear for this librarian if they have a yearLevel
        if (user.yearLevel) {
          const cleared = coreClearBorrowers();
          if (cleared) {
            map[user.id] = today;
            localStorage.setItem('lms_last_clear', JSON.stringify(map));
            toast.success('Borrowers cleared for this librarian (daily auto-clear)');
          } else {
            // still mark as cleared so we don't repeatedly attempt during the same day
            map[user.id] = today;
            localStorage.setItem('lms_last_clear', JSON.stringify(map));
          }
        } else {
          // mark anyway so we don't attempt repeatedly
          map[user.id] = today;
          localStorage.setItem('lms_last_clear', JSON.stringify(map));
        }
      }
    };
    // run immediately and then once per minute
    doCheck();
    const id = setInterval(doCheck, 60_000);
    return () => clearInterval(id);
  }, [user]);

  const handleAccept = (loanId: string, type: 'return' | 'renewal') => {
    let updated = getLoans();
    if (type === 'return') {
      const loan = updated.find(l => l.id === loanId);
      if (loan) {
        const booksUpdated = books.map(b => b.id === loan.bookId ? { ...b, status: 'available' as const } : b);
        setBooks(booksUpdated); setBooksList(booksUpdated);
      }
      updated = updated.map(l => l.id === loanId ? { ...l, status: 'returned' as const } : l);
    } else {
      updated = updated.map(l => {
        if (l.id !== loanId) return l;
        const newDue = new Date(l.dueDate); newDue.setDate(newDue.getDate() + 14);
        return { ...l, dueDate: newDue.toISOString().split('T')[0], status: 'active' as const };
      });
    }
    setLoans(updated); setLoansList(updated);
    toast.success(`${type === 'return' ? 'Return' : 'Renewal'} accepted`);
  };

  const handleDecline = (loanId: string) => {
    const updated = loans.map(l => l.id === loanId ? { ...l, status: 'active' as const } : l);
    setLoans(updated); setLoansList(updated);
    toast.success('Request declined');
  };

  const handleApproveBorrow = (loanId: string) => {
    let updated = getLoans();
    const loan = updated.find(l => l.id === loanId);
    if (!loan) return;
    const booksUpdated = books.map(b => b.id === loan.bookId ? { ...b, status: 'borrowed' as const } : b);
    setBooks(booksUpdated); setBooksList(booksUpdated);
    updated = updated.map(l => l.id === loanId ? { ...l, status: 'active' as const } : l);
    setLoans(updated); setLoansList(updated);
    toast.success('Borrow request accepted');
  };

  const handleDeclineBorrow = (loanId: string) => {
    const updated = loans.map(l => l.id === loanId ? { ...l, status: 'declined' as const } : l);
    setLoans(updated); setLoansList(updated);
    toast.success('Borrow request declined');
  };

  // Only show pending returns/renewals/borrows for books matching this librarian's year level
  const pendingReturns = loans.filter(l => {
    if (l.status !== 'pending_return') return false;
    const book = books.find(b => b.id === l.bookId);
    if (!book) return false;
    return user.yearLevel ? book.yearLevel === user.yearLevel : true;
  });
  const pendingRenewals = loans.filter(l => {
    if (l.status !== 'pending_renewal') return false;
    const book = books.find(b => b.id === l.bookId);
    if (!book) return false;
    return user.yearLevel ? book.yearLevel === user.yearLevel : true;
  });
  const pendingBorrows = loans.filter(l => {
    if (l.status !== 'pending') return false;
    const book = books.find(b => b.id === l.bookId);
    if (!book) return false;
    return user.yearLevel ? book.yearLevel === user.yearLevel : true;
  });
  const getBorrowerName = (id: string) => users.find(u => u.id === id)?.fullName || 'Unknown';
  const getBookTitle = (id: string) => books.find(b => b.id === id)?.title || 'Unknown';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'catalog', label: 'Catalog' }, { key: 'borrowers', label: 'Borrowers' },
    { key: 'reservations', label: 'Reservations' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onEditDetails={() => setEditOpen(true)} onChangePassword={() => setPassOpen(true)} onSettings={() => setSettingsOpen(true)} />
      <main className="w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 animate-fade-in">Library Management</h1>

        <div className="flex gap-2 sm:gap-6 border-b mb-4 sm:mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-xs sm:text-sm font-medium relative transition-colors whitespace-nowrap ${tab === t.key ? 'text-maroon' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon rounded-full transition-all" />
              )}
            </button>
          ))}
        </div>

        {tab === 'catalog' && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div><h2 className="text-sm sm:text-lg font-bold">Book Catalog</h2><p className="text-xs sm:text-sm text-muted-foreground">Manage library books and inventory</p></div>
              <Button onClick={() => setAddOpen(true)} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground transition-all hover:shadow-md active:scale-[0.98] text-xs sm:text-sm w-full sm:w-auto"><Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Add Book</Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 text-xs sm:text-sm" />
              </div>
              <Button variant="outline" onClick={() => { setBooksList(getBooks()); setLoansList(getLoans()); }} className="transition-all hover:shadow-sm active:scale-[0.98] text-xs sm:text-sm w-full sm:w-auto"><RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Refresh</Button>
            </div>
            
            <div className="bg-card rounded-lg border overflow-hidden">
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3 p-3 sm:p-4">
                {filteredBooks.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground text-xs sm:text-sm">No books found</p>
                ) : filteredBooks.map(book => (
                  <div key={book.id} className="border rounded-lg p-3 sm:p-4 space-y-2 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground truncate">by {book.author}</p>
                        <p className="text-xs text-muted-foreground">{book.category}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${book.status === 'available' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {book.status === 'available' ? 'Available' : 'Borrowed'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditBook(book)} className="text-foreground hover:text-foreground transition-all p-1 sm:p-2 flex-1"><Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteBook(book.id)} className="text-destructive hover:text-destructive transition-all p-1 sm:p-2 flex-1"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Title</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Author</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Category</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th></tr></thead>
                  <tbody>
                    {filteredBooks.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-xs sm:text-sm">No books found</td></tr>
                    ) : filteredBooks.map(book => (
                      <tr key={book.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                        <td className="p-4 text-sm font-medium">{book.title}</td>
                        <td className="p-4 text-sm text-muted-foreground">{book.author}</td>
                        <td className="p-4 text-sm text-muted-foreground">{book.category}</td>
                        <td className="p-4"><span className={`text-xs font-semibold px-2 py-1 rounded ${book.status === 'available' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{book.status === 'available' ? 'Available' : 'Borrowed'}</span></td>
                        <td className="p-4 flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditBook(book)} className="text-foreground hover:text-foreground transition-all hover:scale-105 p-1 sm:p-2"><Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteBook(book.id)} className="text-destructive hover:text-destructive transition-all hover:scale-105 p-1 sm:p-2"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'borrowers' && (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-maroon font-semibold">Borrowers</p>
                <p className="text-xl sm:text-2xl font-bold">{loans.filter(l => l.status !== 'returned' && (user.yearLevel ? books.find(b => b.id === l.bookId)?.yearLevel === user.yearLevel : true)).length}</p>
              </div>
              <div />
            </div>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3 p-3 sm:p-4">
              {loans.filter(l => l.status !== 'returned' && (user.yearLevel ? books.find(b => b.id === l.bookId)?.yearLevel === user.yearLevel : true)).length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-xs sm:text-sm">No active borrowers</p>
              ) : loans.filter(l => l.status !== 'returned' && (user.yearLevel ? books.find(b => b.id === l.bookId)?.yearLevel === user.yearLevel : true)).map(l => (
                <div key={l.id} className="border rounded-lg p-3 sm:p-4 space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{getBorrowerName(l.borrowerId)}</p>
                      <p className="text-xs text-muted-foreground truncate">{getBookTitle(l.bookId)}</p>
                      <p className="text-xs text-muted-foreground">Borrowed: {l.borrowDate}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${l.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{l.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Due: {l.dueDate}</p>
                </div>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrower</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Book</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrow Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Due Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th></tr></thead>
                <tbody>
                {loans.filter(l => l.status !== 'returned' && (user.yearLevel ? books.find(b => b.id === l.bookId)?.yearLevel === user.yearLevel : true)).length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No active borrowers</td></tr>
                ) : loans.filter(l => l.status !== 'returned' && (user.yearLevel ? books.find(b => b.id === l.bookId)?.yearLevel === user.yearLevel : true)).map(l => (
                  <tr key={l.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                    <td className="p-4 text-sm font-medium">{getBorrowerName(l.borrowerId)}</td>
                    <td className="p-4 text-sm">{getBookTitle(l.bookId)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{l.borrowDate}</td>
                    <td className="p-4 text-sm text-muted-foreground">{l.dueDate}</td>
                    <td className="p-4"><span className={`text-xs font-semibold px-2 py-1 rounded ${l.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>
        )}

        {tab === 'reservations' && (
          <>
            <h2 className="text-lg font-bold mb-1">Reservation Management</h2>
            <p className="text-sm text-muted-foreground mb-6">Manage book reservations and returns</p>

            <h3 className="font-bold mb-3">Pending Requests</h3>
            <div className="bg-card rounded-lg border overflow-hidden mb-8">
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Book</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrower</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th></tr></thead>
                <tbody>
                  {pendingBorrows.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No pending requests</td></tr>
                  ) : pendingBorrows.map(l => (
                    <tr key={l.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="p-4 text-sm font-medium">{getBookTitle(l.bookId)}</td>
                      <td className="p-4 text-sm">{getBorrowerName(l.borrowerId)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{l.borrowDate}</td>
                      <td className="p-4 flex gap-2">
                        <Button size="sm" onClick={() => handleApproveBorrow(l.id)} className="bg-success hover:bg-success/90 text-success-foreground transition-all active:scale-[0.98]"><Check className="w-3 h-3 mr-1" /> Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeclineBorrow(l.id)} className="text-destructive border-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"><X className="w-3 h-3 mr-1" /> Decline</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-bold mb-3">Return Requests</h3>
            <div className="bg-card rounded-lg border overflow-hidden mb-8">
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Book</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrower</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrowed Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th></tr></thead>
                <tbody>
                  {pendingReturns.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No return requests</td></tr>
                  ) : pendingReturns.map(l => (
                    <tr key={l.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="p-4 text-sm font-medium">{getBookTitle(l.bookId)}</td>
                      <td className="p-4 text-sm">{getBorrowerName(l.borrowerId)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{l.borrowDate}</td>
                      <td className="p-4 flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(l.id, 'return')} className="bg-success hover:bg-success/90 text-success-foreground transition-all active:scale-[0.98]"><Check className="w-3 h-3 mr-1" /> Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(l.id)} className="text-destructive border-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"><X className="w-3 h-3 mr-1" /> Decline</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-bold mb-3">Renewal Requests</h3>
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Book</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrower</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Current Due Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th></tr></thead>
                <tbody>
                  {pendingRenewals.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No renewal requests</td></tr>
                  ) : pendingRenewals.map(l => (
                    <tr key={l.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="p-4 text-sm font-medium">{getBookTitle(l.bookId)}</td>
                      <td className="p-4 text-sm">{getBorrowerName(l.borrowerId)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{l.dueDate}</td>
                      <td className="p-4 flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(l.id, 'renewal')} className="bg-success hover:bg-success/90 text-success-foreground transition-all active:scale-[0.98]"><Check className="w-3 h-3 mr-1" /> Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(l.id)} className="text-destructive border-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"><X className="w-3 h-3 mr-1" /> Decline</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Add Book Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New Book</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1" placeholder="Book title" /></div>
            <div><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Author</Label><Input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className="mt-1" placeholder="Author name" /></div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Genre / Category</Label>
              <Input value={newGenre || newCategory} onChange={e => setNewGenre(e.target.value)} className="mt-1" placeholder="e.g., Sci-Fi, Computer Science" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year Level</Label>
              <Select onValueChange={v => setNewYearLevel(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select year level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="IBED">IBED</SelectItem>
                  <SelectItem value="JHS/SHS">Junior High & Senior High</SelectItem>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="College of Law">College of Law</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddBook} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground transition-all hover:shadow-md active:scale-[0.98]">Add Book</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editBookOpen} onOpenChange={setEditBookOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Book</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1" placeholder="Book title" /></div>
            <div><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Author</Label><Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} className="mt-1" placeholder="Author name" /></div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Genre / Category</Label>
              <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} className="mt-1" placeholder="e.g., Sci-Fi, Computer Science" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year Level</Label>
              <Select onValueChange={v => setEditYearLevel(v as any)} value={editYearLevel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select year level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="IBED">IBED</SelectItem>
                  <SelectItem value="JHS/SHS">Junior High & Senior High</SelectItem>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="College of Law">College of Law</SelectItem>
                </SelectContent>
              </Select>
              {user.role === 'librarian' && user.yearLevel && <p className="text-xs text-muted-foreground mt-1">As a librarian, you cannot change the year level from {user.yearLevel}.</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setEditBookOpen(false); setEditingId(null); }}>Cancel</Button>
              <Button onClick={handleSaveEdit} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground transition-all hover:shadow-md active:scale-[0.98]">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Library Settings</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">Library hours: 7 AM – 6 PM, Monday to Saturday</p>
            <p className="text-sm text-muted-foreground">Default loan period: 14 days</p>
            <p className="text-sm text-muted-foreground">Renewal extension: 14 days</p>
          </div>
        </DialogContent>
      </Dialog>

      <EditDetailsDialog user={user} open={editOpen} onClose={(u) => { setEditOpen(false); if (u) setUser(u); }} />
      <ChangePasswordDialog user={user} open={passOpen} onClose={(u) => { setPassOpen(false); if (u) setUser(u); }} />
    </div>
  );
}
