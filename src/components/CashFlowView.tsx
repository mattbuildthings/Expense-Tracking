import React, { useState, useEffect } from 'react';
import { DollarSign, Landmark, Wallet, TrendingDown, ArrowUpRight, ArrowDownLeft, Calendar, Clock, AlertTriangle, Trash2, FileSpreadsheet } from 'lucide-react';
import type { ExpenseItem, CapitalTransaction, CapitalTransactionType } from '../types/expense';
import { formatVND, getInitialFunds, getCapitalTransactions, addCapitalTransaction, deleteCapitalTransaction, exportCashFlowToExcel } from '../services/storageService';
import { useLanguage } from '../i18n/LanguageContext';

interface CashFlowViewProps {
  projectName: string;
  allExpenses: ExpenseItem[];
  onExportExcel?: () => void;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  projectName,
  allExpenses,
  onExportExcel
}) => {
  const { t } = useLanguage();
  const [initialFunds, setInitialFunds] = useState(getInitialFunds());
  const [capitalTxs, setCapitalTxs] = useState<CapitalTransaction[]>(getCapitalTransactions());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<CapitalTransactionType>('deposit');
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [noteStr, setNoteStr] = useState('');

  useEffect(() => {
    setInitialFunds(getInitialFunds());
    setCapitalTxs(getCapitalTransactions());
  }, []);

  // Calculate Capital Infusions & Withdrawals from CapitalTransactions log
  const capitalDeposits = capitalTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const cashWithdrawals = capitalTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

  // Outflow from logged Expenses
  const bankSpent = allExpenses.filter(i => i.paymentMethod === 'chuyển_khoản').reduce((sum, i) => sum + i.amount, 0);
  const cashSpent = allExpenses.filter(i => i.paymentMethod === 'tiền_mặt').reduce((sum, i) => sum + i.amount, 0);

  // Net Balances
  // Bank = (Initial Bank + Capital Deposits) - Cash Withdrawals - Bank Transfers Spent
  const currentBankBalance = (initialFunds.bank + capitalDeposits) - cashWithdrawals - bankSpent;

  // Cash = (Initial Cash + Cash Withdrawals) - Cash Spent
  const currentCashBalance = (initialFunds.cash + cashWithdrawals) - cashSpent;

  const totalLiquidFunds = currentBankBalance + currentCashBalance;

  // Weekly Burn Rate calculation
  const totalSpent = bankSpent + cashSpent;
  // Determine date range in weeks
  const timestamps = allExpenses.map(e => new Date(e.date).getTime()).filter(t => !isNaN(t));
  let weeksCount = 1;
  if (timestamps.length >= 2) {
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const diffDays = Math.max(1, (maxTime - minTime) / (1000 * 60 * 60 * 24));
    weeksCount = Math.max(1, Math.ceil(diffDays / 7));
  }
  const avgWeeklyOutflow = totalSpent / weeksCount;
  const weeksRemaining = avgWeeklyOutflow > 0 ? Math.max(0, Math.floor(totalLiquidFunds / avgWeeklyOutflow)) : 999;

  // Saturday Labor Salary Forecast (Estimate labor pending payments)
  const laborExpenses = allExpenses.filter(i => i.category === 'phần_thô_nhân_công' || i.category === 'hoàn_thiện_nhân_công');
  const pendingLaborCount = laborExpenses.filter(i => i.status === 'cần_kiểm_tra').length;
  const pendingLaborAmount = laborExpenses.filter(i => i.status === 'cần_kiểm_tra').reduce((sum, i) => sum + i.amount, 0);

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(cleanAmt) || cleanAmt <= 0) return;

    addCapitalTransaction({
      amount: cleanAmt,
      date: dateStr,
      type: txType,
      note: noteStr.trim() || (txType === 'deposit' ? t('cashflow.defaultNoteDeposit') : t('cashflow.defaultNoteWithdrawal'))
    });

    setCapitalTxs(getCapitalTransactions());
    setIsModalOpen(false);
    setAmountStr('');
    setNoteStr('');
  };

  const handleDeleteTx = (id: string) => {
    if (window.confirm(t('cashflow.deleteTxConfirm'))) {
      deleteCapitalTransaction(id);
      setCapitalTxs(getCapitalTransactions());
    }
  };

  function formatFormattedNumber(val: string): string {
    const clean = val.replace(/,/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
                <Wallet size={24} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('cashflow.title')}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {projectName} {t('cashflow.subtitlePrefix')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onExportExcel ? onExportExcel() : exportCashFlowToExcel(allExpenses, projectName)}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              title={t('cashflow.exportTitle')}
            >
              <FileSpreadsheet size={18} />
              <span>{t('cashflow.exportBtn')}</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => { setTxType('deposit'); setIsModalOpen(true); }}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowUpRight size={18} />
              <span>{t('cashflow.newDeposit')}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => { setTxType('withdrawal'); setIsModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowDownLeft size={18} color="var(--chart-blue)" />
              <span>{t('cashflow.cashWithdrawal')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Hero Liquidity KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Bank Balance */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--chart-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--chart-blue)', textTransform: 'uppercase' }}>{t('cashflow.bankBalance')}</p>
            <Landmark size={20} color="var(--chart-blue)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: currentBankBalance < 0 ? 'var(--danger)' : 'var(--text-main)', marginTop: '6px' }}>
            {formatVND(currentBankBalance)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('cashflow.transferred')} {formatVND(bankSpent)}
          </p>
        </div>

        {/* Card 2: Cash on Hand Balance */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>{t('cashflow.cashOnHand')}</p>
            <Wallet size={20} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: currentCashBalance < 0 ? 'var(--danger)' : 'var(--text-main)', marginTop: '6px' }}>
            {formatVND(currentCashBalance)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('cashflow.cashSpent')} {formatVND(cashSpent)}
          </p>
        </div>

        {/* Card 3: Total Liquid Funds */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1', background: 'rgba(99, 102, 241, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>{t('cashflow.totalLiquidFunds')}</p>
            <DollarSign size={20} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: totalLiquidFunds < 0 ? 'var(--danger)' : 'var(--success)', marginTop: '6px' }}>
            {formatVND(totalLiquidFunds)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: totalLiquidFunds < 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {totalLiquidFunds < 0 ? <><AlertTriangle size={12} /> {t('cashflow.cashShortfall')}</> : <>{t('cashflow.goodLiquidity')}</>}
          </p>
        </div>

        {/* Card 4: Burn Rate & Weeks Remaining */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>{t('cashflow.burnRateForecast')}</p>
            <Clock size={20} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '6px' }}>
            ~{weeksRemaining === 999 ? '∞' : weeksRemaining} {t('cashflow.weeks')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('cashflow.burnRate')} {formatVND(avgWeeklyOutflow)} {t('cashflow.perWeek')}
          </p>
        </div>

      </div>

      {/* Grid: Cash Outflow Breakdown & Saturday Payout Warning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Outflow Breakdown by Payment Method */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={18} color="var(--chart-blue)" />
            {t('cashflow.spendRatioTitle')}
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 700 }}>
              <span style={{ color: 'var(--chart-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}><Landmark size={13} /> {t('cashflow.bankTransfer')} ({totalSpent > 0 ? Math.round((bankSpent / totalSpent) * 100) : 0}%)</span>
              <span>{formatVND(bankSpent)}</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(127, 127, 127, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalSpent > 0 ? (bankSpent / totalSpent) * 100 : 0}%`, background: 'var(--chart-blue)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 700 }}>
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}><Wallet size={13} /> {t('cashflow.cash')} ({totalSpent > 0 ? Math.round((cashSpent / totalSpent) * 100) : 0}%)</span>
              <span>{formatVND(cashSpent)}</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(127, 127, 127, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalSpent > 0 ? (cashSpent / totalSpent) * 100 : 0}%`, background: 'var(--success)' }} />
            </div>
          </div>
        </div>

        {/* Saturday Payout & Low Cash Warning */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--danger)" />
            {t('cashflow.laborForecastTitle')}
          </h3>

          <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>{t('cashflow.laborUnpaid')}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)' }}>{formatVND(pendingLaborAmount)}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('cashflow.laborIncludes').replace('{n}', String(pendingLaborCount))}
            </p>
          </div>

          {currentCashBalance < 15000000 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'rgba(248, 113, 113, 0.15)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="var(--danger)" />
              <span>{t('cashflow.lowCashWarning')}</span>
            </div>
          )}
        </div>

      </div>

      {/* Capital Infusion & Withdrawal History Log */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t('cashflow.logTitle')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {capitalTxs.length} {t('cashflow.transactionsCount')}
          </span>
        </div>

        {capitalTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.75rem' }}>{t('cashflow.noTransactionsYet')}</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>{t('cashflow.defaultBalanceNote')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {capitalTxs.map(tx => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-card-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: tx.type === 'deposit' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)' }}>
                    {tx.type === 'deposit' ? <ArrowUpRight size={18} color="var(--success)" /> : <ArrowDownLeft size={18} color="var(--chart-blue)" />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.75rem', color: tx.type === 'deposit' ? 'var(--success)' : 'var(--chart-blue)' }}>
                        {tx.type === 'deposit' ? t('cashflow.depositLabel') : t('cashflow.withdrawalLabel')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.date}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {tx.note}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: tx.type === 'deposit' ? 'var(--success)' : 'var(--chart-blue)' }}>
                    {tx.type === 'deposit' ? '+' : ''}{formatVND(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteTx(tx.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                    title={t('cashflow.deleteTxTitle')}
                  >
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: New Deposit or Cash Withdrawal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {txType === 'deposit' ? t('cashflow.modalTitleDeposit') : t('cashflow.modalTitleWithdrawal')}
            </h3>

            <form onSubmit={handleCreateTx} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('cashflow.amountLabel')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50,000,000"
                  value={amountStr}
                  onChange={e => setAmountStr(formatFormattedNumber(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--success)', fontSize: '0.95rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('cashflow.dateLabel')}
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.75rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('cashflow.noteLabel')}
                </label>
                <input
                  type="text"
                  placeholder={txType === 'deposit' ? t('cashflow.notePlaceholderDeposit') : t('cashflow.notePlaceholderWithdrawal')}
                  value={noteStr}
                  onChange={e => setNoteStr(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>
                  {t('cashflow.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: txType === 'deposit' ? '#10b981' : '#3b82f6' }}>
                  {t('cashflow.saveTransaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
