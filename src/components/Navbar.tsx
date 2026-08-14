import React from 'react';
import { HardHat, PlusCircle, Calendar, Settings, CheckCircle2, AlertCircle, Lock, History, FilePlus, Target, Users, Wallet, FileText, ClipboardList, Sun, Moon } from 'lucide-react';
import { formatVND } from '../services/storageService';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

type ViewKey = 'ledger' | 'saturday_report' | 'bva_budget' | 'vendors' | 'cash_flow';

interface NavbarProps {
  projectName: string;
  totalSpent: number;
  pendingCount: number;
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenUpload: () => void;
  onOpenManualCreate: () => void;
  onOpenQuotationModal: () => void;
  onOpenSettings: () => void;
  onOpenAuditLog: () => void;
  onLockApp: () => void;
}

// Per-tab accent color (matches the design spec's per-view accent scheme)
const TAB_ACCENTS: Record<ViewKey, string> = {
  ledger: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  saturday_report: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  bva_budget: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  vendors: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  cash_flow: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)'
};

const TAB_ACCENT_SOLID: Record<ViewKey, string> = {
  ledger: '#3b82f6',
  saturday_report: '#10b981',
  bva_budget: '#6366f1',
  vendors: '#14b8a6',
  cash_flow: '#818cf8'
};

interface TabDef {
  key: ViewKey;
  label: string;
  shortLabel: string;
  title: string;
  icon: React.ElementType;
}

// Desktop tab labels are intentionally short (per design spec) — the long
// descriptive names live only in each button's `title` attribute for a11y.
function buildTabs(t: (key: import('../i18n/translations').TranslationKey) => string): TabDef[] {
  return [
    { key: 'ledger', label: t('nav.tab.ledger'), shortLabel: t('nav.tab.ledgerShort'), title: t('nav.tab.ledgerTitle'), icon: ClipboardList },
    { key: 'saturday_report', label: t('nav.tab.report'), shortLabel: t('nav.tab.report'), title: t('nav.tab.report'), icon: Calendar },
    { key: 'bva_budget', label: t('nav.tab.budget'), shortLabel: t('nav.tab.budgetShort'), title: t('nav.tab.budgetTitle'), icon: Target },
    { key: 'vendors', label: t('nav.tab.vendors'), shortLabel: t('nav.tab.vendorsShort'), title: t('nav.tab.vendorsTitle'), icon: Users },
    { key: 'cash_flow', label: t('nav.tab.cashflow'), shortLabel: t('nav.tab.cashflowShort'), title: t('nav.tab.cashflow'), icon: Wallet }
  ];
}

export const Navbar: React.FC<NavbarProps> = ({
  totalSpent,
  pendingCount,
  activeView,
  setActiveView,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  onOpenUpload,
  onOpenManualCreate,
  onOpenQuotationModal,
  onOpenSettings,
  onOpenAuditLog,
  onLockApp
}) => {
  const { t } = useLanguage();
  const TABS = buildTabs(t);
  return (
    <>
      <header className="glass-panel no-print" style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--header-bg)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(8px, 2vw, 16px) clamp(12px, 3vw, 24px)' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>

            {/* Logo & Title (shrinks on mobile) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: 'clamp(28px, 8vw, 46px)',
                height: 'clamp(28px, 8vw, 46px)',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                flexShrink: 0
              }}>
                <HardHat size="clamp(16px, 4vw, 26px)" color="#ffffff" />
              </div>
              <div style={{ minWidth: 0 }} className="desktop-only">
                <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  AI Construction Expense Manager
                </h1>
              </div>
            </div>

            {/* Quick Metrics Bar (desktop only) + Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ alignItems: 'center', gap: '20px', background: 'var(--bg-card-alt)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }} className="desktop-only" title="Metrics">
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{t('nav.totalCost')}</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>{formatVND(totalSpent)}</p>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{t('nav.needsReview')}</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: pendingCount > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {pendingCount > 0 ? <AlertCircle size={14} color="var(--danger)" /> : <CheckCircle2 size={14} color="var(--success)" />}
                    {pendingCount}
                  </p>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={onToggleLanguage}
                title={language === 'en' ? t('nav.langToggle') : t('nav.langToggleFromVi')}
                aria-label="Toggle language / Đổi ngôn ngữ"
                style={{ padding: '7px', fontSize: '0.75rem', fontWeight: 800, minWidth: '30px' }}
              >
                {language === 'en' ? 'VI' : 'EN'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={onToggleTheme}
                title={theme === 'light' ? t('nav.themeToDark') : t('nav.themeToLight')}
                aria-label="Toggle theme / Đổi giao diện"
                style={{ padding: '7px' }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons (icon-only on mobile, scrollable) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', overflowY: 'hidden', marginTop: '8px', paddingBottom: '4px', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <button className="btn btn-primary" onClick={onOpenUpload} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <PlusCircle size={16} />
              <span className="desktop-only">{t('nav.addPhoto')}</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenManualCreate} title={t('nav.createInvoiceTitle')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <FilePlus size={16} color="var(--primary)" />
              <span className="desktop-only">{t('nav.createInvoice')}</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenQuotationModal} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', whiteSpace: 'nowrap', flexShrink: 0 }} title={t('nav.importQuoteTitle')}>
              <FileText size={16} color="#818cf8" />
              <span className="desktop-only">{t('nav.importQuote')}</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenAuditLog} title={t('nav.historyTitle')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <History size={16} color="var(--primary)" />
              <span className="desktop-only">{t('nav.history')}</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenSettings} title={t('nav.settingsTitle')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Settings size={16} />
              <span className="desktop-only">{t('nav.settings')}</span>
            </button>

            <button className="btn btn-secondary" onClick={onLockApp} title={t('nav.lockAppTitle')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Lock size={14} color="var(--danger)" />
            </button>
          </div>

          {/* Desktop View Switching Tabs */}
          <nav className="desktop-only-nav" style={{ alignItems: 'center', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', flexWrap: 'wrap', display: 'none' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeView === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key)}
                  title={tab.title}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: active ? TAB_ACCENTS[tab.key] : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.key === 'saturday_report' && pendingCount > 0 && (
                    <span style={{ background: 'var(--danger)', color: '#ffffff', fontSize: '0.7rem', fontWeight: 900, padding: '2px 6px', borderRadius: '10px' }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="mobile-only-nav no-print"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          zIndex: 60,
          background: 'var(--header-bg)',
          borderTop: '1px solid var(--border-color)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)'
        }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: active ? TAB_ACCENT_SOLID[tab.key] : 'var(--text-dim)',
                position: 'relative'
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{tab.shortLabel}</span>
              {tab.key === 'saturday_report' && pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '22%', background: 'var(--danger)', color: '#ffffff', fontSize: '0.6rem', fontWeight: 900, padding: '1px 4px', borderRadius: '8px' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
