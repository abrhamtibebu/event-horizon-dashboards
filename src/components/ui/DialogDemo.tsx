import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ConfirmationDialog, 
  DeleteConfirmationDialog, 
  HardDeleteConfirmationDialog, 
  StatusChangeConfirmationDialog 
} from './ConfirmationDialog';
import { 
  AlertDialog, 
  SuccessAlert, 
  WarningAlert, 
  ErrorAlert, 
  InfoAlert 
} from './AlertDialog';
import { LoadingDialog } from './LoadingDialog';
import { 
  InputDialog,
  TransactionInputDialog,
  PaymentNotesDialog,
  TransactionIdDialog
} from './InputDialog';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast, 
  showLoadingToast 
} from './ModernToast';

export function DialogDemo() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [showStatusChangeConfirm, setShowStatusChangeConfirm] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showInfoAlert, setShowInfoAlert] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentNotesDialog, setShowPaymentNotesDialog] = useState(false);
  const [showTransactionIdDialog, setShowTransactionIdDialog] = useState(false);
  const [showCustomInputDialog, setShowCustomInputDialog] = useState(false);

  const handleDeleteConfirm = () => {
    console.log('Delete confirmed');
    setShowDeleteConfirm(false);
  };

  const handleHardDeleteConfirm = () => {
    console.log('Hard delete confirmed');
    setShowHardDeleteConfirm(false);
  };

  const handleStatusChangeConfirm = () => {
    console.log('Status change confirmed');
    setShowStatusChangeConfirm(false);
  };

  const handleLoadingDemo = () => {
    setShowLoadingDialog(true);
    setTimeout(() => {
      setShowLoadingDialog(false);
    }, 3000);
  };

  const handleTransactionConfirm = (data: { transactionId: string; notes: string }) => {
    console.log('Transaction data:', data);
    setShowTransactionDialog(false);
    showSuccessToast('Payment Processed', `Transaction ID: ${data.transactionId || 'N/A'}`);
  };

  const handlePaymentNotesConfirm = (notes: string) => {
    console.log('Payment notes:', notes);
    setShowPaymentNotesDialog(false);
    showInfoToast('Notes Added', 'Payment notes have been saved successfully.');
  };

  const handleTransactionIdConfirm = (transactionId: string) => {
    console.log('Transaction ID:', transactionId);
    setShowTransactionIdDialog(false);
    showSuccessToast('Transaction ID Saved', `ID: ${transactionId || 'N/A'}`);
  };

  const handleCustomInputConfirm = (data: any) => {
    console.log('Custom input data:', data);
    setShowCustomInputDialog(false);
    showSuccessToast('Form Submitted', 'Custom form data has been processed.');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Modern Dialog Components</h1>
        <p className="text-gray-600">A showcase of modern, accessible dialog components</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Confirmation Dialogs */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmation Dialogs</CardTitle>
            <CardDescription>Modern confirmation dialogs with different variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              Delete Confirmation
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowHardDeleteConfirm(true)}
              className="w-full"
            >
              Hard Delete Confirmation
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowStatusChangeConfirm(true)}
              className="w-full"
            >
              Status Change Confirmation
            </Button>
          </CardContent>
        </Card>

        {/* Alert Dialogs */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Dialogs</CardTitle>
            <CardDescription>Informational alert dialogs with different types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setShowSuccessAlert(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Success Alert
            </Button>
            <Button 
              onClick={() => setShowWarningAlert(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Warning Alert
            </Button>
            <Button 
              onClick={() => setShowErrorAlert(true)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Error Alert
            </Button>
            <Button 
              onClick={() => setShowInfoAlert(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Info Alert
            </Button>
          </CardContent>
        </Card>

        {/* Input Dialogs */}
        <Card>
          <CardHeader>
            <CardTitle>Input Dialogs</CardTitle>
            <CardDescription>Modern input dialogs for data collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setShowTransactionDialog(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Transaction Input
            </Button>
            <Button 
              onClick={() => setShowPaymentNotesDialog(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Payment Notes
            </Button>
            <Button 
              onClick={() => setShowTransactionIdDialog(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Transaction ID Only
            </Button>
            <Button 
              onClick={() => setShowCustomInputDialog(true)}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              Custom Input Form
            </Button>
          </CardContent>
        </Card>

        {/* Loading & Toast */}
        <Card>
          <CardHeader>
            <CardTitle>Loading & Toast</CardTitle>
            <CardDescription>Loading dialogs and modern toast notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleLoadingDemo}
              className="w-full"
            >
              Loading Dialog
            </Button>
            <Button 
              onClick={() => showSuccessToast('Success!', 'Operation completed successfully')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Success Toast
            </Button>
            <Button 
              onClick={() => showErrorToast('Error!', 'Something went wrong')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Error Toast
            </Button>
            <Button 
              onClick={() => showWarningToast('Warning!', 'Please check your input')}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Warning Toast
            </Button>
            <Button 
              onClick={() => showInfoToast('Info', 'Here is some information')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Info Toast
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Components */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemName="Test Vendor"
        itemType="vendor"
      />

      <HardDeleteConfirmationDialog
        isOpen={showHardDeleteConfirm}
        onClose={() => setShowHardDeleteConfirm(false)}
        onConfirm={handleHardDeleteConfirm}
        itemName="Test Vendor"
        itemType="vendor"
        constraints={{
          active_quotations: 2,
          pending_payments: 1,
          active_deliveries: 0
        }}
      />

      <StatusChangeConfirmationDialog
        isOpen={showStatusChangeConfirm}
        onClose={() => setShowStatusChangeConfirm(false)}
        onConfirm={handleStatusChangeConfirm}
        itemName="Test Vendor"
        currentStatus="pending"
        newStatus="active"
      />

      <SuccessAlert
        isOpen={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        title="Success!"
        description="Your operation was completed successfully."
      />

      <WarningAlert
        isOpen={showWarningAlert}
        onClose={() => setShowWarningAlert(false)}
        title="Warning!"
        description="Please review your input before proceeding."
      />

      <ErrorAlert
        isOpen={showErrorAlert}
        onClose={() => setShowErrorAlert(false)}
        title="Error!"
        description="Something went wrong. Please try again."
      />

      <InfoAlert
        isOpen={showInfoAlert}
        onClose={() => setShowInfoAlert(false)}
        title="Information"
        description="Here is some important information you should know."
      />

      <LoadingDialog
        isOpen={showLoadingDialog}
        title="Processing..."
        description="Please wait while we process your request."
        status="loading"
        showProgress={true}
        progress={75}
      />

      {/* Input Dialog Components */}
      <TransactionInputDialog
        isOpen={showTransactionDialog}
        onClose={() => setShowTransactionDialog(false)}
        onConfirm={handleTransactionConfirm}
        isLoading={false}
      />

      <PaymentNotesDialog
        isOpen={showPaymentNotesDialog}
        onClose={() => setShowPaymentNotesDialog(false)}
        onConfirm={handlePaymentNotesConfirm}
        isLoading={false}
      />

      <TransactionIdDialog
        isOpen={showTransactionIdDialog}
        onClose={() => setShowTransactionIdDialog(false)}
        onConfirm={handleTransactionIdConfirm}
        isLoading={false}
      />

      <InputDialog
        isOpen={showCustomInputDialog}
        onClose={() => setShowCustomInputDialog(false)}
        onConfirm={handleCustomInputConfirm}
        title="Custom Input Form"
        description="Enter your information in the form below."
        confirmText="Submit"
        cancelText="Cancel"
        variant="info"
        isLoading={false}
        fields={[
          {
            name: 'name',
            label: 'Full Name',
            type: 'text',
            placeholder: 'Enter your full name',
            required: true,
            description: 'Your complete name as it appears on official documents'
          },
          {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            placeholder: 'Enter your email',
            required: true,
            description: 'We will use this to contact you'
          },
          {
            name: 'phone',
            label: 'Phone Number',
            type: 'text',
            placeholder: 'Enter your phone number',
            required: false,
            description: 'Optional contact number'
          },
          {
            name: 'message',
            label: 'Message',
            type: 'textarea',
            placeholder: 'Enter your message here...',
            required: false,
            description: 'Any additional information you would like to share'
          }
        ]}
      />
    </div>
  );
}
