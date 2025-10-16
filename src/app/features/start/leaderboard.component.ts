import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { ScoreEntryDto } from '../../core/models/score.model';

@Component({
  standalone: true,
  selector: 'app-leaderboard',
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  top10: ScoreEntryDto[] = [];

  ngOnInit(): void {
    this.leaderboardService.getTop10().subscribe(data => (this.top10 = data));
  }

  trackByName = (_: number, row: ScoreEntryDto) => row.name;
}
