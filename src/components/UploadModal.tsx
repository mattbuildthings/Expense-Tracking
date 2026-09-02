import React, { useState, useRef } from 'react';
import { X, UploadCloud, Sparkles, Check, Image as ImageIcon, AlertTriangle, Camera } from 'lucide-react';
import type { ExpenseItem } from '../types/expense';
import { parseInvoiceWithAI } from '../services/aiService';
import { CATEGORY_METADATA } from '../types/expense';
import { uploadPhotoToSupabase } from '../services/storageService';
import { useLanguage } from '../i18n/LanguageContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpenses: (items: ExpenseItem[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddExpenses }) => {
  const { t, language } = useLanguage();
  const catLabel = (meta: { label: string; englishLabel: string }) => (language === 'en' ? meta.englishLabel : meta.label);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<Partial<ExpenseItem>[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const parsedResults: Partial<ExpenseItem>[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawBase64 = await fileToBase64Raw(file);
        
        // 1. Compress for local display & storage
        const displayImageUrl = await compressImageBase64(rawBase64, 1200, 0.75);

        // 2. Start Supabase storage upload asynchronously (non-blocking)
        const cdnPromise = uploadPhotoToSupabase(displayImageUrl, file.name).catch(() => null);

        // 3. Parse FULL RESOLUTION raw receipt with Gemini AI Vision instantly
        const parsed = await parseInvoiceWithAI(rawBase64, file.name);
        const cdnUrl = await Promise.race([
          cdnPromise,
          new Promise<string | null>(res => setTimeout(() => res(null), 3000))
        ]);

        parsedResults.push({
          id: `exp-${Date.now()}-${i}`,
          date: parsed.date,
          amount: parsed.amount,
          quantity: parsed.quantity,
          unit: parsed.unit,
          unitCost: parsed.unitCost,
          category: parsed.category,
          subCategory: parsed.subCategory,
          merchant: parsed.merchant,
          note: parsed.note,
          manDays: parsed.manDays,
          paymentMethod: parsed.paymentMethod,
          imageUrl: cdnUrl || displayImageUrl,
          imageType: parsed.imageType,
          status: parsed.confidenceScore >= 90 ? 'đã_xác_minh' : 'cần_kiểm_tra',
          confidenceScore: parsed.confidenceScore,
          aiReasoning: parsed.aiReasoning,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      setExtractedItems(parsedResults);
    } catch (err: any) {
      console.error('Failed to read receipt:', err);
      setErrorMessage(err.message || t('upload.errDefault'));
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64Raw = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
    setExtractedItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const compressImageBase64 = (base64: string, maxWidth = 1200, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64 || !base64.startsWith('data:image')) return resolve(base64);
      
      const timer = setTimeout(() => resolve(base64), 2000);
      const img = new Image();
      if (base64.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        clearTimeout(timer);
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(base64);
      };
      img.src = base64;
    });
  };

  const handleLoadSample = (sampleType: 'vcb' | 'luong' | 'com') => {
    setIsProcessing(true);
    setErrorMessage(null);
    setTimeout(async () => {
      let fileName = 'ChuyenKhoan_VCB_SieuThi_SatThep.jpg';
      let mockImage = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80';
      if (sampleType === 'luong') {
        fileName = 'NhanCong_GiayBienNhan_UngLuong.jpg';
        mockImage = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
      } else if (sampleType === 'com') {
        fileName = 'HoaDon_ComTrua_ThoXay.jpg';
        mockImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
      }

      const parsed = await parseInvoiceWithAI(mockImage, fileName);
      setExtractedItems([{
        id: `exp-sample-${Date.now()}`,
        date: parsed.date,
        amount: parsed.amount,
        quantity: parsed.quantity,
        unit: parsed.unit,
        unitCost: parsed.unitCost,
        category: parsed.category,
        subCategory: parsed.subCategory,
        merchant: parsed.merchant,
        note: parsed.note,
        manDays: parsed.manDays,
        paymentMethod: parsed.paymentMethod,
        imageUrl: mockImage,
        imageType: parsed.imageType,
        status: parsed.confidenceScore >= 90 ? 'đã_xác_minh' : 'cần_kiểm_tra',
        confidenceScore: parsed.confidenceScore,
        aiReasoning: parsed.aiReasoning,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
      setIsProcessing(false);
    }, 600);
  };

  const handleConfirmAll = () => {
    if (extractedItems.length === 0) return;
    try {
      onAddExpenses(extractedItems as ExpenseItem[]);
      setExtractedItems([]);
      onClose();
    } catch (err) {
      console.error('Failed to confirm expenses:', err);
      setErrorMessage(t('upload.errSaving'));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', borderRadius: '24px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: 'var(--chart-blue)' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('upload.title')}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('upload.subtitle')}</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Drag and Drop & Camera / Upload Options */}
        {extractedItems.length === 0 && (
          <>
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                }
                e.target.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                }
                e.target.value = '';
              }}
            />

            {/* Drag and drop zone with 2 options */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
              style={{
                border: '2px dashed var(--primary-glow)',
                borderRadius: '20px',
                padding: '22px 18px',
                background: 'var(--bg-card-alt)',
                marginBottom: '20px'
              }}
            >
              {/* Option Cards: Camera & Gallery / File */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  marginBottom: '14px'
                }}
              >
                {/* 1. Take Photo with Phone Camera */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.22) 100%)',
                    border: '1.5px solid rgba(52, 211, 153, 0.45)',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '10px',
                    color: 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-card"
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(52, 211, 153, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success)'
                    }}
                  >
                    <Camera size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {t('upload.takePhoto')}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {t('upload.takePhotoDesc')}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 14px',
                      borderRadius: '999px',
                      background: 'rgba(52, 211, 153, 0.2)',
                      color: 'var(--success)',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    <Camera size={13} /> {t('upload.takePhotoAction')}
                  </span>
                </button>

                {/* 2. Choose File / Gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.22) 100%)',
                    border: '1.5px solid rgba(96, 165, 250, 0.45)',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '10px',
                    color: 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-card"
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--chart-blue)'
                    }}
                  >
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {t('upload.chooseFile')}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {t('upload.chooseFileDesc')}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 14px',
                      borderRadius: '999px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: 'var(--chart-blue)',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    <UploadCloud size={13} /> {t('upload.chooseFileAction')}
                  </span>
                </button>
              </div>

              {/* Subtitle helper */}
              <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {t('upload.dropzoneSubtitle')}
                </p>
              </div>
            </div>

            {/* Test Sample Invoices */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                {t('upload.sampleHint')}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('vcb')}>
                  <ImageIcon size={14} color="#60a5fa" />
                  <span>{t('upload.sampleVcb')}</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('luong')}>
                  <ImageIcon size={14} color="#34d399" />
                  <span>{t('upload.sampleLuong')}</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('com')}>
                  <ImageIcon size={14} color="#fbbf24" />
                  <span>{t('upload.sampleCom')}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '16px' }}>
              {t('upload.processingTitle')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('upload.processingSubtitle')}
            </p>
          </div>
        )}

        {/* Extracted Review Section */}
        {extractedItems.length > 0 && !isProcessing && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={18} /> {t('upload.successTitle')} ({extractedItems.length} {t('upload.transactionsSuffix')})
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setExtractedItems([])}>
                {t('upload.uploadAnother')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {extractedItems.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={t('ledger.invoiceImageAlt')} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                          {t('upload.vendorLabel')}
                        </label>
                        <input
                          type="text"
                          value={item.merchant || ''}
                          onChange={e => handleItemChange(idx, 'merchant', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                          {t('upload.amountPaidLabel')}
                        </label>
                        <input
                          type="number"
                          value={item.amount || 0}
                          onChange={e => handleItemChange(idx, 'amount', Number(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#34d399', fontSize: '0.95rem', fontWeight: 800 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                          {t('upload.budgetCategoryLabel')}
                        </label>
                        <select
                          value={item.category}
                          onChange={e => handleItemChange(idx, 'category', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => (
                            <option key={catKey} value={catKey} style={{ background: '#1e293b', color: '#fff' }}>
                              {catLabel(meta)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                          {t('upload.noteLabel')}
                        </label>
                        <input
                          type="text"
                          value={item.note || ''}
                          onChange={e => handleItemChange(idx, 'note', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setExtractedItems([])}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleConfirmAll}>
                <Check size={18} />
                <span>{t('upload.confirmAddBtn')}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
