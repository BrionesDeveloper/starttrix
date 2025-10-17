import { GameEngineService } from './game-engine.service';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BOX_PROFILE, POINTS, TICK_INTERVAL } from '../tokens';
import { ProductDto } from '../models/product.model';

describe('GameEngineService', () => {
  let service: GameEngineService;

  const mockProducts: ProductDto[] = [{
    id: 'p1', name: 'Prod', sku: 'SKU', imageUrl: '', footprintW: 2, footprintH: 2
  }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        GameEngineService,
        { provide: BOX_PROFILE, useValue: { width: 10, height: 20 } },
        { provide: POINTS, useValue: { piecePlaced: 10, closeBoxBonus: 50, fullBoardMultiplier: 100 } },
        { provide: TICK_INTERVAL, useValue: 1000 }
      ]
    });

    service = TestBed.inject(GameEngineService);
  });

  it('should start new game', () => {
    service.startNewGame(mockProducts);
    service.getBoard$().subscribe(board => {
      expect(board.length).toBe(20);
    });
    service.getActivePiece$().subscribe(piece => {
      expect(piece).toBeTruthy();
    });
  });

  it('should close box and increase score', () => {
    service.startNewGame(mockProducts);
    service.closeBox();
    service.getScore$().subscribe(score => {
      expect(score).toBeGreaterThanOrEqual(50);
    });
  });
});
