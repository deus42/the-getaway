/**
 * WorldManager handles the streaming of world chunks based on player position
 * Ensures only relevant parts of the world are active for performance
 */

import { eventBus, GameEvents } from '../engine/core/gameEvents';
import { Vector2 } from '../engine/core/types/Vector2';

// Size of each chunk in world units
export const CHUNK_SIZE = 1000;

// Type for chunk coordinates
export type ChunkCoord = {
  x: number;
  y: number;
};

// Interface for world chunks
export interface WorldChunk {
  coord: ChunkCoord;
  isLoaded: boolean;
  isActive: boolean;
  entities: string[]; // Entity IDs in this chunk
  lastAccessTime: number;
}

export class WorldManager {
  // Map of chunk coordinates to chunk data
  private chunks: Map<string, WorldChunk> = new Map();
  
  // Current active chunks around the player
  private activeChunks: Set<string> = new Set();
  
  // Radius of chunks to keep active around player (in chunks)
  private activeRadius: number = 2;
  
  // Maximum number of chunks to keep loaded at once
  private maxLoadedChunks: number = 25;
  
  constructor() {}
  
  /**
   * Initialize the world manager
   */
  initialize(): void {
    console.log('WorldManager initialized');
  }
  
  /**
   * Update the active chunks based on player position
   * @param playerX Player X position in world units
   * @param playerY Player Y position in world units
   */
  updateActiveChunks(playerX: number, playerY: number): void {
    // Convert player position to chunk coordinates
    const centerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const centerChunkY = Math.floor(playerY / CHUNK_SIZE);
    
    // Determine which chunks should be active
    const newActiveChunks = new Set<string>();
    
    // Add chunks within the active radius to the set
    for (let x = centerChunkX - this.activeRadius; x <= centerChunkX + this.activeRadius; x++) {
      for (let y = centerChunkY - this.activeRadius; y <= centerChunkY + this.activeRadius; y++) {
        const chunkKey = this.getChunkKey({ x, y });
        newActiveChunks.add(chunkKey);
        
        // Load the chunk if it's not already loaded
        this.loadChunkIfNeeded({ x, y });
      }
    }
    
    // Deactivate chunks that are no longer active
    for (const chunkKey of this.activeChunks) {
      if (!newActiveChunks.has(chunkKey)) {
        this.deactivateChunk(chunkKey);
      }
    }
    
    // Activate new chunks
    for (const chunkKey of newActiveChunks) {
      if (!this.activeChunks.has(chunkKey)) {
        this.activateChunk(chunkKey);
      }
    }
    
    // Update the active chunks set
    this.activeChunks = newActiveChunks;
    
    // Unload distant chunks if we have too many loaded
    this.unloadDistantChunks(centerChunkX, centerChunkY);
  }
  
  /**
   * Load a chunk if it doesn't exist or isn't loaded
   * @param coord Chunk coordinates
   */
  private loadChunkIfNeeded(coord: ChunkCoord): void {
    const chunkKey = this.getChunkKey(coord);
    
    // Update access time if chunk exists
    if (this.chunks.has(chunkKey)) {
      const chunk = this.chunks.get(chunkKey)!;
      chunk.lastAccessTime = Date.now();
      
      // If it's not loaded, load it
      if (!chunk.isLoaded) {
        this.loadChunk(chunkKey);
      }
      
      return;
    }
    
    // Create a new chunk
    const newChunk: WorldChunk = {
      coord,
      isLoaded: false,
      isActive: false,
      entities: [],
      lastAccessTime: Date.now()
    };
    
    this.chunks.set(chunkKey, newChunk);
    
    // Load the chunk
    this.loadChunk(chunkKey);
  }
  
  /**
   * Load a chunk's data and entities
   * @param chunkKey The chunk key to load
   */
  private loadChunk(chunkKey: string): void {
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return;
    
    console.log(`Loading chunk ${chunkKey}`);
    
    // TODO: Load entities and data for this chunk
    // This might involve loading from a data store, generating procedural content, etc.
    
    // Mark as loaded
    chunk.isLoaded = true;
    
    // Notify that the chunk was loaded
    eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'chunkLoaded', chunkKey);
  }
  
  /**
   * Activate a chunk (make entities active in the world)
   * @param chunkKey The chunk key to activate
   */
  private activateChunk(chunkKey: string): void {
    const chunk = this.chunks.get(chunkKey);
    if (!chunk || !chunk.isLoaded) return;
    
    console.log(`Activating chunk ${chunkKey}`);
    
    // TODO: Activate all entities in this chunk
    // This might involve adding them to the ECS world, etc.
    
    // Mark as active
    chunk.isActive = true;
    
    // Notify that the chunk was activated
    eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'chunkActivated', chunkKey);
  }
  
  /**
   * Deactivate a chunk (make entities inactive in the world)
   * @param chunkKey The chunk key to deactivate
   */
  private deactivateChunk(chunkKey: string): void {
    const chunk = this.chunks.get(chunkKey);
    if (!chunk || !chunk.isActive) return;
    
    console.log(`Deactivating chunk ${chunkKey}`);
    
    // TODO: Deactivate all entities in this chunk
    // This might involve removing them from the ECS world, etc.
    
    // Mark as inactive
    chunk.isActive = false;
    
    // Notify that the chunk was deactivated
    eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'chunkDeactivated', chunkKey);
  }
  
  /**
   * Unload distant chunks if we have too many loaded
   * @param centerX Center X chunk coordinate
   * @param centerY Center Y chunk coordinate
   */
  private unloadDistantChunks(centerX: number, centerY: number): void {
    if (this.chunks.size <= this.maxLoadedChunks) return;
    
    // Get all chunks sorted by distance and then by last access time
    const allChunks = Array.from(this.chunks.entries())
      .map(([key, chunk]) => {
        const dx = chunk.coord.x - centerX;
        const dy = chunk.coord.y - centerY;
        const distanceSquared = dx * dx + dy * dy;
        return { key, chunk, distanceSquared };
      })
      .sort((a, b) => {
        // First sort by active status
        if (a.chunk.isActive !== b.chunk.isActive) {
          return a.chunk.isActive ? -1 : 1;
        }
        
        // Then by distance
        if (a.distanceSquared !== b.distanceSquared) {
          return a.distanceSquared - b.distanceSquared;
        }
        
        // Finally by last access time
        return b.chunk.lastAccessTime - a.chunk.lastAccessTime;
      });
    
    // Unload chunks until we're under the limit
    for (let i = this.maxLoadedChunks; i < allChunks.length; i++) {
      const { key, chunk } = allChunks[i];
      
      // Don't unload active chunks
      if (chunk.isActive) continue;
      
      this.unloadChunk(key);
    }
  }
  
  /**
   * Unload a chunk's data to free up memory
   * @param chunkKey The chunk key to unload
   */
  private unloadChunk(chunkKey: string): void {
    const chunk = this.chunks.get(chunkKey);
    if (!chunk || !chunk.isLoaded || chunk.isActive) return;
    
    console.log(`Unloading chunk ${chunkKey}`);
    
    // TODO: Save chunk data if needed
    
    // Mark as unloaded
    chunk.isLoaded = false;
    
    // Notify that the chunk was unloaded
    eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'chunkUnloaded', chunkKey);
  }
  
  /**
   * Get the key for a chunk coordinate
   * @param coord Chunk coordinate
   * @returns String key for the chunk
   */
  private getChunkKey(coord: ChunkCoord): string {
    return `${coord.x},${coord.y}`;
  }
  
  /**
   * Get a chunk by its coordinates
   * @param coord Chunk coordinates
   * @returns The chunk or undefined if not found
   */
  getChunk(coord: ChunkCoord): WorldChunk | undefined {
    return this.chunks.get(this.getChunkKey(coord));
  }
  
  /**
   * Convert a world position to chunk coordinates
   * @param position World position
   * @returns Chunk coordinates
   */
  worldToChunk(position: Vector2): ChunkCoord {
    return {
      x: Math.floor(position.x / CHUNK_SIZE),
      y: Math.floor(position.y / CHUNK_SIZE)
    };
  }
  
  /**
   * Check if a chunk is active
   * @param coord Chunk coordinates
   * @returns True if the chunk is active
   */
  isChunkActive(coord: ChunkCoord): boolean {
    const chunk = this.getChunk(coord);
    return chunk ? chunk.isActive : false;
  }
  
  /**
   * Get all currently active chunks
   * @returns Array of active chunk keys
   */
  getActiveChunkKeys(): string[] {
    return Array.from(this.activeChunks);
  }
  
  /**
   * Set the active radius for chunks around the player
   * @param radius Radius in chunks
   */
  setActiveRadius(radius: number): void {
    this.activeRadius = Math.max(1, radius);
  }
}; 