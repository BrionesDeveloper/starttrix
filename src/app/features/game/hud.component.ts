import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamePiece } from '../../core/models/game.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-hud',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './hud.component.html',
  styleUrls: ['./hud.component.scss']
})
export class HUDComponent {
  @Input() score = 0;
  @Input() lives = 3;
  @Input() nextPiece: GamePiece | null = null;

  @Input() timeLeftMs = 0;        // << nuevo
  @Input() canClose = false;      // << nuevo

  @Output() closeBox = new EventEmitter<void>();

  get timeLeftLabel(): string {
    const s = Math.max(0, Math.floor(this.timeLeftMs / 1000));
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }
}
