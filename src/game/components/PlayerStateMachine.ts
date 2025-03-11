/**
 * Player states enum
 */
export enum PlayerState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  INTERACTING = 'interacting',
  ATTACKING = 'attacking',
  DAMAGED = 'damaged',
  DEAD = 'dead'
}

/**
 * State transition constraints
 */
interface StateTransitions {
  [key: string]: PlayerState[];
}

/**
 * Manages state and state transitions for the player
 */
export class PlayerStateMachine {
  private currentState: PlayerState = PlayerState.IDLE;
  private previousState: PlayerState | null = null;
  private stateData: any = {};
  
  // Define allowed state transitions
  private transitions: StateTransitions = {
    [PlayerState.IDLE]: [
      PlayerState.WALKING, 
      PlayerState.RUNNING, 
      PlayerState.INTERACTING, 
      PlayerState.ATTACKING,
      PlayerState.DAMAGED,
      PlayerState.DEAD
    ],
    [PlayerState.WALKING]: [
      PlayerState.IDLE, 
      PlayerState.RUNNING, 
      PlayerState.INTERACTING, 
      PlayerState.ATTACKING,
      PlayerState.DAMAGED,
      PlayerState.DEAD
    ],
    [PlayerState.RUNNING]: [
      PlayerState.IDLE, 
      PlayerState.WALKING, 
      PlayerState.ATTACKING,
      PlayerState.DAMAGED,
      PlayerState.DEAD
    ],
    [PlayerState.INTERACTING]: [
      PlayerState.IDLE, 
      PlayerState.WALKING,
      PlayerState.DAMAGED,
      PlayerState.DEAD
    ],
    [PlayerState.ATTACKING]: [
      PlayerState.IDLE, 
      PlayerState.WALKING, 
      PlayerState.RUNNING,
      PlayerState.DAMAGED,
      PlayerState.DEAD
    ],
    [PlayerState.DAMAGED]: [
      PlayerState.IDLE, 
      PlayerState.WALKING, 
      PlayerState.RUNNING,
      PlayerState.DEAD
    ],
    [PlayerState.DEAD]: [] // Cannot transition from dead
  };
  
  // Callbacks
  public onStateEnter: ((state: PlayerState, prevState: PlayerState | null) => void) | null = null;
  public onStateExit: ((state: PlayerState, nextState: PlayerState) => void) | null = null;
  public onStateUpdate: ((state: PlayerState, delta: number) => void) | null = null;
  
  /**
   * Creates a new state machine
   */
  constructor() {
    // No need for entity parameter
  }
  
  /**
   * Try to transition to a new state
   * @param newState State to transition to
   * @param stateData Optional data to pass to the state
   * @returns Whether transition was successful
   */
  public setState(newState: PlayerState, stateData: any = {}): boolean {
    // Check if transition is allowed
    if (!this.canTransitionTo(newState)) {
      console.warn(`Invalid state transition: ${this.currentState} -> ${newState}`);
      return false;
    }
    
    // Exit the current state
    if (this.onStateExit) {
      this.onStateExit(this.currentState, newState);
    }
    
    // Update state
    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateData = stateData;
    
    // Enter the new state
    if (this.onStateEnter) {
      this.onStateEnter(this.currentState, this.previousState);
    }
    
    return true;
  }
  
  /**
   * Update the current state
   * @param delta Time since last frame
   */
  public update(delta: number): void {
    if (this.onStateUpdate) {
      this.onStateUpdate(this.currentState, delta);
    }
  }
  
  /**
   * Check if a transition to a new state is allowed
   * @param newState State to check
   * @returns Whether transition is allowed
   */
  public canTransitionTo(newState: PlayerState): boolean {
    // Always allow transition to same state
    if (newState === this.currentState) return true;
    
    // Check transition table
    const allowedTransitions = this.transitions[this.currentState];
    return allowedTransitions?.includes(newState) || false;
  }
  
  /**
   * Get current state
   * @returns Current state
   */
  public getCurrentState(): PlayerState {
    return this.currentState;
  }
  
  /**
   * Get previous state
   * @returns Previous state or null
   */
  public getPreviousState(): PlayerState | null {
    return this.previousState;
  }
  
  /**
   * Check if in a specific state
   * @param state State to check
   * @returns Whether in that state
   */
  public isInState(state: PlayerState): boolean {
    return this.currentState === state;
  }
  
  /**
   * Get state data
   * @returns Current state data
   */
  public getStateData(): any {
    return this.stateData;
  }
} 