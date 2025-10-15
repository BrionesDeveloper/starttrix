export function calculateScore({
  placedPieces,
  boxClosed,
  boardFull
}: {
  placedPieces: number;
  boxClosed: boolean;
  boardFull: boolean;
}): number {
  let score = placedPieces * 10;
  if (boxClosed && placedPieces > 0) {
    score += 50;
    if (boardFull) {
      score *= 2;
    }
  }
  return score;
}
