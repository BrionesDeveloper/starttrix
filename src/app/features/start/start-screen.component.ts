import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LeaderboardComponent } from './leaderboard.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-start-screen',
  imports: [CommonModule, LeaderboardComponent, MatButtonModule],
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent {
  private router = inject(Router);

  start() {
    this.router.navigateByUrl('/play');
  }
}
