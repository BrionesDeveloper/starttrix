import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, first } from 'rxjs/operators';

import { GameEngineService } from '../../core/services/game-engine.service';
import { InputService } from '../../core/services/input.service';
import { ProductsService } from '../../core/services/products.service';
import { HUDComponent } from './hud.component';
import { GameBoard, GamePiece } from '../../core/models/game.model';
import { MatDialog } from '@angular/material/dialog';
import { SaveScoreDialogComponent } from './save-score-dialog.component';
import { THRESHOLD_ROW } from '../../core/tokens';

@Component({
  standalone: true,
  selector: 'app-game-board',
  imports: [CommonModule, HUDComponent],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit {
  private engine = inject(GameEngineService);
  private input = inject(InputService);
  private products = inject(ProductsService);
  private destroyRef = inject(DestroyRef);
  private thresholdRow = inject(THRESHOLD_ROW);
  private dialog = inject(MatDialog);

  board: GameBoard = [];
  piece: GamePiece | null = null;
  score = 0;
  lives = 3;
  nextPiece: GamePiece | null = null;

  // NUEVO: propiedades que pasamos al HUD
  timeLeftMs = 0;
  canClose = false;

  // posición visual de la línea amarilla (en % del alto)
  thresholdTopPercent = 0;

  ngOnInit() {
    // 1) Carga de productos y arranque del motor
    this.products.getProducts().pipe(first()).subscribe(list => {
      const safe = list?.length ? list : [{
        id: 'default', name: 'Placeholder', sku: 'SKU',
        imageUrl: 'https://via.placeholder.com/64x64?text=?', footprintW: 2, footprintH: 2
      }];
      this.engine.startNewGame(safe);
    });

    // 2) Estado del tablero y ubicación de la línea
    this.engine.getBoard$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(b => {
        this.board = b;
        const rows = b.length || 20; // alto real de tu BOX_PROFILE
        this.thresholdTopPercent = ((this.thresholdRow + 1) / rows) * 100;
      });

    // 3) Resto de streams
    this.engine.getActivePiece$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.piece = p);

    this.engine.getScore$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.score = s);

    this.engine.getLives$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(l => this.lives = l);

    this.engine.getNextPiece$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.nextPiece = p);

    // NUEVO: timer visible y permiso de cierre
    this.engine.getTimeLeft$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ms => this.timeLeftMs = ms);

    this.engine.getCanClose$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(can => this.canClose = can);

    // Game over -> abrir diálogo para guardar puntaje
    this.engine.getEvents$()
      .pipe(takeUntilDestroyed(this.destroyRef), filter(e => e === 'gameOver'))
      .subscribe(() => setTimeout(() => this.openSaveDialog(this.score), 0));

    // Entradas usuario (teclado/touch)
    this.input.inputs$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(input => this.engine.applyInput(input));
  }

  /** Imagen de celda (pieza activa o fija) */
  getImageUrl(x: number, y: number): string {
    if (!this.board?.[y]?.[x]) return '';
    const active = this.piece;

    if (active) {
      const { shape, position, product } = active;
      const relX = x - position.x;
      const relY = y - position.y;

      if (
        relX >= 0 && relX < shape[0].length &&
        relY >= 0 && relY < shape.length &&
        shape[relY][relX]
      ) {
        return `url("${product.imageUrl}")`;
      }
    }

    const cell = this.board[y][x];
    return cell.occupied && cell.imageUrl ? `url("${cell.imageUrl}")` : '';
  }

  openSaveDialog(score: number) {
    const ref = this.dialog.open(SaveScoreDialogComponent, {
      data: { score },
      disableClose: true,
      autoFocus: true,
      width: '420px'
    });
    ref.componentInstance.score = score;
  }

  closeBox() { this.engine.closeBox(); }

  trackByRow = (i: number) => i;
  trackByCol = (i: number) => i;
}
