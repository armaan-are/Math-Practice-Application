import { DIFFICULTIES } from '../../constants/math';
import type { DifficultyLevel } from '../../types';

interface DifficultySelectorProps {
  selected: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
}

export function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend>Pick your level</legend>
      <div className="choice-grid choice-grid--levels">
        {DIFFICULTIES.map((level) => (
          <label
            className={`select-card${selected === level.value ? ' select-card--selected' : ''}`}
            key={level.value}
          >
            <input
              checked={selected === level.value}
              name="difficulty"
              onChange={() => onChange(level.value)}
              type="radio"
              value={level.value}
            />
            <span className="level-number">Level {level.value}</span>
            <strong>{level.label}</strong>
            <span className="field-help">{level.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
