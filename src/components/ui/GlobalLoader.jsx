// src/components/ui/GlobalLoader.jsx
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import loaderEvent from '../../utils/loaderEvent';

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const show = () => setIsLoading(true);
    const hide = () => setIsLoading(false);

    loaderEvent.addEventListener('show', show);
    loaderEvent.addEventListener('hide', hide);

    return () => {
      loaderEvent.removeEventListener('show', show);
      loaderEvent.removeEventListener('hide', hide);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </div>
        <p className="text-dark font-bold text-sm tracking-wide animate-pulse">Processing...</p>
      </div>
    </div>
  );
}