import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import { login } from '@/lib/store';
import { toast } from 'sonner';

const logoUrl = `${import.meta.env.BASE_URL}favicon.png`;

export default function Login() {
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    const user = login(schoolId.trim(), password);
    if (!user) { toast.error('Invalid credentials'); return; }
    if (user.role === 'librarian') navigate('/librarian');
    else if (user.role === 'supervisor') navigate('/supervisor');
    else navigate('/borrower');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col items-center mb-6 sm:mb-8 animate-fade-in">
        <img src={logoUrl} alt="SSCR logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4 object-cover bg-white/5" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">San Sebastian College Recoletos</h1>
        <p className="text-muted-foreground text-xs sm:text-sm italic mt-1">Caritas Et Scientia</p>
      </div>

      <div className="w-full max-w-xs bg-card rounded-xl border p-4 sm:p-6 space-y-3 sm:space-y-4 animate-scale-in shadow-sm">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="School ID / Username"
            value={schoolId}
            onChange={e => setSchoolId(e.target.value)}
            className="pl-10 transition-shadow focus:shadow-md h-9 sm:h-10 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
        </div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0 pointer-events-none" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pl-10 pr-10 transition-shadow focus:shadow-md h-9 sm:h-10 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Checkbox /> <span className="hidden sm:inline">Remember for 30 Days</span><span className="sm:hidden">Remember</span>
          </label>
        </div>
        <Button onClick={handleLogin} className="w-full bg-maroon hover:bg-maroon/90 text-maroon-foreground font-semibold transition-all hover:shadow-md active:scale-[0.98] h-9 sm:h-10 text-sm">
          Sign in
        </Button>
        <div className="text-right mt-2">
          <button onClick={() => setForgotOpen(true)} className="text-xs sm:text-sm text-maroon font-medium hover:underline transition-colors">Forgot Password</button>
        </div>
      </div>

      <p className="mt-6 sm:mt-8 text-xs text-muted-foreground text-center px-2">© 2026 San Sebastian College Recoletos – Library</p>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
