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

  // Auth check on mount and when user changes
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'faculty')) {
      navigate('/');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

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
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 animate-fade-in">My Library</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-5 flex justify-between transition-shadow hover:shadow-md">
            <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Loans</p><p className="text-3xl font-bold mt-1">{myLoans.filter(l => l.status === 'active').length}</p><p className="text-sm text-muted-foreground">Currently borrowed</p></div>
            <BookOpen className="w-5 h-5 text-maroon" />
          </div>
          <div className="bg-card rounded-lg border p-5 flex justify-between transition-shadow hover:shadow-md">
            <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Due</p><p className="text-xl font-bold mt-1">{nextDue ? nextDue.dueDate : '—'}</p><p className="text-sm text-muted-foreground">{nextDue ? getBookTitle(nextDue.bookId) : 'Nothing pending'}</p></div>
            <Calendar className="w-5 h-5 text-maroon" />
          </div>
          <div className="bg-card rounded-lg border p-5 flex justify-between transition-shadow hover:shadow-md">
            <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Library Hours</p><p className="text-xl font-bold mt-1">7 AM – 6 PM</p><p className="text-sm text-muted-foreground">Monday to Saturday</p></div>
            <Clock className="w-5 h-5 text-maroon" />
          </div>
        </div>

        {/* Active Loans */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Active Loans</h2>
          <Button size="sm" variant={showBooks ? 'destructive' : 'default'} className={`transition-all active:scale-[0.98] ${showBooks ? 'bg-maroon hover:bg-maroon/90' : ''}`} onClick={() => setShowBooks(!showBooks)}>
            {showBooks ? 'Hide Books' : 'Show Books'}
          </Button>
        </div>

        {myLoans.length === 0 ? (
          <div className="bg-card rounded-lg border p-6 sm:p-8 text-center mb-6 sm:mb-8">
            <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mx-auto text-muted-foreground mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">No active loans. Browse books to get started.</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border mb-6 sm:mb-8 overflow-hidden">
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3 p-3 sm:p-4">
              {myLoans.map(loan => (
                <div key={loan.id} className="border rounded-lg p-3 sm:p-4 space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{getBookTitle(loan.bookId)}</p>
                      <p className="text-xs text-muted-foreground">Borrowed: {loan.borrowDate}</p>
                      <p className="text-xs text-muted-foreground">Due: {loan.dueDate}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${loan.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {loan.status === 'active' ? 'Active' : loan.status === 'pending_return' ? 'Pending' : 'Renew'}
                    </span>
                  </div>
                  {loan.status === 'active' ? (
                    <div className="flex gap-1 flex-wrap pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleReturn(loan.id)} className="text-xs flex-1 h-8">Return</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRenewal(loan.id)} className="text-xs flex-1 h-8">Renew</Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pt-2">Awaiting approval</p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Book</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Borrow Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Due Date</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th></tr></thead>
                <tbody>
                  {myLoans.map(loan => (
                    <tr key={loan.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="p-4 text-sm font-medium">{getBookTitle(loan.bookId)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{loan.borrowDate}</td>
                      <td className="p-4 text-sm text-muted-foreground">{loan.dueDate}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${loan.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {loan.status === 'active' ? 'Active' : loan.status === 'pending_return' ? 'Pending Return' : 'Pending Renewal'}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        {loan.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleReturn(loan.id)} className="transition-all active:scale-[0.98]">Return</Button>
                            <Button size="sm" variant="outline" onClick={() => handleRenewal(loan.id)} className="transition-all active:scale-[0.98]">Renew</Button>
                          </>
                        )}
                        {loan.status !== 'active' && <span className="text-xs text-muted-foreground">Waiting for approval</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Browse Books */}
        {showBooks && (
          <>
            <h2 className="text-lg font-bold mb-4">Browse Books</h2>
            <div className="relative mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Title</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Author</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Category</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Action</th></tr></thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No books found</td></tr>
                  ) : filteredBooks.map(book => (
                    <tr key={book.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                      <td className="p-4 text-sm font-medium">{book.title}</td>
                      <td className="p-4 text-sm text-muted-foreground">{book.author}</td>
                      <td className="p-4 text-sm text-muted-foreground">{book.category}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${book.status === 'available' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {book.status === 'available' ? 'Available' : 'Borrowed'}
                        </span>
                      </td>
                      <td className="p-4">
                        {book.status === 'available' ? (
                          <Button size="sm" onClick={() => handleBorrow(book.id)} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground transition-all hover:shadow-md active:scale-[0.98]">Borrow</Button>
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
