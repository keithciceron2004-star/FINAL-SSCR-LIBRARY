import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/store';
import Login from './Login';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'librarian') navigate('/librarian');
      else if (user.role === 'supervisor') navigate('/supervisor');
      else navigate('/borrower');
    }
  }, [navigate]);

  return <Login />;
}
