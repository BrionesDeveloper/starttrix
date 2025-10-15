import { Routes } from '@angular/router';
import { StartScreenComponent } from './features/start/start-screen.component';
import { GameBoardComponent } from './features/game/game-board.component';

export const appRoutes: Routes = [
  { path: '', component: StartScreenComponent },
  { path: 'play', component: GameBoardComponent },
  { path: '**', redirectTo: '' },
];
