import { Item } from '../interfaces/Item';

/**
 * Manages inventory for entities including item storage, weight limits, and operations
 */
export class InventoryComponent {
  private items: Map<string, Item> = new Map();
  private itemCounts: Map<string, number> = new Map();
  private maxWeight: number;
  private maxSlots: number;
  
  // Event callbacks
  public onItemAdded: ((item: Item, count: number) => void) | null = null;
  public onItemRemoved: ((itemId: string, count: number) => void) | null = null;
  public onInventoryFull: (() => void) | null = null;

  /**
   * Creates a new inventory component
   * @param maxSlots Maximum number of item slots
   * @param maxWeight Maximum weight capacity
   */
  constructor(maxSlots: number = 20, maxWeight: number = 100) {
    this.maxSlots = maxSlots;
    this.maxWeight = maxWeight;
  }

  /**
   * Add an item to the inventory
   * @param item The item to add
   * @param count Number of items to add (default: 1)
   * @returns Whether the item was successfully added
   */
  public addItem(item: Item, count: number = 1): boolean {
    if (!item || count <= 0) return false;
    
    // Check weight limit
    const totalWeight = this.getCurrentWeight() + (item.weight * count);
    if (totalWeight > this.maxWeight) {
      if (this.onInventoryFull) {
        this.onInventoryFull();
      }
      return false;
    }
    
    // Handle stackable items
    if (item.stackable && this.hasItem(item.id)) {
      const currentCount = this.itemCounts.get(item.id) || 0;
      const maxStack = item.maxStack || Number.MAX_SAFE_INTEGER;
      
      if (currentCount + count <= maxStack) {
        this.itemCounts.set(item.id, currentCount + count);
        
        if (this.onItemAdded) {
          this.onItemAdded(item, count);
        }
        
        return true;
      } else {
        // Partial stack allowed
        const addCount = maxStack - currentCount;
        if (addCount > 0) {
          this.itemCounts.set(item.id, maxStack);
          
          if (this.onItemAdded) {
            this.onItemAdded(item, addCount);
          }
          
          // Try to add remaining items recursively
          const remaining = count - addCount;
          if (remaining > 0) {
            return this.addItem(item, remaining);
          }
          
          return true;
        }
        
        // Stack is full, try new slot
      }
    }
    
    // Non-stackable item or new item type
    // Check slot capacity
    if (this.getUniqueItemCount() >= this.maxSlots) {
      if (this.onInventoryFull) {
        this.onInventoryFull();
      }
      return false;
    }
    
    // Add the item
    this.items.set(item.id, item);
    this.itemCounts.set(item.id, count);
    
    if (this.onItemAdded) {
      this.onItemAdded(item, count);
    }
    
    return true;
  }

  /**
   * Remove an item from the inventory
   * @param itemId ID of the item to remove
   * @param count Number of items to remove (default: 1)
   * @returns Whether the item was successfully removed
   */
  public removeItem(itemId: string, count: number = 1): boolean {
    if (!this.hasItem(itemId) || count <= 0) return false;
    
    const currentCount = this.itemCounts.get(itemId) || 0;
    
    if (currentCount <= count) {
      // Remove the item completely
      const item = this.items.get(itemId);
      this.items.delete(itemId);
      this.itemCounts.delete(itemId);
      
      if (this.onItemRemoved && item) {
        this.onItemRemoved(itemId, currentCount);
      }
    } else {
      // Reduce the count
      this.itemCounts.set(itemId, currentCount - count);
      
      if (this.onItemRemoved) {
        this.onItemRemoved(itemId, count);
      }
    }
    
    return true;
  }

  /**
   * Check if the inventory has a specific item
   * @param itemId ID of the item to check
   * @returns Whether the item is in the inventory
   */
  public hasItem(itemId: string): boolean {
    return this.items.has(itemId) && (this.itemCounts.get(itemId) || 0) > 0;
  }

  /**
   * Get a specific item from the inventory
   * @param itemId ID of the item to get
   * @returns The item or null if not found
   */
  public getItem(itemId: string): Item | null {
    return this.items.get(itemId) || null;
  }

  /**
   * Get number of a specific item in inventory
   * @param itemId ID of the item to count
   * @returns Item count
   */
  public getItemCount(itemId: string): number {
    return this.itemCounts.get(itemId) || 0;
  }

  /**
   * Get all items in the inventory
   * @returns Array of all items
   */
  public getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  /**
   * Get current inventory weight
   * @returns Total weight of all items
   */
  public getCurrentWeight(): number {
    let totalWeight = 0;
    for (const [itemId, item] of this.items.entries()) {
      const count = this.itemCounts.get(itemId) || 0;
      totalWeight += item.weight * count;
    }
    return totalWeight;
  }

  /**
   * Get number of unique items in inventory
   * @returns Count of unique items
   */
  public getUniqueItemCount(): number {
    return this.items.size;
  }

  /**
   * Get total count of all items in inventory
   * @returns Total item count
   */
  public getTotalItemCount(): number {
    let total = 0;
    for (const count of this.itemCounts.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Clear the entire inventory
   */
  public clear(): void {
    this.items.clear();
    this.itemCounts.clear();
  }
  
  // Getters and setters
  public getMaxWeight(): number {
    return this.maxWeight;
  }
  
  public setMaxWeight(weight: number): void {
    this.maxWeight = weight;
  }
  
  public getMaxSlots(): number {
    return this.maxSlots;
  }
  
  public setMaxSlots(slots: number): void {
    this.maxSlots = slots;
  }
} 