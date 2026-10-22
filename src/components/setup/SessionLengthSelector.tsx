import { SESSION_LENGTHS } from '../../constants/math';
import type { SessionLength } from '../../types';

interface SessionLengthSelectorProps {
  selected: SessionLength;
  onChange: (length: SessionLength) => void;
}

export function SessionLengthSelector({
  selected,
  onChange,
}: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend>How long is your mission?</legend>
      <div className="segmented-control">
        {SESSION_LENGTHS.map((length) => (
          <label key={String(length.value)}>
            <input
              checked={selected === length.value}
              name="sessionLength"
              onChange={() => onChange(length.value)}
              type="radio"
              value={length.value}
            />
            <span>{length.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
