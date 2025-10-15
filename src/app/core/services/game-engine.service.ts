import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, animationFrameScheduler, interval, merge, Subject } from 'rxjs';
import { filter, map, observeOn, switchMap, takeWhile, tap } from 'rxjs/operators';
import { GameBoard, GamePiece, GameStatus, GameInput, Position } from '../models/game.model';
import { ProductDto } from '../models/product.model';
import { BOX_PROFILE, POINTS, TICK_INTERVAL } from '../tokens';
import { collides, merge as mergePiece, clearFilledRows } from '../utils/collision';
import { calculateScore } from '../utils/score';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class GameEngineService {
  private board$ = new BehaviorSubject<GameBoard>([]);
  private activePiece$ = new BehaviorSubject<GamePiece | null>(null);
  private nextPiece$ = new BehaviorSubject<GamePiece | null>(null);
  private score$ = new BehaviorSubject<number>(0);
  private lives$ = new BehaviorSubject<number>(3);
  private status$ = new BehaviorSubject<GameStatus>(GameStatus.Paused);
  private event$ = new Subject<string>();

  private products: ProductDto[] = [];
  private placedPieces = 0;

  constructor(
    @Inject(BOX_PROFILE) private box: { width: number; height: number },
    @Inject(POINTS) private points: any,
    @Inject(TICK_INTERVAL) private tickInterval: number,
    private snackbar: MatSnackBar
  ) {
    this.resetBoard();
  }

  /** Observable getters for components */
  getBoard$() { return this.board$.asObservable(); }
  getActivePiece$() { return this.activePiece$.asObservable(); }
  getNextPiece$() { return this.nextPiece$.asObservable(); }
  getScore$() { return this.score$.asObservable(); }
  getLives$() { return this.lives$.asObservable(); }
  getStatus$() { return this.status$.asObservable(); }
  getEvents$() { return this.event$.asObservable(); }

  /** Initializes new game */
  startNewGame(products: ProductDto[]): void {
    this.products = products;
    this.placedPieces = 0;
    this.score$.next(0);
    this.lives$.next(3);
    this.status$.next(GameStatus.Playing);
    this.resetBoard();
    this.spawnPiece();
    this.loop();
  }

  /** Main game loop using RxJS animation frame */
  private loop(): void {
    interval(this.tickInterval, animationFrameScheduler)
      .pipe(
        takeWhile(() => this.status$.value === GameStatus.Playing),
        tap(() => this.gravityStep())
      )
      .subscribe();
  }

  private gravityStep(): void {
    const piece = this.activePiece$.value;
    if (!piece) return;

    const newPos = { ...piece.position, y: piece.position.y + 1 };
    if (collides(this.board$.value, piece, newPos)) {
      // Merge and check protrusion
      const merged = mergePiece(this.board$.value, piece, piece.position);
      this.board$.next(clearFilledRows(merged));
      this.placedPieces++;

      const protruding = piece.position.y <= 0;
      if (protruding) {
        this.lives$.next(this.lives$.value - 1);
        this.snackbar.open('💥 Piece overflow! You lost a life.', 'OK', { duration: 2000 });
        if (this.lives$.value <= 0) {
          this.status$.next(GameStatus.GameOver);
          this.event$.next('gameOver');
          return;
        }
      }

      this.spawnPiece();
    } else {
      this.activePiece$.next({ ...piece, position: newPos });
    }
  }

  applyInput(input: GameInput): void {
    const piece = this.activePiece$.value;
    if (!piece) return;
    let newPos = { ...piece.position };
    let newShape = piece.shape;

    switch (input) {
      case GameInput.Left: newPos.x--; break;
      case GameInput.Right: newPos.x++; break;
      case GameInput.Down: newPos.y++; break;
      case GameInput.HardDrop:
        while (!collides(this.board$.value, piece, { ...newPos, y: newPos.y + 1 })) {
          newPos.y++;
        }
        break;
      case GameInput.Rotate: newShape = this.rotatePiece(piece.shape); break;
    }

    if (!collides(this.board$.value, { ...piece, shape: newShape }, newPos)) {
      this.activePiece$.next({ ...piece, shape: newShape, position: newPos });
    }
  }

  private rotatePiece(matrix: boolean[][]): boolean[][] {
    const N = matrix.length;
    return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
  }

  closeBox(): void {
    const boardFull = this.board$.value.every(row => row.every(cell => cell.occupied));
    const added = calculateScore({
      placedPieces: this.placedPieces,
      boxClosed: true,
      boardFull
    });
    this.score$.next(this.score$.value + added);
    this.snackbar.open(boardFull ? '🎉 Full box! Double bonus!' : '📦 Box closed.', 'OK', { duration: 2500 });
    this.event$.next('closeBox');
    this.resetBoard();
    this.placedPieces = 0;
  }

  private resetBoard(): void {
    const newBoard: GameBoard = Array.from({ length: this.box.height }).map(() =>
      Array.from({ length: this.box.width }).map(() => ({ occupied: false }))
    );
    this.board$.next(newBoard);
  }

  private spawnPiece(): void {
    const product = this.randomProduct();
    const shape = this.randomShape();
    const piece: GamePiece = {
      shape,
      product,
      position: { x: Math.floor(this.box.width / 2) - 2, y: 0 }
    };
    this.activePiece$.next(piece);
    this.nextPiece$.next({ ...piece, shape: this.randomShape(), product: this.randomProduct() });
  }

  private randomShape(): boolean[][] {
    const shapes = [
      [[true, true, true, true]],
      [[true, true], [true, true]],
      [[false, true, false], [true, true, true]],
      [[true, true, false], [false, true, true]],
      [[false, true, true], [true, true, false]]
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  private randomProduct(): ProductDto {
    return this.products[Math.floor(Math.random() * this.products.length)];
  }
}
