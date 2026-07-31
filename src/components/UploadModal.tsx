import React, { useState } from 'react';
import { X, UploadCloud, Sparkles, Check, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import type { ExpenseItem } from '../types/expense';
import { parseInvoiceWithAI } from '../services/aiService';
import { CATEGORY_METADATA } from '../types/expense';
import { formatVND, uploadPhotoToSupabase } from '../services/storageService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpenses: (items: ExpenseItem[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddExpenses }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<Partial<ExpenseItem>[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const parsedResults: Partial<ExpenseItem>[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        
        // 1. Try uploading to Supabase Storage Bucket 'receipts' if connected
        let finalImageUrl = base64;
        const cdnUrl = await uploadPhotoToSupabase(base64, file.name);
        if (cdnUrl) {
          finalImageUrl = cdnUrl;
        }

        // 2. Parse receipt with AI Vision
        const parsed = await parseInvoiceWithAI(base64, file.name);

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
          imageUrl: finalImageUrl,
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
      setErrorMessage('Có lỗi khi đọc ảnh hóa đơn. Vui lòng kiểm tra chìa khóa Gemini API trong Cài Đặt hoặc chọn ảnh định dạng JPG/PNG.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
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
    onAddExpenses(extractedItems as ExpenseItem[]);
    setExtractedItems([]);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', borderRadius: '24px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Tải Ảnh / Screenshot Hóa Đơn Từ Zalo</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI Vision tự động trích xuất số tiền thực chi, đơn giá, số lượng & nhà cung cấp</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {extractedItems.length === 0 && (
          <>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
              }}
              style={{
                border: '2px dashed var(--primary-glow)',
                borderRadius: '18px',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(19, 27, 46, 0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '20px'
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e: any) => handleFileUpload(e.target.files);
                input.click();
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <UploadCloud size={30} color="#60a5fa" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Kéo thả ảnh hóa đơn hoặc Click để chọn file
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Hỗ trợ ảnh chụp màn hình Zalo, Vietcombank, biên nhận viết tay (PNG, JPG, WEBP)
              </p>
            </div>

            {/* Test Sample Invoices */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Hoặc thử nghiệm nhanh với 3 ảnh mẫu công trình:
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('vcb')}>
                  <ImageIcon size={14} color="#60a5fa" />
                  <span>Ảnh Vietcombank Mẫu</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('luong')}>
                  <ImageIcon size={14} color="#34d399" />
                  <span>Biên Nhận Lương Thợ</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('com')}>
                  <ImageIcon size={14} color="#fbbf24" />
                  <span>Hóa Đơn Cơm Trưa</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '16px' }}>
              AI Vision đang đọc & trích xuất hóa đơn...
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Đang nhận diện số tiền thực chi, đơn giá, số lượng và nhà cung cấp
            </p>
          </div>
        )}

        {/* Extracted Review Section */}
        {extractedItems.length > 0 && !isProcessing && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                ✅ AI Đã Đọc Thành Công ({extractedItems.length} Giao Dịch)
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setExtractedItems([])}>
                Tải Ảnh Khác
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {extractedItems.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="Hóa đơn" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>{formatVND(item.amount || 0)}</span>
                      {item.quantity && (
                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px', color: '#f8fafc', fontWeight: 700 }}>
                          SL: {item.quantity} {item.unit || ''} {item.unitCost ? `(Đơn giá: ${formatVND(item.unitCost)})` : ''}
                        </span>
                      )}
                      <span className="badge" style={{ background: CATEGORY_METADATA[item.category as keyof typeof CATEGORY_METADATA]?.bg, color: CATEGORY_METADATA[item.category as keyof typeof CATEGORY_METADATA]?.color }}>
                        {CATEGORY_METADATA[item.category as keyof typeof CATEGORY_METADATA]?.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                      {item.merchant} {item.subCategory ? `(↳ ${item.subCategory})` : ''}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Ghi chú: {item.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setExtractedItems([])}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleConfirmAll}>
                <Check size={18} />
                <span>Xác Nhận Thêm Vào Sổ Chi Phí</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
