export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getFileIcon(mimeType) {
  const icons = {
    'application/pdf': '📄',
    'image/': '🖼️',
    'video/': '🎥',
    'audio/': '🎵',
    'text/': '📝',
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
    'application/msword': '📘',
    'application/vnd.ms-excel': '📊',
    'application/vnd.ms-powerpoint': '📑'
  };

  for (const [prefix, icon] of Object.entries(icons)) {
    if (mimeType.startsWith(prefix)) return icon;
  }
  
  return '📎';
} 