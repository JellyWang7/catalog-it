import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import listsService from '../services/lists';
import toast from 'react-hot-toast';

export default function SharedList() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await listsService.getByShareCode(code);
        // Redirect to the actual list detail page
        navigate(`/lists/${res.data.id}`, { replace: true });
      } catch {
        toast.error('Shared list not found or no longer available');
        navigate('/explore', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    resolve();
  }, [code, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue mx-auto mb-4" />
          <p className="text-gray-500">Loading shared list...</p>
        </div>
      </div>
    );
  }

  return null;
}
