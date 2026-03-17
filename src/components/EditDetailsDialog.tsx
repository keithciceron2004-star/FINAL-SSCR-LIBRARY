import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type User, getUsers, setUsers, setCurrentUser } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  user: User;
  open: boolean;
  onClose: (updated?: User) => void;
}

export default function EditDetailsDialog({ user, open, onClose }: Props) {
  const [fullName, setFullName] = useState(user.fullName);
  const [schoolId, setSchoolId] = useState(user.schoolId);
  const [email, setEmail] = useState(user.email);

  const handleSave = () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const users = getUsers();
    const updated = users.map(u => u.id === user.id ? { ...u, fullName: fullName.trim(), schoolId: schoolId.trim(), email: email.trim() } : u);
    setUsers(updated);
    const updatedUser = updated.find(u => u.id === user.id)!;
    setCurrentUser(updatedUser);
    toast.success('Details updated');
    onClose(updatedUser);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {user.role === 'student' ? 'Student ID' : 'School ID'}
            </Label>
            <Input value={schoolId} onChange={e => setSchoolId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">School Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
            <Button onClick={handleSave} className="bg-maroon hover:bg-maroon/90 text-maroon-foreground">Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
