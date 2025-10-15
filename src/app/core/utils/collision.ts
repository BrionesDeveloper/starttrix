import { GameBoard, GamePiece, Position } from '../models/game.model';

export function rotate(matrix: boolean[][]): boolean[][] {
  const N = matrix.length;
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

export function collides(board: GameBoard, piece: GamePiece, pos: Position): boolean {
  const { shape } = piece;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;

      const boardX = pos.x + x;
      const boardY = pos.y + y;

      if (
        boardX < 0 || boardX >= board[0].length ||
        boardY < 0 || boardY >= board.length ||
        board[boardY][boardX].occupied
      ) {
        return true;
      }
    }
  }
  return false;
}

export function merge(board: GameBoard, piece: GamePiece, pos: Position): GameBoard {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const { shape, product } = piece;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;

      const boardX = pos.x + x;
      const boardY = pos.y + y;

      if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
        newBoard[boardY][boardX] = {
          occupied: true,
          productId: product.id,
          imageUrl: product.imageUrl,
        };
      }
    }
  }

  return newBoard;
}

export function clearFilledRows(board: GameBoard): GameBoard {
  const width = board[0].length;
  const newBoard = board.filter(row => row.some(cell => !cell.occupied));
  const cleared = board.length - newBoard.length;
  for (let i = 0; i < cleared; i++) {
    newBoard.unshift(new Array(width).fill(null).map(() => ({ occupied: false })));
  }
  return newBoard;
}
