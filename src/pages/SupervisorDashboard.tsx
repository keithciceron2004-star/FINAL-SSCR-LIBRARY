import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, BookOpen, Users, Calendar, Settings, Search, UserPlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditDetailsDialog from '@/components/EditDetailsDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { getCurrentUser, getUsers, setUsers, getBooks, setBooks, getLoans, genId, resetDefaults, type User } from '@/lib/store';
import { toast } from 'sonner';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [allUsers, setAllUsers] = useState(getUsers());
  const [search, setSearch] = useState('');
  const [studentYearFilter, setStudentYearFilter] = useState('ANY');
  const [filterTab, setFilterTab] = useState<'students' | 'librarians' | 'faculty'>('students');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [deleteQuery, setDeleteQuery] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'faculty'>('student');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newYearLevel, setNewYearLevel] = useState<'IBED' | 'JHS/SHS' | 'College' | 'College of Law'>('College');
  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(user?.mustChangePassword ?? false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { if (!user || user.role !== 'supervisor') navigate('/'); }, [user]);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const students = allUsers.filter(u => u.role === 'student');
  const faculty = allUsers.filter(u => u.role === 'faculty');
  const librarians = allUsers.filter(u => u.role === 'librarian');
  const borrowersCount = students.length + faculty.length;
  const books = getBooks();

  let filtered = (filterTab === 'students' ? students : filterTab === 'faculty' ? faculty : librarians).filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) || u.schoolId.includes(search)
  );
  if (filterTab === 'students' && studentYearFilter && studentYearFilter !== 'ANY') filtered = filtered.filter(u => u.yearLevel === studentYearFilter);

  const handleAddUser = () => {
    if (!newSchoolId.trim() || !newFullName.trim()) { toast.error('Fill in all fields'); return; }
    const newUser: User = {
      id: genId(), schoolId: newSchoolId.trim(), fullName: newFullName.trim(),
      email: `${newSchoolId.trim()}@example.com`, password: 'gobaste123', role: newRole,
      yearLevel: newRole === 'student' ? newYearLevel : undefined,
      mustChangePassword: true,
    };
    const updated = [...allUsers, newUser]; setUsers(updated); setAllUsers(updated);
    setNewSchoolId(''); setNewFullName(''); setAddOpen(false);
    toast.success('User created with default password: gobaste123');
  };

  const handleDeleteUser = () => {
    const q = deleteQuery.trim().toLowerCase();
    if (!q) { toast.error('Enter a School ID or name'); return; }
    const target = allUsers.find(u => (u.role === 'student' || u.role === 'faculty') && (u.schoolId.toLowerCase() === q || u.fullName.toLowerCase() === q));
    if (!target) { toast.error('User not found'); return; }
    if (!window.confirm(`Delete user ${target.fullName}? This action cannot be undone.`)) return;
    const updated = allUsers.filter(u => u.id !== target.id); setUsers(updated); setAllUsers(updated);
    setDeleteQuery(''); setDeleteOpen(false);
    toast.success(`${target.fullName} deleted`);
  };

  const handleDeleteBookAsSupervisor = (bookId: string) => {
    const b = getBooks().find(x => x.id === bookId);
    if (!b) return;
    if (!window.confirm(`Delete book "${b.title}" by ${b.author}? This action cannot be undone.`)) return;
    const updated = getBooks().filter(x => x.id !== bookId);
    setBooks(updated);
    toast.success('Book deleted');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onEditDetails={() => setEditOpen(true)} onChangePassword={() => setPassOpen(true)} onSettings={() => setSettingsOpen(true)} />
      <ErrorBoundary>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 animate-fade-in">User Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div onClick={() => setCatalogOpen(true)} role="button" tabIndex={0} className="bg-card rounded-lg border p-5 flex justify-between transition-shadow hover:shadow-md cursor-pointer">
            <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalog</p><p className="text-3xl font-bold mt-1">{books.length}</p></div>
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="bg-card rounded-lg border p-5 flex justify-between transition-shadow hover:shadow-md">
            <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borrowers</p><p className="text-3xl font-bold mt-1">{borrowersCount}</p></div>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="bg-card rounded-lg border p-5 flex justify-between transition-shadow hover:shadow-md">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</p>
              <p className="text-lg font-bold mt-1">{now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-lg font-bold tabular-nums">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button size="sm" onClick={() => setFilterTab('students')} className={`transition-all ${filterTab === 'students' ? 'bg-maroon hover:bg-maroon/90 text-maroon-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Students ({students.length})
          </Button>
          <Button size="sm" onClick={() => setFilterTab('faculty')} className={`transition-all ${filterTab === 'faculty' ? 'bg-maroon hover:bg-maroon/90 text-maroon-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Faculty ({faculty.length})
          </Button>
          <Button size="sm" onClick={() => setFilterTab('librarians')} className={`transition-all ${filterTab === 'librarians' ? 'bg-maroon hover:bg-maroon/90 text-maroon-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Librarians ({librarians.length})
          </Button>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          {filterTab === 'students' && (
            <div className="w-48">
              <Select onValueChange={v => setStudentYearFilter(v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Year level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any</SelectItem>
                  <SelectItem value="IBED">IBED</SelectItem>
                  <SelectItem value="JHS/SHS">Junior High & Senior High</SelectItem>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="College of Law">College of Law</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button onClick={() => setAddOpen(true)} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground transition-all hover:shadow-md active:scale-[0.98]"><Plus className="w-4 h-4 mr-1" /> Add User</Button>
            <Button onClick={() => setDeleteOpen(true)} variant="destructive" className="transition-all hover:shadow-md active:scale-[0.98]"><Trash2 className="w-4 h-4 mr-1" /> Delete User</Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 border-b">
            <p className="text-sm text-maroon font-semibold">{filterTab === 'students' ? 'Students' : filterTab === 'faculty' ? 'Faculty' : 'Librarians'}</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
          <table className="w-full">
            <thead><tr className="border-b"><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Name</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">School ID</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">School Email</th><th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Role</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                  <td className="p-4 text-sm font-medium">{u.fullName}</td>
                  <td className="p-4 text-sm text-muted-foreground">{u.schoolId}</td>
                  <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${u.role === 'student' ? 'bg-destructive/10 text-destructive' : u.role === 'faculty' ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      </ErrorBoundary>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="flex gap-4 mt-2 mb-4">
            <button onClick={() => setNewRole('student')} className={`flex items-center gap-3 p-3 rounded-lg border flex-1 transition-all ${newRole === 'student' ? 'border-maroon bg-maroon/5 shadow-sm' : 'hover:bg-muted hover:shadow-sm'}`}>
              <UserPlus className="w-8 h-8 text-muted-foreground" />
              <div className="text-left"><p className="font-semibold text-sm">Student</p><p className="text-xs text-muted-foreground">Create a student account</p></div>
            </button>
            <button onClick={() => setNewRole('faculty')} className={`flex items-center gap-3 p-3 rounded-lg border flex-1 transition-all ${newRole === 'faculty' ? 'border-maroon bg-maroon/5 shadow-sm' : 'hover:bg-muted hover:shadow-sm'}`}>
              <Users className="w-8 h-8 text-muted-foreground" />
              <div className="text-left"><p className="font-semibold text-sm">Faculty</p><p className="text-xs text-muted-foreground">Create a faculty/librarian account</p></div>
            </button>
          </div>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">School ID</Label><Input value={newSchoolId} onChange={e => setNewSchoolId(e.target.value)} className="mt-1" placeholder="e.g., 2024-00001" /></div>
            <div><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label><Input value={newFullName} onChange={e => setNewFullName(e.target.value)} className="mt-1" placeholder="Enter full name" /></div>
            {newRole === 'student' && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year Level</Label>
                <Select onValueChange={v => setNewYearLevel(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select year level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IBED">IBED</SelectItem>
                    <SelectItem value="JHS/SHS">Junior High & Senior High</SelectItem>
                    <SelectItem value="College">College</SelectItem>
                    <SelectItem value="College of Law">College of Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Default password: <span className="font-semibold">gobaste123</span> — user must change it on first login.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground transition-all hover:shadow-md active:scale-[0.98]">Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Catalog Dialog */}
      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Catalog</DialogTitle></DialogHeader>
          <div className="mt-2">
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Title</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Author</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Category</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Assigned Librarian</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No books in catalog</td></tr>
                  ) : books.map(b => {
                    const assigned = b.yearLevel === 'All' ? 'All librarians' : (allUsers.find(u => u.role === 'librarian' && u.yearLevel === b.yearLevel)?.fullName || 'Unassigned');
                    return (
                      <tr key={b.id} className="border-b last:border-0 transition-colors hover:bg-muted/50">
                        <td className="p-4 text-sm font-medium">{b.title}</td>
                        <td className="p-4 text-sm text-muted-foreground">{b.author}</td>
                        <td className="p-4 text-sm text-muted-foreground">{b.category}</td>
                        <td className="p-4 text-sm text-muted-foreground">{assigned}</td>
                          <td className="p-4 text-sm">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteBookAsSupervisor(b.id)} className="text-destructive hover:text-destructive transition-all active:scale-[0.98]"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">Enter the School ID or full name of the user to delete.</p>
          <Input value={deleteQuery} onChange={e => setDeleteQuery(e.target.value)} placeholder="School ID or Full Name" className="mt-3" />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteUser} variant="destructive" className="transition-all hover:shadow-md active:scale-[0.98]">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <EditDetailsDialog user={user} open={editOpen} onClose={(u) => { setEditOpen(false); if (u) setUser(u); }} />
      <ChangePasswordDialog user={user} open={passOpen} onClose={(u) => { setPassOpen(false); if (u) setUser(u); }} />
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Supervisor Settings</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">Library hours: 7 AM – 6 PM, Monday to Saturday</p>
            <p className="text-sm text-muted-foreground">Default loan period: 14 days</p>
            <p className="text-sm text-muted-foreground">Renewal extension: 14 days</p>
            <div className="flex justify-end">
              <Button variant="destructive" onClick={() => {
                resetDefaults();
                setAllUsers(getUsers());
                toast.success('Defaults restored');
              }}>Reset Defaults</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
