import { collides, merge, rotate } from './collision';
import { GameBoard, GamePiece } from '../models/game.model';

describe('Collision Utils', () => {
  const emptyBoard: GameBoard = Array.from({ length: 20 }, () =>
    Array.from({ length: 10 }, () => ({ occupied: false }))
  );

  const piece: GamePiece = {
    shape: [[true, true], [true, true]],
    position: { x: 4, y: 0 },
    product: {
      id: 'prod',
      name: 'Test',
      sku: 'TST',
      imageUrl: '',
      footprintW: 2,
      footprintH: 2
    }
  };

  it('should detect no collision on empty board', () => {
    expect(collides(emptyBoard, piece, piece.position)).toBeFalse();
  });

  it('should detect collision on bottom', () => {
    const pos = { x: 4, y: 19 };
    expect(collides(emptyBoard, piece, pos)).toBeTrue();
  });

  it('should merge piece into board', () => {
    const merged = merge(emptyBoard, piece, piece.position);
    const cell = merged[piece.position.y][piece.position.x];
    expect(cell.occupied).toBeTrue();
  });

  it('should rotate a 2x2 square (unchanged)', () => {
    const rotated = rotate(piece.shape);
    expect(rotated).toEqual(piece.shape);
  });
});
