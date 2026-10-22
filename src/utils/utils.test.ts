import { describe, expect, it, vi } from 'vitest';
import { createId } from './ids';
import { randomInteger } from './random';
import { shuffle } from './shuffle';

describe('general utilities', () => {
  it('generates inclusive random integers', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999);
    expect(randomInteger(3, 7)).toBe(3);
    expect(randomInteger(3, 7)).toBe(7);
    vi.restoreAllMocks();
  });

  it('rejects invalid random integer ranges', () => {
    expect(() => randomInteger(5, 4)).toThrow(RangeError);
    expect(() => randomInteger(1.2, 4)).toThrow(RangeError);
  });

  it('shuffles without changing or mutating the input values', () => {
    const original = [1, 2, 3, 4];
    const result = shuffle(original);
    expect(result).toHaveLength(4);
    expect(result).toEqual(expect.arrayContaining(original));
    expect(original).toEqual([1, 2, 3, 4]);
  });

  it('creates unique prefixed IDs', () => {
    const first = createId('question');
    const second = createId('question');
    expect(first).toMatch(/^question-/);
    expect(second).not.toBe(first);
  });
});
