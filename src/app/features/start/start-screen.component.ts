import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LeaderboardComponent } from './leaderboard.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-start-screen',
  imports: [CommonModule, LeaderboardComponent, MatButtonModule],
  template: `
    <div class="start-screen">
      <img src="/assets/logo.svg" alt="StarTrix Logo" class="logo" />
      <h1>Welcome to StarTrix</h1>
      <app-leaderboard></app-leaderboard>
      <button mat-raised-button color="primary" (click)="start()" aria-label="Start New Game">
        New Game
      </button>
    </div>
  `,
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent {
  private router = inject(Router);
  start() {
    this.router.navigateByUrl('/play');
  }
}
