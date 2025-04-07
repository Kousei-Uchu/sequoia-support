import React from 'react';
import PropTypes from 'prop-types';

const SensitivityCard = ({ 
  option = {}, // Default empty object to prevent crashes
  isSelected = false, 
  onToggle = () => {}, 
  description = '', 
  onDescriptionChange = () => {} 
}) => {
  // Safely access option properties with fallbacks
  const { 
    id = '', 
    icon = '', 
    label = 'Unknown Sensitivity', 
    defaultDescription = '' 
  } = option || {};

  return (
    <div className={`sensitivity-card ${isSelected ? 'selected' : ''}`}>
      <div className="sensitivity-header">
        <input
          type="checkbox"
          id={`sens-${id}`}
          checked={isSelected}
          onChange={() => {
            onToggle(option);
            // When selecting, set default description if empty
            if (!isSelected && !description) {
              onDescriptionChange(defaultDescription);
            }
          }}
          aria-label={`Toggle ${label}`}
        />
        <label htmlFor={`sens-${id}`}>
          {icon && (
            <img 
              src={icon} 
              alt="" 
              className="sensitivity-icon" 
              onError={(e) => {
                e.target.style.display = 'none'; // Hide broken images
              }}
            />
          )}
          <span>{label}</span>
        </label>
      </div>
      
      {isSelected && (
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your specific needs..."
          className="sensitivity-description"
          aria-label={`Description for ${label}`}
        />
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
  }),
  isSelected: PropTypes.bool,
  onToggle: PropTypes.func,
  description: PropTypes.string,
  onDescriptionChange: PropTypes.func
};

export default SensitivityCard;
