import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import { login } from '@/lib/store';
import { toast } from 'sonner';

export default function Login() {
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <img src="/favicon.png" alt="SSCR logo" className="w-20 h-20 rounded-full mb-4 object-cover bg-white/5" />
        <h1 className="text-2xl font-bold text-foreground">San Sebastian College Recoletos</h1>
        <p className="text-muted-foreground text-sm italic mt-1">Caritas Et Scientia</p>
      </div>

      <div className="w-full max-w-xs bg-card rounded-xl border p-6 space-y-4 animate-scale-in shadow-sm">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="School ID / Username"
            value={schoolId}
            onChange={e => setSchoolId(e.target.value)}
            className="pl-10 transition-shadow focus:shadow-md h-9"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
        </div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pl-10 transition-shadow focus:shadow-md h-9"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox /> Remember for 30 Days
          </label>
        </div>
        <Button onClick={handleLogin} className="w-full bg-maroon hover:bg-maroon/90 text-maroon-foreground font-semibold transition-all hover:shadow-md active:scale-[0.98]">
          Sign in
        </Button>
        <div className="text-right mt-2">
          <button onClick={() => setForgotOpen(true)} className="text-sm text-maroon font-medium hover:underline transition-colors">Forgot Password</button>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">© 2026 San Sebastian College Recoletos – Library</p>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
