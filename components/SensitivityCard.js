import React from 'react';
import PropTypes from 'prop-types';

const SensitivityCard = ({ 
  option = {}, 
  isSelected = false, 
  onToggle, 
  description, 
  onDescriptionChange,
  readOnly = false 
}) => {
  // Don't render anything if not selected in read-only mode
  if (readOnly && !isSelected) return null;

  const { 
    id = '', 
    icon = '', 
    label = 'Unknown Sensitivity', 
    defaultDescription = '' 
  } = option;

  const isEditable = !readOnly && onToggle && onDescriptionChange;

  return (
    <div className={`sensitivity-card ${isSelected ? 'selected' : ''} ${readOnly ? 'read-only' : ''}`}>
      <div className="sensitivity-header">
        {isEditable ? (
          <input
            type="checkbox"
            id={`sens-${id}`}
            checked={isSelected}
            onChange={() => {
              onToggle(option);
              if (!isSelected && !description) {
                onDescriptionChange(defaultDescription);
              }
            }}
          />
        ) : null}
        
        <label htmlFor={isEditable ? `sens-${id}` : undefined}>
          {icon && <img src={icon} alt="" className="sensitivity-icon" />}
          <span>{label}</span>
        </label>
      </div>
      
      {isSelected && description && (
        <div className="sensitivity-description-container">
          {isEditable ? (
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe your specific needs..."
              className="sensitivity-description"
            />
          ) : (
            <p className="sensitivity-description-readonly">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

SensitivityCard.propTypes = {
  option: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.string,
    label: PropTypes.string,
    defaultDescription: PropTypes.string
  }).isRequired,
  isSelected: PropTypes.bool,
  onToggle: PropTypes.func,
  description: PropTypes.string,
  onDescriptionChange: PropTypes.func,
  readOnly: PropTypes.bool
};

export default SensitivityCard;
