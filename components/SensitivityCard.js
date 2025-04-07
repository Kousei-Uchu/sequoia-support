import React from 'react';

const SensitivityCard = ({ 
  option, 
  isSelected, 
  onToggle, 
  description, 
  onDescriptionChange 
}) => {
  return (
    <div className={`sensitivity-card ${isSelected ? 'selected' : ''}`}>
      <div className="sensitivity-header">
        <input
          type="checkbox"
          id={`sens-${option.id}`}
          checked={isSelected}
          onChange={() => {
            onToggle(option);
            // When selecting, set default description if empty
            if (!isSelected && !description) {
              onDescriptionChange(option.defaultDescription);
            }
          }}
        />
        <label htmlFor={`sens-${option.id}`}>
          <img src={option.icon} alt="" className="sensitivity-icon" />
          <span>{option.label}</span>
        </label>
      </div>
      
      {isSelected && (
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your specific needs..."
          className="sensitivity-description"
        />
      )}
    </div>
  );
};

export default SensitivityCard;
