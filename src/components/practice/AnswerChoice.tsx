interface AnswerChoiceProps {
  answer: number;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (answer: number) => void;
}

export function AnswerChoice({
  answer,
  index,
  isSelected,
  disabled,
  onSelect,
}: AnswerChoiceProps) {
  return (
    <button
      aria-label={`Answer ${index + 1}: ${answer}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
      className={`answer-choice${isSelected ? ' answer-choice--selected' : ''}`}
      disabled={disabled}
      onClick={() => onSelect(answer)}
      type="button"
    >
      <span className="answer-choice__number" aria-hidden="true">
        {index + 1}
      </span>
      <span>{answer}</span>
      {isSelected && <span className="answer-choice__status">Selected</span>}
    </button>
  );
}
