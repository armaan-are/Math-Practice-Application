import type { DifficultyLevel, MathOperation, SessionLength } from '../types';

export const OPERATIONS: Array<{
  value: MathOperation;
  label: string;
  symbol: string;
}> = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
];

export const DIFFICULTIES: Array<{
  value: DifficultyLevel;
  label: string;
  description: string;
}> = [
  { value: 1, label: 'Beginner', description: 'Small numbers and friendly facts' },
  { value: 2, label: 'Easy', description: 'A little more to think about' },
  { value: 3, label: 'Intermediate', description: 'Bigger facts and new patterns' },
  { value: 4, label: 'Advanced', description: 'A challenge for growing experts' },
];

export const SESSION_LENGTHS: Array<{ value: SessionLength; label: string }> = [
  { value: 5, label: '5 questions' },
  { value: 10, label: '10 questions' },
  { value: 20, label: '20 questions' },
  { value: 'continuous', label: 'Keep going' },
];
