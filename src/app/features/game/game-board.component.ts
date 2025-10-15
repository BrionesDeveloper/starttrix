import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../core/services/game-engine.service';
import { InputService } from '../../core/services/input.service';
import { HUDComponent } from './hud.component';
import { GameBoard, GamePiece } from '../../core/models/game.model';
import { MatDialog } from '@angular/material/dialog';
import { SaveScoreDialogComponent } from './save-score-dialog.component';

@Component({
  standalone: true,
  selector: 'app-game-board',
  imports: [CommonModule, HUDComponent],
  template: `
    <div class="game-container">
      <div class="board" [style.gridTemplateColumns]="'repeat(' + board[0]?.length + ', 1fr)'">
        <ng-container *ngFor="let row of board; let y = index">
          <ng-container *ngFor="let cell of row; let x = index">
            <div
              class="cell"
              [ngClass]="{ filled: cell.occupied }"
              [ngStyle]="{
                'background-image': getImageUrl(x, y)
              }"
              role="presentation"
            ></div>
          </ng-container>
        </ng-container>
      </div>
      <app-hud
        [score]="score"
        [lives]="lives"
        [nextPiece]="nextPiece"
        (closeBox)="closeBox()"
      ></app-hud>
    </div>
  `,
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit {
  private engine = inject(GameEngineService);
  private input = inject(InputService);

  board: GameBoard = [];
  piece: GamePiece | null = null;
  score = 0;
  lives = 3;
  nextPiece: GamePiece | null = null;

  ngOnInit() {
    this.engine.getBoard$().subscribe(b => this.board = b);
    this.engine.getActivePiece$().subscribe(p => this.piece = p);
    this.engine.getScore$().subscribe(s => this.score = s);
    this.engine.getLives$().subscribe(l => this.lives = l);
    this.engine.getNextPiece$().subscribe(p => this.nextPiece = p);
    this.engine.getEvents$().subscribe(e => {
      if (e === 'gameOver') {
        // open dialog in next batch
      }
    });

    this.input.inputs$.subscribe(input => this.engine.applyInput(input));
  }

  constructor(private dialog: MatDialog) {}

  getImageUrl(x: number, y: number): string {
    const piece = this.piece;
    if (!piece) return '';
    const { shape, position, product } = piece;

    const relX = x - position.x;
    const relY = y - position.y;

    if (
      relX >= 0 && relX < shape[0].length &&
      relY >= 0 && relY < shape.length &&
      shape[relY][relX]
    ) {
      return `url(${product.imageUrl})`;
    }

    return this.board[y][x].occupied && this.board[y][x].imageUrl
      ? `url(${this.board[y][x].imageUrl})`
      : '';
  }

  openSaveDialog(score: number) {
  const ref = this.dialog.open(SaveScoreDialogComponent, {
    data: { score },
    disableClose: true,
    autoFocus: true
  });
  ref.componentInstance.score = score;
}

  closeBox() {
    this.engine.closeBox();
  }
}
