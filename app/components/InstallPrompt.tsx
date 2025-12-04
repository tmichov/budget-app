'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_PROMPT_DISMISSED_KEY = 'pwa_install_prompt_dismissed';

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const isDismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);

    const handler = (e: Event) => {
      e.preventDefault();

      // Only show if not previously dismissed
      if (!isDismissed) {
        setInstallPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      }
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
        localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mark as dismissed so we never show it again
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
  };

  if (!showPrompt || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-card rounded-lg shadow-lg border border-card-border p-4 z-40 max-w-sm mx-auto">
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
              className="flex-1 bg-secondary text-foreground py-2 px-3 rounded font-medium text-sm hover:opacity-80 transition-colors"
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
