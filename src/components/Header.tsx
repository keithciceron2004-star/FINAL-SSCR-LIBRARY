import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Pencil, KeyRound, ChevronDown, Settings } from 'lucide-react';
import { getCurrentUser, logout, type User } from '@/lib/store';

const logoUrl = `${import.meta.env.BASE_URL}favicon.png`;

interface HeaderProps {
  user: User;
  onEditDetails: () => void;
  onChangePassword: () => void;
  onSettings?: () => void;
}

export default function Header({ user, onEditDetails, onChangePassword, onSettings }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabel = user.role === 'student' ? 'STUDENT' : user.role === 'faculty' ? 'FACULTY' : user.role === 'librarian' ? 'LIBRARIAN' : 'SUPERVISOR';
  const roleBg = user.role === 'supervisor' ? 'bg-primary text-primary-foreground' : 'bg-maroon/10 text-maroon';
  const badgeClass = 'bg-white text-maroon text-xs font-semibold px-2 py-0.5 rounded border border-maroon/10 shadow-sm';

  return (
    <header className="bg-maroon text-maroon-foreground">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="SSCR" className="w-8 h-8 rounded-full bg-white/5 object-cover" />
          <span className="font-semibold tracking-wide text-sm uppercase">SSCR - LIBRARY</span>
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:opacity-80 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-maroon-foreground/20 flex items-center justify-center text-sm font-semibold">
              {user.fullName[0]}
            </div>
            <span className="text-sm font-medium flex items-center gap-2">
              <span>{user.fullName}</span>
              <span className={badgeClass}>{roleLabel}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-lg border shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b">
                <p className="font-semibold text-card-foreground">{user.fullName}</p>
              </div>
              <button onClick={() => { setOpen(false); onEditDetails(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">
                <Pencil className="w-4 h-4 text-muted-foreground" /> Edit Details
              </button>
              <button onClick={() => { setOpen(false); onChangePassword(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">
                <KeyRound className="w-4 h-4 text-muted-foreground" /> Change Password
              </button>
              {onSettings && (
                <button onClick={() => { setOpen(false); onSettings(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" /> Settings
                </button>
              )}
              <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
