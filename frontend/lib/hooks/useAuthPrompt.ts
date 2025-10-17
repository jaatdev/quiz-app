'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { AuthModal } from '@/components/AuthModal';

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
    (options: UseAuthPromptOptions = {}) => {
      if (!isLoaded) return false;

      if (!isSignedIn) {
        setModalConfig(options);
        setShowModal(true);
        return false;
      }
      return true;
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
