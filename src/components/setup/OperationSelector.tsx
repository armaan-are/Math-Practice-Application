import { OPERATIONS } from '../../constants/math';
import type { MathOperation } from '../../types';

interface OperationSelectorProps {
  selected: MathOperation[];
  onChange: (operations: MathOperation[]) => void;
}

export function OperationSelector({ selected, onChange }: OperationSelectorProps) {
  const allSelected = selected.length === OPERATIONS.length;

  const toggle = (operation: MathOperation) => {
    onChange(
      selected.includes(operation)
        ? selected.filter((item) => item !== operation)
        : [...selected, operation],
    );
  };

  return (
    <fieldset className="setup-group">
      <legend>What would you like to practice?</legend>
      <p className="field-help">Choose one or more.</p>
      <div className="choice-grid choice-grid--operations">
        {OPERATIONS.map((operation) => {
          const isSelected = selected.includes(operation.value);
          return (
            <button
              aria-label={`${operation.label} ${isSelected ? 'selected' : 'not selected'}`}
              aria-pressed={isSelected}
              className={`select-card${isSelected ? ' select-card--selected' : ''}`}
              key={operation.value}
              onClick={() => toggle(operation.value)}
              type="button"
            >
              <span className="select-card__symbol" aria-hidden="true">
                {operation.symbol}
              </span>
              <span>{operation.label}</span>
              <span className="selection-label">
                {isSelected ? 'Selected' : 'Select'}
              </span>
            </button>
          );
        })}
      </div>
      <button
        className="text-button"
        onClick={() => onChange(allSelected ? [] : OPERATIONS.map(({ value }) => value))}
        type="button"
      >
        {allSelected ? 'Clear all operations' : 'Select all operations'}
      </button>
    </fieldset>
  );
}
