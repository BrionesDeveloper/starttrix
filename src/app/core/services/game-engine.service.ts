// src/app/core/services/game-engine.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Subject, interval, animationFrameScheduler, Subscription } from 'rxjs';
import { takeWhile, tap } from 'rxjs/operators';
import { GameBoard, GamePiece, GameStatus, GameInput } from '../models/game.model';
import { ProductDto } from '../models/product.model';
import {
  BOX_PROFILE,
  POINTS,
  TICK_INTERVAL,
  THRESHOLD_ROW,
  AUTOSAVE_MS,
  GAME_TIME_MS,
} from '../tokens';
import { collides, merge as mergePiece, clearFilledRows } from '../utils/collision';
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
    @Inject(BOX_PROFILE)   private box: { width: number; height: number },
    @Inject(POINTS)        private points: { placePiece: number; closeBox: number; fullBoxMultiplier: number },
    @Inject(TICK_INTERVAL) private tickInterval: number,
    @Inject(THRESHOLD_ROW) private thresholdRow: number,
    @Inject(AUTOSAVE_MS)   private autosaveMs: number,
    @Inject(GAME_TIME_MS)  private gameTimeMs: number,
    private snackbar: MatSnackBar,
    private scores: ScoresService
  ) {
    this.resetBoard();
  }

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
        this.event$.next('gameOver');    // el componente abre el diálogo
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
      this.board$.next(clearFilledRows(merged));
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

  /** REGLAS DE CIERRE (según lo pedido):
   *  - Solo se permite cerrar si hay piezas DEBAJO de la línea (y > thresholdRow).
   *  - Si hay piezas EN o POR ENCIMA de la línea (y <= thresholdRow) => pierde 1 vida y NO suma.
   *  - Bonus x2 si la LÍNEA (fila thresholdRow) está COMPLETA.
   */
  closeBox(): void {
    const board = this.board$.value;
    const rows = board.length;
    const cols = board[0]?.length ?? 0;

    // 1) ¿hay algo DEBAJO de la línea?
    const hasBelow = board
      .slice(this.thresholdRow + 1) // filas debajo
      .some(row => row.some(c => c.occupied));

    if (!hasBelow) {
      this.snackbar.open('⚠️ Aún no puedes cerrar: coloca piezas por DEBAJO de la línea amarilla.', 'OK', { duration: 2200 });
      return;
    }

    // 2) ¿hay algo EN o POR ENCIMA de la línea?
    const hasAboveOrOnLine = board
      .slice(0, this.thresholdRow + 1) // incluye la fila de la línea
      .some(row => row.some(c => c.occupied));

    if (hasAboveOrOnLine) {
      this.loseLife('⚠️ Caja cerrada con piezas sobre o por encima de la línea. No cuenta puntos.');
      if (this.lives$.value <= 0) return;
      this.resetBoard();
      this.placedPieces = 0;
      this.updateCanClose();
      this.event$.next('closeBox');
      return;
    }

    // 3) Puntuación SOLO al cerrar (x2 si la línea está llena)
    const lineFilled = board[this.thresholdRow]?.every(c => c.occupied) ?? false;

    const added = calculateScore({
      placedPieces: this.placedPieces,
      boxClosed: true,
      // reutilizamos "boardFull" como bandera de multiplicador x2 para la línea llena
      boardFull: lineFilled,
      placePiecePoints: this.points.placePiece,
      closeBoxPoints: this.points.closeBox,
      fullBoxMultiplier: this.points.fullBoxMultiplier,
    });

    this.score$.next(this.score$.value + added);
    this.snackbar.open(
      lineFilled ? '🎉 ¡Línea completa! Bonus x2' : '📦 Caja cerrada.',
      'OK',
      { duration: 2300 }
    );

    this.event$.next('closeBox');
    this.resetBoard();
    this.placedPieces = 0;
    this.updateCanClose();
  }

  /** Habilita/deshabilita el botón cerrar según haya piezas DEBAJO de la línea */
  private updateCanClose() {
    const hasBelow = this.board$.value
      .slice(this.thresholdRow + 1)
      .some(row => row.some(c => c.occupied));
    this.canClose$.next(hasBelow);
  }

  /** Restar vida y terminar si llega a 0 */
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

  /** Tablero vacío */
  private resetBoard(): void {
    const newBoard: GameBoard = Array.from({ length: this.box.height }, () =>
      Array.from({ length: this.box.width }, () => ({ occupied: false }))
    );
    this.board$.next(newBoard);
  }

  /** Nueva pieza + "siguiente" */
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
}
