import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Search } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import EditDetailsDialog from '@/components/EditDetailsDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { getCurrentUser, getBooks, getLoans, setLoans, genId, type User, type Loan } from '@/lib/store';
import { toast } from 'sonner';

export default function BorrowerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [books, setBooksList] = useState(getBooks());
  const [loans, setLoansList] = useState(getLoans());
  const [search, setSearch] = useState('');
  const [showBooks, setShowBooks] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(user?.mustChangePassword ?? false);

  useEffect(() => { if (!user || (user.role !== 'student' && user.role !== 'faculty')) navigate('/'); }, [user]);
  if (!user) return null;

  const myLoans = loans.filter(l => l.borrowerId === user.id && (l.status === 'active' || l.status === 'pending' || l.status === 'pending_return' || l.status === 'pending_renewal'));
  const nextDue = myLoans.filter(l => l.status === 'active').sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  let filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );
  // Year-level visibility: students see books for their yearLevel or 'All'. Special user 2023102738 sees all books.
  if (user.role === 'student' && user.schoolId !== '2023102738') {
    filteredBooks = filteredBooks.filter(b => (b.yearLevel || 'All') === 'All' || b.yearLevel === user.yearLevel);
  }
  // No extra filters for borrowers (UI removed)

  const handleBorrow = (bookId: string) => {
    const now = new Date();
    const due = new Date(now); due.setDate(due.getDate() + 14);
    const loan: Loan = { id: genId(), bookId, borrowerId: user.id, borrowDate: now.toISOString().split('T')[0], dueDate: due.toISOString().split('T')[0], status: 'pending' };
    const updatedLoans = [...loans, loan]; setLoans(updatedLoans); setLoansList(updatedLoans);
    toast.success('Borrow request submitted — awaiting librarian approval');
  };

  const handleReturn = (loanId: string) => {
    const updated = loans.map(l => l.id === loanId ? { ...l, status: 'pending_return' as const } : l);
    setLoans(updated); setLoansList(updated);
    toast.success('Return request submitted');
  };

  const handleRenewal = (loanId: string) => {
    const updated = loans.map(l => l.id === loanId ? { ...l, status: 'pending_renewal' as const } : l);
    setLoans(updated); setLoansList(updated);
    toast.success('Renewal request submitted');
  };

  const getBookTitle = (bookId: string) => books.find(b => b.id === bookId)?.title || 'Unknown';

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onEditDetails={() => setEditOpen(true)} onChangePassword={() => setPassOpen(true)} />
      <main className="w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 animate-fade-in">My Library</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-card rounded-lg border p-3 sm:p-5 flex flex-col sm:flex-row sm:justify-between transition-shadow hover:shadow-md">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Loans</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{myLoans.filter(l => l.status === 'active').length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Currently borrowed</p>
            </div>
            <BookOpen className="w-5 h-5 text-maroon flex-shrink-0 mt-2 sm:mt-0 sm:ml-2" />
          </div>
          <div className="bg-card rounded-lg border p-3 sm:p-5 flex flex-col sm:flex-row sm:justify-between transition-shadow hover:shadow-md">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Due</p>
              <p className="text-lg sm:text-xl font-bold mt-1 truncate">{nextDue ? nextDue.dueDate : '—'}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{nextDue ? getBookTitle(nextDue.bookId) : 'Nothing pending'}</p>
            </div>
            <Calendar className="w-5 h-5 text-maroon flex-shrink-0 mt-2 sm:mt-0 sm:ml-2" />
          </div>
          <div className="bg-card rounded-lg border p-3 sm:p-5 flex flex-col sm:flex-row sm:justify-between transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Library Hours</p>
              <p className="text-lg sm:text-xl font-bold mt-1">7 AM – 6 PM</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Monday to Saturday</p>
            </div>
            <Clock className="w-5 h-5 text-maroon flex-shrink-0 mt-2 sm:mt-0 sm:ml-2" />
          </div>
        </div>

        {/* Active Loans */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 flex-wrap">
          <h2 className="text-lg sm:text-xl font-bold">Active Loans</h2>
          <Button size="sm" variant={showBooks ? 'destructive' : 'default'} className={`text-xs sm:text-sm transition-all active:scale-[0.98] ${showBooks ? 'bg-maroon hover:bg-maroon/90' : ''}`} onClick={() => setShowBooks(!showBooks)}>
            {showBooks ? 'Hide Books' : 'Show Books'}
          </Button>
        </div>

        {myLoans.length === 0 ? (
          <div className="bg-card rounded-lg border p-6 sm:p-12 text-center mb-6 sm:mb-8">
            <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mx-auto text-muted-foreground mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">No active loans. Browse books to get started.</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border mb-6 sm:mb-8 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Book</th>
                  <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Borrow</th>
                  <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Due</th>
                  <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Status</th>
                  <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {myLoans.map(loan => (
                  <tr key={loan.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                    <td className="p-2 sm:p-4 font-medium truncate text-xs sm:text-sm">{getBookTitle(loan.bookId)}</td>
                    <td className="p-2 sm:p-4 text-muted-foreground text-xs sm:text-sm">{loan.borrowDate}</td>
                    <td className="p-2 sm:p-4 text-muted-foreground text-xs sm:text-sm">{loan.dueDate}</td>
                    <td className="p-2 sm:p-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${loan.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {loan.status === 'active' ? 'Active' : loan.status === 'pending_return' ? 'Pending' : 'Renew'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4">
                      {loan.status === 'active' ? (
                        <div className="flex gap-1 sm:gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleReturn(loan.id)} className="text-xs transition-all active:scale-[0.98]">Return</Button>
                          <Button size="sm" variant="outline" onClick={() => handleRenewal(loan.id)} className="text-xs transition-all active:scale-[0.98]">Renew</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Waiting</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Browse Books */}
        {showBooks && (
          <>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Browse Books</h2>
            <div className="relative mb-3 sm:mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 text-sm" />
              </div>
            </div>
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Title</th>
                    <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Author</th>
                    <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Category</th>
                    <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Status</th>
                    <th className="text-left font-semibold text-muted-foreground uppercase tracking-wider p-2 sm:p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">No books found</td></tr>
                  ) : filteredBooks.map(book => (
                    <tr key={book.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="p-2 sm:p-4 font-medium truncate text-xs sm:text-sm">{book.title}</td>
                      <td className="p-2 sm:p-4 text-muted-foreground truncate text-xs sm:text-sm">{book.author}</td>
                      <td className="p-2 sm:p-4 text-muted-foreground truncate text-xs sm:text-sm">{book.category}</td>
                      <td className="p-2 sm:p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${book.status === 'available' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {book.status === 'available' ? 'Available' : 'Borrowed'}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4">
                        {book.status === 'available' ? (
                          <Button size="sm" onClick={() => handleBorrow(book.id)} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground text-xs transition-all hover:shadow-md active:scale-[0.98]">Borrow</Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <EditDetailsDialog user={user} open={editOpen} onClose={(u) => { setEditOpen(false); if (u) setUser(u); }} />
      <ChangePasswordDialog user={user} open={passOpen} onClose={(u) => { setPassOpen(false); if (u) setUser(u); }} />
    </div>
  );
}
