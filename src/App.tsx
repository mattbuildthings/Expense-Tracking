import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExpenseLedger } from './components/ExpenseLedger';
import { SaturdayReportView } from './components/SaturdayReportView';
import { BudgetView } from './components/BudgetView';
import { VendorView } from './components/VendorView';
import { CashFlowView } from './components/CashFlowView';
import { UploadModal } from './components/UploadModal';
import { ManualInvoiceModal } from './components/ManualInvoiceModal';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { PinLockScreen } from './components/PinLockScreen';
import { AuditLogModal } from './components/AuditLogModal';
import { ExportModal } from './components/ExportModal';
import type { ExpenseItem, AuditLogEntry } from './types/expense';
import {
  getExpenses,
  getDeletedExpenses,
  getAuditLogs,
  addExpense,
  updateExpense,
  deleteExpense,
  restoreExpense,
  permanentlyDeleteExpense,
  deleteBatchExpenses,
  getProjectName,
  resetToSampleData,
  fetchExpensesFromSupabase,
  subscribeToSupabaseChanges,
  getUniqueVendors,
  getUniqueSubCategories
} from './services/storageService';

export default function App() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [deletedExpenses, setDeletedExpenses] = useState<ExpenseItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [activeView, setActiveView] = useState<'ledger' | 'saturday_report' | 'bva_budget' | 'vendors' | 'cash_flow'>('ledger');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const existingVendors = getUniqueVendors(expenses);
  const existingSubCategories = getUniqueSubCategories(expenses);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

  // Load initial data
  const refreshAllData = () => {
    setExpenses(getExpenses());
    setDeletedExpenses(getDeletedExpenses());
    setAuditLogs(getAuditLogs());
    setProjectName(getProjectName());
  };

  useEffect(() => {
    refreshAllData();

    // Fetch from Supabase Cloud DB if connected
    fetchExpensesFromSupabase().then(cloudItems => {
      if (cloudItems) {
        setExpenses(cloudItems);
        setDeletedExpenses(getDeletedExpenses());
      }
    });

    // Real-time synchronization across devices (Phone & Desktop)
    const unsubscribe = subscribeToSupabaseChanges(() => {
      refreshAllData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = expenses.filter(i => i.status === 'cần_kiểm_tra').length;

  const handleAddExpenses = (newItems: ExpenseItem[]) => {
    newItems.forEach(item => {
      addExpense(item);
    });
    refreshAllData();
  };

  const handleCreateManualExpense = (newItem: ExpenseItem) => {
    addExpense(newItem);
    refreshAllData();
  };

  const handleUpdateExpense = (updatedItem: ExpenseItem) => {
    updateExpense(updatedItem.id, updatedItem);
    refreshAllData();
    setSelectedExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    refreshAllData();
  };

  const handleRestoreExpense = (id: string) => {
    restoreExpense(id);
    refreshAllData();
  };

  const handlePermanentDeleteExpense = (id: string) => {
    permanentlyDeleteExpense(id);
    refreshAllData();
  };

  const handleBatchDelete = (ids: string[]) => {
    deleteBatchExpenses(ids);
    refreshAllData();
  };

  const handleBatchVerify = (ids: string[]) => {
    ids.forEach(id => {
      updateExpense(id, { status: 'đã_xác_minh' });
    });
    refreshAllData();
  };

  const handleResetData = () => {
    resetToSampleData();
    refreshAllData();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* PIN Passcode Lock Screen Overlay */}
      {isLocked && (
        <PinLockScreen
          projectName={projectName}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Top Navbar */}
      <Navbar
        projectName={projectName}
        totalSpent={totalSpent}
        pendingCount={pendingCount}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenManualCreate={() => setIsManualCreateOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onLockApp={() => setIsLocked(true)}
      />

      {/* Main Content View Container */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {activeView === 'ledger' ? (
          <ExpenseLedger
            expenses={expenses}
            onSelectExpense={item => setSelectedExpense(item)}
            onDeleteExpense={handleDeleteExpense}
            onBatchDelete={handleBatchDelete}
            onBatchVerify={handleBatchVerify}
            onExportExcel={() => setIsExportOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        ) : activeView === 'saturday_report' ? (
          <SaturdayReportView
            projectName={projectName}
            allExpenses={expenses}
            onSelectExpense={item => {
              setSelectedExpense(item);
            }}
            onExportExcel={() => setIsExportOpen(true)}
          />
        ) : activeView === 'bva_budget' ? (
          <BudgetView
            projectName={projectName}
            allExpenses={expenses}
            onSelectExpense={item => {
              setSelectedExpense(item);
            }}
          />
        ) : activeView === 'vendors' ? (
          <VendorView
            projectName={projectName}
            allExpenses={expenses}
            onSelectExpense={item => {
              setSelectedExpense(item);
            }}
          />
        ) : (
          <CashFlowView
            projectName={projectName}
            allExpenses={expenses}
          />
        )}
      </main>

      {/* Upload Image Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddExpenses={handleAddExpenses}
      />

      {/* Manual Invoice Creation Modal */}
      <ManualInvoiceModal
        isOpen={isManualCreateOpen}
        onClose={() => setIsManualCreateOpen(false)}
        onSave={handleCreateManualExpense}
        existingVendors={existingVendors}
        existingSubCategories={existingSubCategories}
      />

      {/* Detail Inspector & Edit Modal */}
      <ExpenseDetailModal
        item={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onSave={handleUpdateExpense}
        onDelete={handleDeleteExpense}
        existingVendors={existingVendors}
        existingSubCategories={existingSubCategories}
      />

      {/* Export Options Modal (Google Sheets & Excel) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        expenses={expenses}
        projectName={projectName}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProjectNameChange={name => setProjectName(name)}
        onResetData={handleResetData}
      />

      {/* Audit Logs & Recycle Bin Modal */}
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        auditLogs={auditLogs}
        deletedExpenses={deletedExpenses}
        onRestoreExpense={handleRestoreExpense}
        onPermanentDeleteExpense={handlePermanentDeleteExpense}
      />

    </div>
  );
}
