import { calculateScore } from './score';

describe('Score Utils', () => {
  it('should calculate base score for placed pieces', () => {
    const score = calculateScore({ placedPieces: 3, boxClosed: false, boardFull: false });
    expect(score).toBe(30);
  });

  it('should add close box bonus', () => {
    const score = calculateScore({ placedPieces: 3, boxClosed: true, boardFull: false });
    expect(score).toBe(80);
  });

  it('should double score if board full', () => {
    const score = calculateScore({ placedPieces: 3, boxClosed: true, boardFull: true });
    expect(score).toBe(160);
  });
});
