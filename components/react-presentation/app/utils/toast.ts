export const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
  console.log(`Toast: ${type.toUpperCase()} - ${title}: ${message}`);
  // Here you would typically use a proper toast library or custom implementation
  // For now, we're just logging to the console
};
