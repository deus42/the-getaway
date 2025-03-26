import Phaser from 'phaser';
import { MapArea, TileType, Position } from '../interfaces/types';
import { DEFAULT_TILE_SIZE, gridToPixel } from '../world/grid';
import { store, RootState } from '../../store';

export class MainScene extends Phaser.Scene {
  private tileSize: number = DEFAULT_TILE_SIZE;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private currentMapArea: MapArea | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  public init(): void {
    // Subscribe to the Redux store changes
    this.unsubscribe = store.subscribe(() => {
      this.handleStateChange();
    });
  }

  public create(): void {
    // Initialize graphics for map rendering
    this.mapGraphics = this.add.graphics();
    
    // Create a temporary player sprite (rectangle)
    this.playerSprite = this.add.rectangle(0, 0, this.tileSize * 0.8, this.tileSize * 0.8, 0x0000ff);
    this.playerSprite.setOrigin(0.5);
    
    // Get current state from Redux
    const state = store.getState() as RootState;
    this.currentMapArea = state.world.currentMapArea;
    
    // Initial render
    this.renderMap();
    this.updatePlayerPosition(state.player.data.position);
    
    // Add text to show we're in the main scene
    this.add.text(10, 10, 'The Getaway - Main Scene', { color: '#ffffff' });
  }

  public update(): void {
    // Game loop update logic goes here
  }
  
  private handleStateChange(): void {
    const state = store.getState() as RootState;
    
    // Update map if it changed
    if (state.world.currentMapArea.id !== this.currentMapArea?.id) {
      this.currentMapArea = state.world.currentMapArea;
      this.renderMap();
    }
    
    // Update player position
    this.updatePlayerPosition(state.player.data.position);
  }
  
  private renderMap(): void {
    if (!this.currentMapArea) return;
    
    this.mapGraphics.clear();
    
    // Render each tile
    for (let y = 0; y < this.currentMapArea.height; y++) {
      for (let x = 0; x < this.currentMapArea.width; x++) {
        const tile = this.currentMapArea.tiles[y][x];
        const pixelPos = gridToPixel({x, y}, this.tileSize);
        
        // Set fill color based on tile type
        switch (tile.type) {
          case TileType.FLOOR:
            this.mapGraphics.fillStyle(0x333333);
            break;
          case TileType.WALL:
            this.mapGraphics.fillStyle(0x666666);
            break;
          case TileType.COVER:
            this.mapGraphics.fillStyle(0x225533);
            break;
          case TileType.DOOR:
            this.mapGraphics.fillStyle(0x994411);
            break;
          case TileType.WATER:
            this.mapGraphics.fillStyle(0x334488);
            break;
          case TileType.TRAP:
            this.mapGraphics.fillStyle(0x884433);
            break;
          default:
            this.mapGraphics.fillStyle(0x333333);
        }
        
        // Draw tile with a small border
        this.mapGraphics.fillRect(
          pixelPos.x + 1, 
          pixelPos.y + 1, 
          this.tileSize - 2, 
          this.tileSize - 2
        );
      }
    }
  }
  
  private updatePlayerPosition(position: Position): void {
    const pixelPos = gridToPixel(position, this.tileSize);
    this.playerSprite.setPosition(
      pixelPos.x + this.tileSize / 2,
      pixelPos.y + this.tileSize / 2
    );
  }
  
  public shutdown(): void {
    // Unsubscribe from Redux when scene shuts down
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
} 