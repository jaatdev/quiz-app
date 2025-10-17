'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  feature?: string;
}

/**
 * AuthModal component for prompting users to login
 * Beautiful modal with Framer Motion animations
 */
export function AuthModal({
  isOpen,
  onClose,
  title = 'Authentication Required',
  message = 'You need to login to access this feature',
  feature = 'this feature',
}: AuthModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleSignup = () => {
    onClose();
    router.push(`/sign-up?redirect_url=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full shadow-lg">
                  <Lock className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">
                {title}
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Login to Continue
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignup}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Create New Account
                </motion.button>
              </div>

              {/* Decorative element */}
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                🎯 Join now to track your progress and compete!
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
