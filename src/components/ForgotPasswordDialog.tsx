import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { getUsers } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordDialog({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) { toast.error('Enter your email address'); return; }
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) { toast.error('Email address not found'); return; }
    // Simulate sending a reset link
    setSubmitted(true);
    toast.success('Password reset instructions sent to your email');
  };

  const handleClose = () => {
    setEmail('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!submitted ? (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-maroon/10 flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-maroon" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Forgot Password</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Enter your email address and we'll send password reset instructions to your registered email.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your email address"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full bg-maroon hover:bg-maroon/90 text-maroon-foreground">
                Send Reset Link
              </Button>
              <button onClick={handleClose} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Check Your Email</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              We've sent password reset instructions to the email you provided.
            </p>
            <Button onClick={handleClose} variant="outline">
              Back to Login
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
