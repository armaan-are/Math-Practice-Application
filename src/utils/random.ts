export function randomInteger(minimum: number, maximum: number): number {
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) {
    throw new RangeError(
      'randomInteger requires integer bounds with minimum <= maximum.',
    );
  }

  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}
