/**
 * Vendor Status Lifecycle Constants
 * Organized by lifecycle phase as per the master list
 */

export interface VendorStatusOption {
  value: string;
  label: string;
  phase: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
}

// Status color mapping
const getStatusColors = (status: string): { color: string; bgColor: string; textColor: string } => {
  const colorMap: Record<string, { color: string; bgColor: string; textColor: string }> = {
    // Pre-Engagement / Discovery
    'NEW': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'PENDING_VERIFICATION': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'APPROVED': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'REJECTED': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    'BLACKLISTED': { color: 'red', bgColor: 'bg-red-200', textColor: 'text-red-900' },
    
    // RFQ / Engagement Phase
    'RFQ_SENT': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'AWAITING_RESPONSE': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'QUOTE_SUBMITTED': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'UNDER_REVIEW': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    'NEGOTIATION': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    'SHORTLISTED': { color: 'green', bgColor: 'bg-green-200', textColor: 'text-green-900' },
    'DECLINED': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    
    // Contracting Phase
    'SELECTED': { color: 'green', bgColor: 'bg-green-200', textColor: 'text-green-900' },
    'CONTRACT_DRAFTING': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'CONTRACT_SENT': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'CONTRACT_SIGNED': { color: 'green', bgColor: 'bg-green-200', textColor: 'text-green-900' },
    'PO_ISSUED': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    
    // Execution / Event Work Phase
    'PREPARING': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'IN_PROGRESS': { color: 'blue', bgColor: 'bg-blue-200', textColor: 'text-blue-900' },
    'AT_RISK': { color: 'red', bgColor: 'bg-red-200', textColor: 'text-red-900' },
    'ON_HOLD': { color: 'yellow', bgColor: 'bg-yellow-200', textColor: 'text-yellow-900' },
    'PARTIALLY_COMPLETED': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    'COMPLETED': { color: 'green', bgColor: 'bg-green-200', textColor: 'text-green-900' },
    
    // Payment & Closure Phase
    'PENDING_ACCEPTANCE': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'ACCEPTED': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'INVOICE_SUBMITTED': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'PAYMENT_IN_PROGRESS': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    'PAID': { color: 'green', bgColor: 'bg-green-200', textColor: 'text-green-900' },
    'CLOSED': { color: 'gray', bgColor: 'bg-gray-200', textColor: 'text-gray-900' },
    
    // Performance Review / History
    'REVIEWED': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'FLAGGED_FOR_MONITORING': { color: 'yellow', bgColor: 'bg-yellow-200', textColor: 'text-yellow-900' },
    'PREFERRED_VENDOR': { color: 'green', bgColor: 'bg-green-300', textColor: 'text-green-950' },
    
    // Legacy statuses
    'active': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'inactive': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    'pending_approval': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'suspended': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  };
  
  return colorMap[status] || { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
};

// Format status label for display
const formatStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// All vendor statuses organized by lifecycle phase
export const VENDOR_STATUSES: VendorStatusOption[] = [
  // 1) Pre-Engagement / Discovery
  {
    value: 'NEW',
    label: 'New',
    phase: 'Pre-Engagement / Discovery',
    description: 'Added to system but not evaluated yet',
    ...getStatusColors('NEW'),
  },
  {
    value: 'PENDING_VERIFICATION',
    label: 'Pending Verification',
    phase: 'Pre-Engagement / Discovery',
    description: 'Documents / credentials being reviewed',
    ...getStatusColors('PENDING_VERIFICATION'),
  },
  {
    value: 'APPROVED',
    label: 'Approved',
    phase: 'Pre-Engagement / Discovery',
    description: 'Verified & eligible to be invited',
    ...getStatusColors('APPROVED'),
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    phase: 'Pre-Engagement / Discovery',
    description: 'Disqualified or not valid for use',
    ...getStatusColors('REJECTED'),
  },
  {
    value: 'BLACKLISTED',
    label: 'Blacklisted',
    phase: 'Pre-Engagement / Discovery',
    description: 'Permanently barred due to compliance/performance issues',
    ...getStatusColors('BLACKLISTED'),
  },
  
  // 2) RFQ / Engagement Phase
  {
    value: 'RFQ_SENT',
    label: 'RFQ Sent',
    phase: 'RFQ / Engagement',
    description: 'Vendor has been invited to quote',
    ...getStatusColors('RFQ_SENT'),
  },
  {
    value: 'AWAITING_RESPONSE',
    label: 'Awaiting Response',
    phase: 'RFQ / Engagement',
    description: 'Waiting for vendor to submit quote',
    ...getStatusColors('AWAITING_RESPONSE'),
  },
  {
    value: 'QUOTE_SUBMITTED',
    label: 'Quote Submitted',
    phase: 'RFQ / Engagement',
    description: 'Vendor has submitted pricing/offer',
    ...getStatusColors('QUOTE_SUBMITTED'),
  },
  {
    value: 'UNDER_REVIEW',
    label: 'Under Review',
    phase: 'RFQ / Engagement',
    description: 'Organizer evaluating quote',
    ...getStatusColors('UNDER_REVIEW'),
  },
  {
    value: 'NEGOTIATION',
    label: 'Negotiation',
    phase: 'RFQ / Engagement',
    description: 'Pricing/scope adjustments ongoing',
    ...getStatusColors('NEGOTIATION'),
  },
  {
    value: 'SHORTLISTED',
    label: 'Shortlisted',
    phase: 'RFQ / Engagement',
    description: 'Vendor is a finalist candidate',
    ...getStatusColors('SHORTLISTED'),
  },
  {
    value: 'DECLINED',
    label: 'Declined',
    phase: 'RFQ / Engagement',
    description: 'Vendor refused or missed deadline',
    ...getStatusColors('DECLINED'),
  },
  
  // 3) Contracting Phase
  {
    value: 'SELECTED',
    label: 'Selected',
    phase: 'Contracting',
    description: 'Vendor chosen but contract not signed yet',
    ...getStatusColors('SELECTED'),
  },
  {
    value: 'CONTRACT_DRAFTING',
    label: 'Contract Drafting',
    phase: 'Contracting',
    description: 'Contract terms being prepared',
    ...getStatusColors('CONTRACT_DRAFTING'),
  },
  {
    value: 'CONTRACT_SENT',
    label: 'Contract Sent',
    phase: 'Contracting',
    description: 'Waiting for vendor to sign',
    ...getStatusColors('CONTRACT_SENT'),
  },
  {
    value: 'CONTRACT_SIGNED',
    label: 'Contract Signed',
    phase: 'Contracting',
    description: 'Both parties have signed',
    ...getStatusColors('CONTRACT_SIGNED'),
  },
  {
    value: 'PO_ISSUED',
    label: 'PO Issued',
    phase: 'Contracting',
    description: 'Purchase Order delivered to vendor',
    ...getStatusColors('PO_ISSUED'),
  },
  
  // 4) Execution / Event Work Phase
  {
    value: 'PREPARING',
    label: 'Preparing',
    phase: 'Execution',
    description: 'Initial planning or resource scheduling',
    ...getStatusColors('PREPARING'),
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    phase: 'Execution',
    description: 'Work is actively being executed',
    ...getStatusColors('IN_PROGRESS'),
  },
  {
    value: 'AT_RISK',
    label: 'At Risk',
    phase: 'Execution',
    description: 'Alarm — delays or issues detected',
    ...getStatusColors('AT_RISK'),
  },
  {
    value: 'ON_HOLD',
    label: 'On Hold',
    phase: 'Execution',
    description: 'Temporarily paused by organizer or vendor',
    ...getStatusColors('ON_HOLD'),
  },
  {
    value: 'PARTIALLY_COMPLETED',
    label: 'Partially Completed',
    phase: 'Execution',
    description: 'Some deliverables done, others pending',
    ...getStatusColors('PARTIALLY_COMPLETED'),
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    phase: 'Execution',
    description: 'Execution done pending verification',
    ...getStatusColors('COMPLETED'),
  },
  
  // 5) Payment & Closure Phase
  {
    value: 'PENDING_ACCEPTANCE',
    label: 'Pending Acceptance',
    phase: 'Payment & Closure',
    description: 'Organizer reviewing final output',
    ...getStatusColors('PENDING_ACCEPTANCE'),
  },
  {
    value: 'ACCEPTED',
    label: 'Accepted',
    phase: 'Payment & Closure',
    description: 'All work verified + accepted',
    ...getStatusColors('ACCEPTED'),
  },
  {
    value: 'INVOICE_SUBMITTED',
    label: 'Invoice Submitted',
    phase: 'Payment & Closure',
    description: 'Vendor has requested payment',
    ...getStatusColors('INVOICE_SUBMITTED'),
  },
  {
    value: 'PAYMENT_IN_PROGRESS',
    label: 'Payment In Progress',
    phase: 'Payment & Closure',
    description: 'Finance reviewing / releasing payment',
    ...getStatusColors('PAYMENT_IN_PROGRESS'),
  },
  {
    value: 'PAID',
    label: 'Paid',
    phase: 'Payment & Closure',
    description: 'Vendor fully settled',
    ...getStatusColors('PAID'),
  },
  {
    value: 'CLOSED',
    label: 'Closed',
    phase: 'Payment & Closure',
    description: 'Vendor engagement complete',
    ...getStatusColors('CLOSED'),
  },
  
  // 6) Performance Review / History
  {
    value: 'REVIEWED',
    label: 'Reviewed',
    phase: 'Performance Review',
    description: 'Feedback and rating recorded',
    ...getStatusColors('REVIEWED'),
  },
  {
    value: 'FLAGGED_FOR_MONITORING',
    label: 'Flagged for Monitoring',
    phase: 'Performance Review',
    description: 'Vendor acceptable but with caution notes',
    ...getStatusColors('FLAGGED_FOR_MONITORING'),
  },
  {
    value: 'PREFERRED_VENDOR',
    label: 'Preferred Vendor',
    phase: 'Performance Review',
    description: 'Rated high & favored for future projects',
    ...getStatusColors('PREFERRED_VENDOR'),
  },
  
  // Legacy statuses (for backward compatibility)
  {
    value: 'active',
    label: 'Active',
    phase: 'Legacy',
    description: 'Legacy active status',
    ...getStatusColors('active'),
  },
  {
    value: 'inactive',
    label: 'Inactive',
    phase: 'Legacy',
    description: 'Legacy inactive status',
    ...getStatusColors('inactive'),
  },
  {
    value: 'pending_approval',
    label: 'Pending Approval',
    phase: 'Legacy',
    description: 'Legacy pending approval status',
    ...getStatusColors('pending_approval'),
  },
  {
    value: 'suspended',
    label: 'Suspended',
    phase: 'Legacy',
    description: 'Legacy suspended status',
    ...getStatusColors('suspended'),
  },
];

// Get status by value
export const getStatusByValue = (value: string): VendorStatusOption | undefined => {
  return VENDOR_STATUSES.find(status => status.value === value);
};

// Get statuses by phase
export const getStatusesByPhase = (phase: string): VendorStatusOption[] => {
  return VENDOR_STATUSES.filter(status => status.phase === phase);
};

// Get all unique phases
export const getPhases = (): string[] => {
  return Array.from(new Set(VENDOR_STATUSES.map(status => status.phase)));
};

// Format status for display
export const formatStatus = (status: string): string => {
  const statusOption = getStatusByValue(status);
  return statusOption ? statusOption.label : formatStatusLabel(status);
};

