/**
 * Component that manages health for entities
 */
export class HealthComponent {
  private currentHealth: number;
  private maxHealth: number;
  private regenRate: number = 0;
  
  // Event callbacks
  public onDamage: ((amount: number, currentHealth: number) => void) | null = null;
  public onHeal: ((amount: number, currentHealth: number) => void) | null = null;
  public onDeath: (() => void) | null = null;

  /**
   * Creates a new health component
   * @param initialHealth Initial health value
   * @param maxHealth Maximum health capacity
   * @param regenRate Optional health regeneration rate per tick
   */
  constructor(initialHealth: number, maxHealth: number, regenRate: number = 0) {
    this.currentHealth = initialHealth;
    this.maxHealth = maxHealth;
    this.regenRate = regenRate;
  }

  /**
   * Deal damage to the entity
   * @param amount Amount of damage to deal
   * @returns Remaining health after damage
   */
  public takeDamage(amount: number): number {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    
    // Trigger damage callback
    if (this.onDamage) {
      this.onDamage(amount, this.currentHealth);
    }
    
    // Check for death
    if (previousHealth > 0 && this.currentHealth <= 0) {
      if (this.onDeath) {
        this.onDeath();
      }
    }
    
    return this.currentHealth;
  }

  /**
   * Heal the entity
   * @param amount Amount to heal
   * @returns New health after healing
   */
  public heal(amount: number): number {
    const healedAmount = Math.min(amount, this.maxHealth - this.currentHealth);
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    
    // Trigger heal callback
    if (this.onHeal && healedAmount > 0) {
      this.onHeal(healedAmount, this.currentHealth);
    }
    
    return this.currentHealth;
  }

  /**
   * Set health to maximum
   */
  public fullHeal(): void {
    const healAmount = this.maxHealth - this.currentHealth;
    if (healAmount > 0) {
      this.heal(healAmount);
    }
  }

  /**
   * Set maximum health
   * @param maxHealth New maximum health
   * @param adjustCurrent Whether to adjust current health proportionally
   */
  public setMaxHealth(maxHealth: number, adjustCurrent: boolean = false): void {
    if (adjustCurrent && this.maxHealth > 0) {
      // Adjust current health proportionally to the new max
      const ratio = this.currentHealth / this.maxHealth;
      this.maxHealth = maxHealth;
      this.currentHealth = Math.round(this.maxHealth * ratio);
    } else {
      this.maxHealth = maxHealth;
      // Cap current health to new max
      this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
    }
  }

  /**
   * Health regeneration method to be called periodically
   */
  public regenerate(): void {
    if (this.regenRate > 0 && this.currentHealth < this.maxHealth) {
      this.heal(this.regenRate);
    }
  }

  /**
   * Check if entity is dead (health <= 0)
   * @returns Whether entity is dead
   */
  public isDead(): boolean {
    return this.currentHealth <= 0;
  }

  /**
   * Get current health percentage
   * @returns Health percentage between 0-1
   */
  public getHealthPercentage(): number {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }

  // Getters
  public getCurrentHealth(): number {
    return this.currentHealth;
  }
  
  public getMaxHealth(): number {
    return this.maxHealth;
  }
  
  public getRegenRate(): number {
    return this.regenRate;
  }
  
  // Setters
  public setRegenRate(rate: number): void {
    this.regenRate = rate;
  }
  
  public setCurrentHealth(health: number): void {
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, health));
    
    if (oldHealth > 0 && this.currentHealth <= 0 && this.onDeath) {
      this.onDeath();
    }
  }
} 