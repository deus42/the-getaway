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
    
    // Draw grid lines first
    this.mapGraphics.lineStyle(1, 0x222222, 0.5);
    
    // Vertical grid lines
    for (let x = 0; x <= this.currentMapArea.width; x++) {
      this.mapGraphics.beginPath();
      this.mapGraphics.moveTo(x * this.tileSize, 0);
      this.mapGraphics.lineTo(x * this.tileSize, this.currentMapArea.height * this.tileSize);
      this.mapGraphics.closePath();
      this.mapGraphics.strokePath();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= this.currentMapArea.height; y++) {
      this.mapGraphics.beginPath();
      this.mapGraphics.moveTo(0, y * this.tileSize);
      this.mapGraphics.lineTo(this.currentMapArea.width * this.tileSize, y * this.tileSize);
      this.mapGraphics.closePath();
      this.mapGraphics.strokePath();
    }
    
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
            this.mapGraphics.fillStyle(0x777777); // Lighter grey for better visibility
            break;
          case TileType.COVER:
            this.mapGraphics.fillStyle(0x338833); // More visible green for cover
            break;
          case TileType.DOOR:
            this.mapGraphics.fillStyle(0xAA6622); // Brighter brown for doors
            break;
          case TileType.WATER:
            this.mapGraphics.fillStyle(0x3366AA); // Brighter blue for water
            break;
          case TileType.TRAP:
            this.mapGraphics.fillStyle(0xAA3333); // Brighter red for traps
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
        
        // Add indicators for non-walkable/cover tiles
        if (!tile.isWalkable) {
          // Add an X to non-walkable tiles
          this.mapGraphics.lineStyle(2, 0xEEEEEE, 0.7);
          this.mapGraphics.beginPath();
          this.mapGraphics.moveTo(pixelPos.x + 10, pixelPos.y + 10);
          this.mapGraphics.lineTo(pixelPos.x + this.tileSize - 10, pixelPos.y + this.tileSize - 10);
          this.mapGraphics.moveTo(pixelPos.x + this.tileSize - 10, pixelPos.y + 10);
          this.mapGraphics.lineTo(pixelPos.x + 10, pixelPos.y + this.tileSize - 10);
          this.mapGraphics.closePath();
          this.mapGraphics.strokePath();
        } else if (tile.provideCover) {
          // Add a circle to cover tiles
          this.mapGraphics.lineStyle(2, 0xEEEEEE, 0.7);
          this.mapGraphics.beginPath();
          this.mapGraphics.arc(
            pixelPos.x + this.tileSize / 2, 
            pixelPos.y + this.tileSize / 2, 
            this.tileSize / 4, 
            0, 
            Math.PI * 2
          );
          this.mapGraphics.closePath();
          this.mapGraphics.strokePath();
        }
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