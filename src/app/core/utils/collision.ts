import { GameBoard, GamePiece, Position } from '../models/game.model';

/** Verifica si la pieza colisiona con bordes o celdas ocupadas, en la posición dada */
export function collides(board: GameBoard, piece: GamePiece, pos: Position): boolean {
  const shape = piece.shape;
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[0].length; x++) {
      if (!shape[y][x]) continue;

      const bx = pos.x + x;
      const by = pos.y + y;

      // Fuera de límites inferior o laterales
      if (bx < 0 || bx >= cols || by >= rows) return true;

      // Por arriba del tablero (by < 0) se permite (spawn), no colisiona salvo cuando mergea
      if (by >= 0 && board[by][bx]?.occupied) return true;
    }
  }
  return false;
}

/** Fusiona la pieza en el tablero en la posición indicada (no valida colisiones) */
export function merge(board: GameBoard, piece: GamePiece, pos: Position): GameBoard {
  const next = board.map(row => row.map(c => ({ ...c })));

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[0].length; x++) {
      if (!piece.shape[y][x]) continue;

      const by = pos.y + y;
      const bx = pos.x + x;

      if (by >= 0 && by < next.length && bx >= 0 && bx < next[0].length) {
        next[by][bx] = {
          occupied: true,
          productId: piece.product.id,
          imageUrl: piece.product.imageUrl
        };
      }
    }
  }
  return next;
}

/** Limpia filas completamente llenas (todas occupied = true) y sube filas vacías por arriba */
export function clearFilledRows(board: GameBoard): GameBoard {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  const remain: GameBoard = [];
  let cleared = 0;

  for (let y = 0; y < rows; y++) {
    const full = board[y].every(c => c.occupied);
    if (full) {
      cleared++;
    } else {
      remain.push(board[y]);
    }
  }

  // Agrega filas vacías arriba por cada fila limpiada
  const emptyRow = (): typeof board[number] =>
    Array.from({ length: cols }, () => ({ occupied: false }));
  for (let i = 0; i < cleared; i++) {
    remain.unshift(emptyRow());
  }

  return remain;
}
