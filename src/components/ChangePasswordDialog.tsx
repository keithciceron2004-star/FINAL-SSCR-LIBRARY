import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { type User, getUsers, setUsers, setCurrentUser } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  user: User;
  open: boolean;
  onClose: (updated?: User) => void;
}

export default function ChangePasswordDialog({ user, open, onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = () => {
    if (current !== user.password) { toast.error('Current password is incorrect'); return; }
    if (newPass.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPass !== confirm) { toast.error('Passwords do not match'); return; }
    const users = getUsers();
    const updated = users.map(u => u.id === user.id ? { ...u, password: newPass, mustChangePassword: false } : u);
    setUsers(updated);
    const updatedUser = updated.find(u => u.id === user.id)!;
    setCurrentUser(updatedUser);
    toast.success('Password updated');
    setCurrent(''); setNewPass(''); setConfirm('');
    onClose(updatedUser);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-maroon/10 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-maroon" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">Change Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Update your account password.</p>
        </div>
        <div className="space-y-4 border rounded-lg p-4">
          <button onClick={() => onClose()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {[
            { label: 'CURRENT PASSWORD', value: current, set: setCurrent, show: showCurrent, toggle: () => setShowCurrent(!showCurrent), placeholder: 'Enter current password' },
            { label: 'NEW PASSWORD', value: newPass, set: setNewPass, show: showNew, toggle: () => setShowNew(!showNew), placeholder: 'Min 8 characters' },
            { label: 'CONFIRM PASSWORD', value: confirm, set: setConfirm, show: showConfirm, toggle: () => setShowConfirm(!showConfirm), placeholder: 'Re-enter new password' },
          ].map(f => (
            <div key={f.label}>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</Label>
              <div className="relative mt-1">
                <Input type={f.show ? 'text' : 'password'} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="pr-10" />
                <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <Button onClick={handleUpdate} className="w-full bg-maroon hover:bg-maroon/90 text-maroon-foreground">
            Update Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
