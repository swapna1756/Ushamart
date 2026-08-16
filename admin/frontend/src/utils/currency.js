/**
 * Centralized Indian Rupee (INR) formatter for UshaMart.
 * Uses standard Intl.NumberFormat to render the correct ₹ symbol.
 */
export function formatINR(value) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value || 0);
  if (isNaN(numericValue)) return '₹0';
  
  // Format to standard Indian numbering system
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numericValue);
}
