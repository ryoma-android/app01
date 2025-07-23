// 通貨フォーマット関数
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount);
};

// ファイルサイズフォーマット関数
export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  }
  return (bytes / 1024).toFixed(1) + 'KB';
};

// 日付フォーマット関数
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP');
}; 