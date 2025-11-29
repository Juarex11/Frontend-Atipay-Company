
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDanger?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    width: '90%',
    maxWidth: '500px'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999
  };

  const buttonStyle = {
    base: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      marginLeft: '12px'
    },
    primary: {
      backgroundColor: isDanger ? '#DC2626' : '#4F46E5',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #D1D5DB'
    }
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '8px'
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginTop: '24px'
        }}>
          <button
            type="button"
            style={{ ...buttonStyle.base, ...buttonStyle.secondary }}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            style={{ ...buttonStyle.base, ...buttonStyle.primary }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
