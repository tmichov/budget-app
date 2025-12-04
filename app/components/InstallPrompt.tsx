'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
        setInstallPrompt(null);
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-4 z-40 max-w-sm mx-auto">
      <div className="flex items-start gap-3">
        <Download size={20} className="text-primary flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">Install Budget App</h3>
          <p className="text-sm text-text-secondary mb-3">
            Add the Budget App to your home screen for quick access
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary text-white py-2 px-3 rounded font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-foreground py-2 px-3 rounded font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-text-secondary hover:text-foreground transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
