/**
 * AssetManager handles loading, caching, and unloading of game assets
 */

import { eventBus, GameEvents } from './gameEvents';

// Asset types supported by the manager
export enum AssetType {
  IMAGE = 'image',
  SPRITESHEET = 'spritesheet',
  AUDIO = 'audio',
  JSON = 'json',
  TEXT = 'text',
  BINARY = 'binary'
}

// Interface for asset metadata
export interface AssetInfo {
  key: string;
  type: AssetType;
  url: string;
  data?: any; // Additional data specific to the asset type (e.g., spritesheet frames)
  loaded: boolean;
  size?: number; // Size in bytes if known
  zonePriority?: string[]; // List of zones this asset is important for
}

export class AssetManager {
  // Map of asset keys to asset info
  private assets: Map<string, AssetInfo> = new Map();
  
  // Set of currently loaded asset keys
  private loadedAssets: Set<string> = new Set();
  
  // Maximum memory budget for assets in bytes (approximate)
  private memoryBudget: number = 100 * 1024 * 1024; // 100MB default
  
  // Current estimated memory usage
  private currentMemoryUsage: number = 0;
  
  // Current zone name
  private currentZone: string = '';
  
  // Phaser scene reference for loading assets
  private scene?: Phaser.Scene;
  
  constructor() {}
  
  /**
   * Set the Phaser scene to use for loading
   * @param scene Phaser scene
   */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
    console.log('AssetManager: Scene set for loading assets');
  }
  
  /**
   * Register an asset with the manager
   * @param key Unique asset key
   * @param type Asset type
   * @param url URL to the asset
   * @param data Additional data for the asset
   * @param zones Zones where this asset is used
   */
  registerAsset(
    key: string,
    type: AssetType,
    url: string,
    data?: any,
    zones?: string[]
  ): void {
    if (this.assets.has(key)) {
      console.warn(`AssetManager: Asset key "${key}" already registered`);
      return;
    }
    
    this.assets.set(key, {
      key,
      type,
      url,
      data,
      loaded: false,
      zonePriority: zones || []
    });
  }
  
  /**
   * Register multiple assets at once
   * @param assets Array of asset definitions
   */
  registerAssets(assets: { key: string; type: AssetType; url: string; data?: any; zones?: string[] }[]): void {
    for (const asset of assets) {
      this.registerAsset(asset.key, asset.type, asset.url, asset.data, asset.zones);
    }
  }
  
  /**
   * Load an asset
   * @param key Asset key to load
   * @returns Promise that resolves when the asset is loaded
   */
  async loadAsset(key: string): Promise<void> {
    // Check if asset is already loaded
    if (this.loadedAssets.has(key)) {
      return Promise.resolve();
    }
    
    // Get asset info
    const asset = this.assets.get(key);
    if (!asset) {
      return Promise.reject(new Error(`AssetManager: Asset "${key}" not registered`));
    }
    
    if (!this.scene) {
      return Promise.reject(new Error('AssetManager: No scene set for loading assets'));
    }
    
    // Return a promise that resolves when the asset is loaded
    return new Promise<void>((resolve, reject) => {
      try {
        const loadHandler = () => {
          // Mark as loaded
          asset.loaded = true;
          this.loadedAssets.add(key);
          
          // Update memory usage if size is known
          if (asset.size) {
            this.currentMemoryUsage += asset.size;
          }
          
          // Publish event
          eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'assetLoaded', key);
          
          resolve();
        };
        
        // Load based on asset type
        switch (asset.type) {
          case AssetType.IMAGE:
            this.scene.load.image(key, asset.url);
            break;
            
          case AssetType.SPRITESHEET:
            if (!asset.data) {
              reject(new Error(`AssetManager: Spritesheet "${key}" requires frame data`));
              return;
            }
            this.scene.load.spritesheet(key, asset.url, asset.data);
            break;
            
          case AssetType.AUDIO:
            this.scene.load.audio(key, asset.url);
            break;
            
          case AssetType.JSON:
            this.scene.load.json(key, asset.url);
            break;
            
          case AssetType.TEXT:
            this.scene.load.text(key, asset.url);
            break;
            
          case AssetType.BINARY:
            this.scene.load.binary(key, asset.url);
            break;
            
          default:
            reject(new Error(`AssetManager: Unsupported asset type for "${key}"`));
            return;
        }
        
        // Start the load if not already started
        if (this.scene.load.isLoading()) {
          // Add completion callback if we're already loading
          this.scene.load.once(Phaser.Loader.Events.COMPLETE, loadHandler);
        } else {
          // Start loading and add completion callback
          this.scene.load.once(Phaser.Loader.Events.COMPLETE, loadHandler);
          this.scene.load.start();
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Preload a zone's assets
   * @param zoneName Zone name
   * @returns Promise that resolves when all zone assets are loaded
   */
  async preloadZone(zoneName: string): Promise<void> {
    console.log(`AssetManager: Preloading zone "${zoneName}"`);
    
    // Get all assets for this zone
    const zoneAssets = Array.from(this.assets.values())
      .filter(asset => asset.zonePriority && asset.zonePriority.includes(zoneName));
    
    if (zoneAssets.length === 0) {
      console.warn(`AssetManager: No assets registered for zone "${zoneName}"`);
      return Promise.resolve();
    }
    
    // Set current zone
    this.currentZone = zoneName;
    
    // Load zone assets in parallel
    const loadPromises = zoneAssets.map(asset => this.loadAsset(asset.key));
    await Promise.all(loadPromises);
    
    console.log(`AssetManager: Zone "${zoneName}" preloaded`);
  }
  
  /**
   * Unload assets not needed for the current zone to free up memory
   */
  unloadUnusedAssets(): void {
    if (!this.scene) return;
    
    // Skip if we don't have a current zone
    if (!this.currentZone) return;
    
    // Find assets to unload
    const assetsToUnload = Array.from(this.loadedAssets)
      .filter(key => {
        const asset = this.assets.get(key);
        // Keep assets needed in the current zone
        return asset && 
               asset.zonePriority && 
               !asset.zonePriority.includes(this.currentZone);
      });
    
    // Unload each asset
    for (const key of assetsToUnload) {
      this.unloadAsset(key);
    }
    
    console.log(`AssetManager: Unloaded ${assetsToUnload.length} unused assets`);
  }
  
  /**
   * Unload a specific asset
   * @param key Asset key to unload
   */
  unloadAsset(key: string): void {
    if (!this.scene) return;
    
    // Check if asset is loaded
    if (!this.loadedAssets.has(key)) return;
    
    // Get asset info
    const asset = this.assets.get(key);
    if (!asset) return;
    
    // Remove from cache based on asset type
    try {
      switch (asset.type) {
        case AssetType.IMAGE:
        case AssetType.SPRITESHEET:
          this.scene.textures.remove(key);
          break;
          
        case AssetType.AUDIO:
          this.scene.sound.remove(key);
          break;
          
        case AssetType.JSON:
        case AssetType.TEXT:
        case AssetType.BINARY:
          this.scene.cache.json.remove(key);
          break;
      }
      
      // Mark as unloaded
      asset.loaded = false;
      this.loadedAssets.delete(key);
      
      // Update memory usage if size is known
      if (asset.size) {
        this.currentMemoryUsage -= asset.size;
      }
      
      // Publish event
      eventBus.publish(GameEvents.WORLD_STATE_CHANGED, 'assetUnloaded', key);
      
      console.log(`AssetManager: Unloaded asset "${key}"`);
    } catch (error) {
      console.error(`AssetManager: Error unloading asset "${key}":`, error);
    }
  }
  
  /**
   * Set the current zone
   * @param zoneName Zone name
   */
  setCurrentZone(zoneName: string): void {
    if (this.currentZone === zoneName) return;
    
    this.currentZone = zoneName;
    console.log(`AssetManager: Current zone set to "${zoneName}"`);
    
    // Unload assets not needed in the new zone
    this.unloadUnusedAssets();
  }
  
  /**
   * Check if an asset is loaded
   * @param key Asset key
   * @returns True if the asset is loaded
   */
  isLoaded(key: string): boolean {
    return this.loadedAssets.has(key);
  }
  
  /**
   * Get the number of loaded assets
   * @returns Count of loaded assets
   */
  getLoadedAssetCount(): number {
    return this.loadedAssets.size;
  }
  
  /**
   * Get the total number of registered assets
   * @returns Count of registered assets
   */
  getTotalAssetCount(): number {
    return this.assets.size;
  }
  
  /**
   * Get the current memory usage
   * @returns Memory usage in bytes
   */
  getMemoryUsage(): number {
    return this.currentMemoryUsage;
  }
  
  /**
   * Set the memory budget
   * @param bytes Memory budget in bytes
   */
  setMemoryBudget(bytes: number): void {
    this.memoryBudget = bytes;
  }
}

// Create a singleton instance
export const assetManager = new AssetManager(); 