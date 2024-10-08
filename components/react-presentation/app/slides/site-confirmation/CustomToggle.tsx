import React from 'react';
import './CustomToggle.module.css';

interface CustomToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const CustomToggle: React.FC<CustomToggleProps> = ({ id, checked, onChange, label }) => {
  return (
    <div className="custom-toggle">
      <input
        type="checkbox"
        id={id}
        className="toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="toggle-label">
        <span className="toggle-button"></span>
      </label>
      <span className="toggle-text">{label}</span>
    </div>
  );
};

export default CustomToggle;
