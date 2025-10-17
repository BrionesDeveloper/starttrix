// src/app/core/services/game-engine.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Subject, interval, animationFrameScheduler, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { GameBoard, GamePiece, GameStatus, GameInput } from '../models/game.model';
import { ProductDto } from '../models/product.model';
import {
  BOX_PROFILE,
  POINTS,
  TICK_INTERVAL,
  THRESHOLD_ROW,
  THRESHOLD_HEIGHT,  // <<--- alto de la franja (p.ej. 4)
  AUTOSAVE_MS,
  GAME_TIME_MS,
} from '../tokens';
import { collides, merge as mergePiece } from '../utils/collision';
import { calculateScore } from '../utils/score';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScoresService } from './scores.service';

@Injectable({ providedIn: 'root' })
export class GameEngineService {
  private board$       = new BehaviorSubject<GameBoard>([]);
  private activePiece$ = new BehaviorSubject<GamePiece | null>(null);
  private nextPiece$   = new BehaviorSubject<GamePiece | null>(null);
  private score$       = new BehaviorSubject<number>(0);
  private lives$       = new BehaviorSubject<number>(3);
  private status$      = new BehaviorSubject<GameStatus>(GameStatus.Paused);
  private event$       = new Subject<string>();

  // Timer visible y permiso de cierre
  private timeLeftMs$  = new BehaviorSubject<number>(0);
  private canClose$    = new BehaviorSubject<boolean>(false);

  private products: ProductDto[] = [];
  private placedPieces = 0;
  private autosaveSub?: Subscription;
  private timerSub?: Subscription;

  constructor(
    @Inject(BOX_PROFILE)     private box: { width: number; height: number },
    @Inject(POINTS)          private points: { placePiece: number; closeBox: number; fullBoxMultiplier: number },
    @Inject(TICK_INTERVAL)   private tickInterval: number,
    @Inject(THRESHOLD_ROW)   private thresholdRow: number,     // fila inicial de la franja
    @Inject(THRESHOLD_HEIGHT)private thresholdHeight: number,   // alto (p.ej. 4)
    @Inject(AUTOSAVE_MS)     private autosaveMs: number,
    @Inject(GAME_TIME_MS)    private gameTimeMs: number,
    private snackbar: MatSnackBar,
    private scores: ScoresService
  ) { this.resetBoard(); }

  // Observables para la UI
  getBoard$()       { return this.board$.asObservable(); }
  getActivePiece$() { return this.activePiece$.asObservable(); }
  getNextPiece$()   { return this.nextPiece$.asObservable(); }
  getScore$()       { return this.score$.asObservable(); }
  getLives$()       { return this.lives$.asObservable(); }
  getStatus$()      { return this.status$.asObservable(); }
  getEvents$()      { return this.event$.asObservable(); }
  getTimeLeft$()    { return this.timeLeftMs$.asObservable(); }
  getCanClose$()    { return this.canClose$.asObservable(); }

  /** Inicia una partida nueva */
  startNewGame(products: ProductDto[]): void {
    if (!products.length) {
      console.warn('No products provided to game engine');
      return;
    }

    this.products = products;
    this.placedPieces = 0;
    this.score$.next(0);
    this.lives$.next(3);
    this.status$.next(GameStatus.Playing);
    this.resetBoard();
    this.updateCanClose();

    // pieza actual y próxima
    this.spawnPiece();
    this.loop();

    // autosave periódico (solo si hay score > 0)
    this.autosaveSub?.unsubscribe();
    this.autosaveSub = interval(this.autosaveMs).subscribe(() => {
      const s = this.score$.value;
      if (s > 0) this.scores.saveScore('autosave', s).subscribe();
    });

    // timer visible: al llegar a 0 => game over
    this.timerSub?.unsubscribe();
    this.timeLeftMs$.next(this.gameTimeMs);
    this.timerSub = interval(1000).pipe(
      takeWhile(() => this.status$.value === GameStatus.Playing && this.timeLeftMs$.value > 0)
    ).subscribe(() => {
      const next = this.timeLeftMs$.value - 1000;
      this.timeLeftMs$.next(Math.max(0, next));
      if (next <= 0) {
        this.status$.next(GameStatus.GameOver);
        this.event$.next('gameOver');
        this.autosaveSub?.unsubscribe();
        this.timerSub?.unsubscribe();
      }
    });
  }

  /** Bucle principal (caída por gravedad) */
  private loop(): void {
    interval(this.tickInterval, animationFrameScheduler)
      .pipe(takeWhile(() => this.status$.value === GameStatus.Playing))
      .subscribe(() => this.gravityStep());
  }

  private gravityStep(): void {
    const piece = this.activePiece$.value;
    if (!piece) return;

    const newPos = { ...piece.position, y: piece.position.y + 1 };

    if (collides(this.board$.value, piece, newPos)) {
      const merged = mergePiece(this.board$.value, piece, piece.position);
      this.board$.next(merged);
      this.placedPieces++;

      // penalización si chocó en el techo
      const protruding = piece.position.y <= 0;
      if (protruding) {
        this.loseLife('💥 Overflow en techo. Pierdes 1 vida.');
        if (this.lives$.value <= 0) return;
      }

      this.updateCanClose();
      this.spawnPiece();
    } else {
      this.activePiece$.next({ ...piece, position: newPos });
    }
  }

  /** Entradas del jugador */
  applyInput(input: GameInput): void {
    const piece = this.activePiece$.value;
    if (!piece) return;

    let newPos = { ...piece.position };
    let newShape = piece.shape;

    switch (input) {
      case GameInput.Left:  newPos.x--; break;
      case GameInput.Right: newPos.x++; break;
      case GameInput.Down:  newPos.y++; break;
      case GameInput.HardDrop:
        while (!collides(this.board$.value, piece, { ...newPos, y: newPos.y + 1 })) newPos.y++;
        break;
      case GameInput.Rotate:
        newShape = this.rotatePiece(piece.shape);
        break;
    }

    if (!collides(this.board$.value, { ...piece, shape: newShape }, newPos)) {
      this.activePiece$.next({ ...piece, shape: newShape, position: newPos });
    }
  }

  private rotatePiece(matrix: boolean[][]): boolean[][] {
    return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
  }

  /** CIERRE DE CAJA con franja:
   *  - Se permite cerrar si hay piezas DEBAJO de la franja (y > bandEnd).
   *  - Pierde vida si hay piezas POR ENCIMA de la franja (y < bandStart).
   *  - Bonus x2 si TODA la franja (bandStart..bandEnd) está llena.
   */
  closeBox(): void {
  const board = this.board$.value;
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return;

  const start = this.bandStart;
  const end   = this.bandEnd;

  // 1) ¿hay algo EN la franja o por debajo? (y >= start)
  const hasInBandOrBelow = board
    .slice(start) // desde bandStart hasta el final
    .some(row => row.some(c => c.occupied));

  if (!hasInBandOrBelow) {
    this.snackbar.open('⚠️ Aún no puedes cerrar: coloca piezas dentro de la franja amarilla.', 'OK', { duration: 2200 });
    return;
  }

  // 2) ¿hay algo POR ENCIMA de la franja? (y < start)
  const hasAbove = board
    .slice(0, start) // estrictamente por encima
    .some(row => row.some(c => c.occupied));

  if (hasAbove) {
    this.loseLife('⚠️ Caja cerrada con piezas por ENCIMA de la franja. No cuenta puntos.');
    if (this.lives$.value <= 0) return;
    this.resetBoard();
    this.placedPieces = 0;
    this.updateCanClose();
    this.event$.next('closeBox');
    return;
  }

  // 3) Bonus x2 si TODA la franja está completa
  const bandFilled = board
    .slice(start, end + 1)
    .every(row => row.every(c => c.occupied));

  const added = calculateScore({
    placedPieces: this.placedPieces,
    boxClosed: true,
    boardFull: bandFilled, // usamos esta bandera para el multiplicador
    placePiecePoints: this.points.placePiece,
    closeBoxPoints: this.points.closeBox,
    fullBoxMultiplier: this.points.fullBoxMultiplier,
  });

  this.score$.next(this.score$.value + added);
  this.snackbar.open(
    bandFilled ? '🎉 ¡Franja completa! Bonus x2' : '📦 Caja cerrada.',
    'OK',
    { duration: 2500 }
  );

  this.event$.next('closeBox');
  this.resetBoard();
  this.placedPieces = 0;
  this.updateCanClose();
}

/** Habilita/deshabilita el botón cerrar:
 *  True si hay piezas EN la franja o por DEBAJO de ella (y >= bandStart).
 */
private updateCanClose() {
  const start = this.bandStart;
  const hasInBandOrBelow = this.board$.value
    .slice(start)
    .some(row => row.some(c => c.occupied));
  this.canClose$.next(hasInBandOrBelow);
}

  private loseLife(message: string) {
    const remaining = this.lives$.value - 1;
    this.lives$.next(remaining);
    this.snackbar.open(message, 'OK', { duration: 2000 });

    if (remaining <= 0) {
      this.status$.next(GameStatus.GameOver);
      this.event$.next('gameOver');
      this.autosaveSub?.unsubscribe();
      this.timerSub?.unsubscribe();
    }
  }

  private resetBoard(): void {
    const newBoard: GameBoard = Array.from({ length: this.box.height }, () =>
      Array.from({ length: this.box.width }, () => ({ occupied: false })));
    this.board$.next(newBoard);
  }

  private spawnPiece(): void {
    const product = this.randomProduct();
    const shape = this.buildShapeFromFootprint(product.footprintW, product.footprintH);

    const piece: GamePiece = {
      shape,
      product,
      position: {
        x: Math.floor(this.box.width / 2) - Math.floor(product.footprintW / 2),
        y: 0,
      },
    };

    const next = this.randomProduct();
    const nextShape = this.buildShapeFromFootprint(next.footprintW, next.footprintH);

    this.activePiece$.next(piece);
    this.nextPiece$.next({ shape: nextShape, product: next, position: { x: 0, y: 0 } });
  }

  private buildShapeFromFootprint(w: number, h: number): boolean[][] {
    return Array.from({ length: h }, () => Array.from({ length: w }, () => true));
  }

  private randomProduct(): ProductDto {
    if (!this.products.length) {
      return {
        id: 'default',
        name: 'Placeholder',
        sku: 'SKU-0000',
        imageUrl: 'https://via.placeholder.com/48x48?text=?',
        footprintW: 2,
        footprintH: 2,
      };
    }
    return this.products[Math.floor(Math.random() * this.products.length)];
  }

  // Helpers de franja (inicio y fin)
  private get bandStart() { return this.thresholdRow; }
  private get bandEnd()   { return Math.min(this.thresholdRow + this.thresholdHeight - 1, this.box.height - 1); }
}
