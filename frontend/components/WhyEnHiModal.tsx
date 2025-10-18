import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WhyEnHiModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div key="overlay" className="fixed inset-0 bg-black/60 z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
      <div key="container" className="fixed inset-0 z-50 grid place-items-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Why only English and Hindi?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            To ensure consistent rendering and a great experience, we currently support exactly two languages: English (en) and Hindi (hi).
            Any other language keys in your JSON are removed during import and recorded in an audit log for transparency.
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
            <li key="ui">Stable UI and fonts across devices</li>
            <li key="analytics">Simple language toggle and analytics</li>
            <li key="validation">EN/HI are fully validated and normalized</li>
          </ul>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                onChange={(e) => {
                  if ((e.target as HTMLInputElement).checked) localStorage.setItem('hideWhyEnHi', '1');
                  else localStorage.removeItem('hideWhyEnHi');
                }}
              />
              Don’t show again
            </label>
            <button onClick={onClose} className="px-4 py-2 rounded bg-blue-600 text-white">Got it</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WhyEnHiModal;
