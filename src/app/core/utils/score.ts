export interface ScoreInput {
  placedPieces: number;  // piezas colocadas desde el último cierre
  boxClosed: boolean;    // si se cerró la caja
  boardFull: boolean;    // si estaba 100% llena al cerrar
  placePiecePoints?: number;   // override opcional (por si quieres parametrizar)
  closeBoxPoints?: number;     // override opcional
  fullBoxMultiplier?: number;  // override opcional
}

/** 
 * Regla por defecto (si no se proveen overrides):
 *  - +10 por pieza colocada
 *  - +50 por cerrar caja
 *  - x2 si el tablero estaba 100% lleno al cerrar
 */
export function calculateScore(input: ScoreInput): number {
  const place = input.placePiecePoints ?? 10;
  const close = input.closeBoxPoints ?? 50;
  const mult = input.fullBoxMultiplier ?? 2;

  const base = (input.placedPieces * place) + (input.boxClosed ? close : 0);
  return input.boardFull ? base * mult : base;
}
