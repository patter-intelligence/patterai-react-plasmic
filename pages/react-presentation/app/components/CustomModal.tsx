import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  size: 'small' | 'medium' | 'large';
  label: string;
  description: string;
  variant: 'brand' | 'outline-brand' | 'destructive' | 'text-destructive' | 'success';
  successLabel: string;
  showCancel: boolean;
  selectionModal: boolean;
  selectLabel: string;
  selectPlaceholder: string;
  selectOptions: { label: string; value: string }[];
  selectValue: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  size,
  label,
  description,
  variant,
  successLabel,
  showCancel,
  selectionModal,
  selectLabel,
  selectPlaceholder,
  selectOptions,
  selectValue,
}) => {
  const [selectedValue, setSelectedValue] = useState(selectValue);

  const handleSave = () => {
    onSave(selectedValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`custom-modal custom-modal-${size}`}>
      <div className="custom-modal-content">
        <h2>{label}</h2>
        <p>{description}</p>
        {selectionModal && (
          <div className="custom-select">
            <label htmlFor="custom-select">{selectLabel}</label>
            <select
              id="custom-select"
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              <option value="">{selectPlaceholder}</option>
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="custom-modal-footer">
          {showCancel && (
            <button className="custom-button" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            className={`custom-button custom-button-${variant}`}
            onClick={handleSave}
          >
            {successLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;

export const openCustomModal = (props: Omit<CustomModalProps, 'isOpen' | 'onClose' | 'onSave'>): Promise<string | null> => {
  return new Promise((resolve) => {
    const modalRoot = document.createElement('div');
    document.body.appendChild(modalRoot);

    const closeModal = () => {
      ReactDOM.unmountComponentAtNode(modalRoot);
      document.body.removeChild(modalRoot);
    };

    const handleSave = (value: string) => {
      resolve(value);
      closeModal();
    };

    ReactDOM.render(
      <CustomModal
        {...props}
        isOpen={true}
        onClose={() => {
          resolve(null);
          closeModal();
        }}
        onSave={handleSave}
      />,
      modalRoot
    );
  });
};
