import { ProductDto } from "./product.model";

export interface Cell {
  occupied: boolean;
  productId?: string;
  imageUrl?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface GamePiece {
  shape: boolean[][];
  position: Position;
  product: ProductDto;
}

export type GameBoard = Cell[][];

export enum GameStatus {
  Playing = 'Playing',
  Paused = 'Paused',
  GameOver = 'GameOver'
}

export enum GameInput {
  Left = 'Left',
  Right = 'Right',
  Down = 'Down',
  HardDrop = 'HardDrop',
  Rotate = 'Rotate'
}
