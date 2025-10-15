import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { ScoreEntryDto } from '../../core/models/score.model';

@Component({
  standalone: true,
  selector: 'app-leaderboard',
  imports: [CommonModule],
  template: `
    <h2>Top 10</h2>
    <table>
      <thead>
        <tr><th>Player</th><th>Score</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let entry of top10">
          <td>{{ entry.displayName }}</td>
          <td>{{ entry.score }}</td>
        </tr>
      </tbody>
    </table>
  `,
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  top10: ScoreEntryDto[] = [];

  ngOnInit(): void {
    this.leaderboardService.getTop10().subscribe(data => this.top10 = data);
  }
}
