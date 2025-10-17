'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseAuthPromptOptions {
  title?: string;
  message?: string;
  feature?: string;
}

/**
 * Hook to use auth modal in components
 * Automatically shows modal if user is not authenticated
 */
export function useAuthPrompt() {
  const { isSignedIn, isLoaded } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<UseAuthPromptOptions>({});

  const requireAuth = useCallback(
    (callback: () => void, options: UseAuthPromptOptions = {}) => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setModalConfig(options);
        setShowModal(true);
        return;
      }
      // User is authenticated, run the callback
      callback();
    },
    [isSignedIn, isLoaded]
  );

  return {
    requireAuth,
    showModal,
    setShowModal,
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    modalState: {
      isOpen: showModal,
      onClose: () => setShowModal(false),
      ...modalConfig,
    },
  };
}
