import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamePiece } from '../../core/models/game.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-hud',
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="hud">
      <div class="stats">
        <div>Score: {{ score }}</div>
        <div>Lives: {{ lives }}</div>
      </div>
      <div class="next">
        <p>Next:</p>
        <div class="preview" *ngIf="nextPiece">
          <img [src]="nextPiece.product.imageUrl" alt="Next Piece" />
        </div>
      </div>
      <button mat-stroked-button color="warn" (click)="closeBox.emit()">Close Box</button>
    </div>
  `,
  styleUrls: ['./hud.component.scss']
})
export class HUDComponent {
  @Input() score = 0;
  @Input() lives = 3;
  @Input() nextPiece: GamePiece | null = null;
  @Output() closeBox = new EventEmitter<void>();
}
