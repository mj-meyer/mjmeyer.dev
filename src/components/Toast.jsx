import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

function Toast() {
  return <Toaster position="bottom-center" />;
}

// Initialize toast globally
if (typeof window !== 'undefined') {
  window.toast = toast;
}

export { Toast, toast }; 