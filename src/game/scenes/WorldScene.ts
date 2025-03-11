import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC, DialogTree } from '../entities/NPC';
import { DialogSystem } from '../systems/DialogSystem';
import { UISystem } from '../systems/UISystem';

export class WorldScene extends Phaser.Scene {
  // Core systems
  private player!: Player;
  private dialogSystem!: DialogSystem;
  private uiSystem!: UISystem;
  
  // Game objects
  private npcs: NPC[] = [];
  private obstacles: Phaser.Physics.Arcade.StaticGroup | null = null;
  private items: Phaser.Physics.Arcade.Group | null = null;
  
  // Zones
  private dangerZones: Phaser.GameObjects.Zone[] = [];
  private locationZones: { zone: Phaser.GameObjects.Zone, name: string }[] = [];
  
  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    // Set up world boundaries (will be replaced with tilemap dimensions)
    this.physics.world.setBounds(0, 0, 2000, 2000);
    
    // Create a simple background (will be replaced with tilemap)
    const background = this.add.rectangle(0, 0, 2000, 2000, 0x333333);
    background.setOrigin(0);
    
    // Create simple "buildings" - will be replaced with tilemap
    this.createSimpleCity();
    
    // Create player
    this.player = new Player(this, 400, 300);
    
    // Setup camera
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
    this.cameras.main.setZoom(1);
    
    // Create systems
    this.dialogSystem = new DialogSystem(this);
    this.uiSystem = new UISystem(this, this.player);
    
    // Create NPCs with dialog trees
    this.createNPCs();
    
    // Create items
    this.createItems();
    
    // Create location zones
    this.createLocationZones();
    
    // Create danger zones (e.g., patrol areas)
    this.createDangerZones();
    
    // Set up physics
    this.setupPhysics();
    
    // Initial UI notification
    this.uiSystem.setObjective('Find the resistance contact');
    this.uiSystem.showNotification('Press SPACE to interact with NPCs', 5000);
    
    // Event listeners
    this.events.on('shutdown', this.shutdown, this);
    
    // Debug text to verify scene is loaded correctly
    console.log('WorldScene loaded successfully');
  }
  
  update(time: number, delta: number): void {
    // Update player
    this.player.update(time, delta);
    
    // Update NPCs
    this.npcs.forEach(npc => {
      npc.update(time, delta);
      
      // Check for interaction with NPCs
      if (npc.isPlayerInRange(this.player) && this.player.isInteractKeyJustDown() && !this.dialogSystem.isDialogActive()) {
        this.startDialog(npc);
      }
    });
    
    // Update UI
    this.uiSystem.update();
    
    // Check location zones
    this.checkLocationZones();
    
    // Check danger zones
    this.checkDangerZones();
  }
  
  private createSimpleCity(): void {
    // This will be replaced with a proper tilemap
    this.obstacles = this.physics.add.staticGroup();
    
    // Create a grid of "buildings"
    const gridSize = 5;
    const cellSize = 350;
    const buildingColors = [0x555555, 0x666666, 0x777777]; // Different building colors
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (Math.random() > 0.3) { // 70% chance of a building
          const buildingX = 100 + x * cellSize;
          const buildingY = 100 + y * cellSize;
          const width = Phaser.Math.Between(50, 200);
          const height = Phaser.Math.Between(50, 200);
          const color = Phaser.Utils.Array.GetRandom(buildingColors);
          
          const building = this.add.rectangle(buildingX, buildingY, width, height, color);
          
          // Add some details to buildings
          this.add.rectangle(
            buildingX, 
            buildingY + height / 2 - 10, 
            width * 0.8, 
            10, 
            0x000000, 
            0.3
          );
          
          // Add to obstacles group
          this.obstacles.add(building);
          
          // Add shadows for depth
          const shadow = this.add.rectangle(
            buildingX + 10, 
            buildingY + 10, 
            width, 
            height, 
            0x000000, 
            0.5
          );
          shadow.setDepth(-1);
        }
      }
    }
    
    // Add some roads
    for (let x = 0; x < gridSize + 1; x++) {
      const roadX = x * cellSize;
      const road = this.add.rectangle(roadX, 1000, 30, 2000, 0x333333);
      road.setDepth(-2);
      
      // Add road lines
      const lineY = 100;
      for (let y = 0; y < 20; y++) {
        const line = this.add.rectangle(roadX, lineY + y * 100, 5, 30, 0xffffff, 0.5);
        line.setDepth(-1);
      }
    }
    
    for (let y = 0; y < gridSize + 1; y++) {
      const roadY = y * cellSize;
      const road = this.add.rectangle(1000, roadY, 2000, 30, 0x333333);
      road.setDepth(-2);
      
      // Add road lines
      const lineX = 100;
      for (let x = 0; x < 20; x++) {
        const line = this.add.rectangle(lineX + x * 100, roadY, 30, 5, 0xffffff, 0.5);
        line.setDepth(-1);
      }
    }
  }
  
  private createNPCs(): void {
    // Create a few NPCs with dialog trees
    const resistanceFighterDialog: DialogTree = {
      'start': {
        text: "Hey, you! Yes, you. We need people like you. The dictator's men have been cracking down hard lately. If you're interested in helping the resistance, find me later at the old warehouse.",
        choices: [
          { 
            text: "Tell me more about the resistance.", 
            nextId: "resistance-info" 
          },
          { 
            text: "Where is this warehouse?", 
            nextId: "warehouse-location" 
          },
          { 
            text: "I'm not interested. Too dangerous.", 
            nextId: "decline" 
          }
        ]
      },
      'resistance-info': {
        text: "We're a network of citizens fighting against the dictator's regime. We sabotage their operations, help people escape north to Canada, and gather intelligence. Every day we grow stronger as more people see the truth.",
        nextId: "join-question"
      },
      'warehouse-location': {
        text: "It's in the eastern district, near the old industrial zone. Look for a building with a faded red star painted on the side. Knock three times, then twice more. But be careful—regime patrols are everywhere.",
        nextId: "join-question"
      },
      'join-question': {
        text: "So, are you with us? We need someone for a job tonight.",
        choices: [
          { 
            text: "I'm in. What's the job?", 
            nextId: "accept-mission",
            action: () => {
              this.uiSystem.setObjective('Meet at the warehouse tonight');
              this.uiSystem.showNotification('New objective: Meet at the warehouse tonight', 3000);
            }
          },
          { 
            text: "I need time to think about it.", 
            nextId: "think-about-it" 
          }
        ]
      },
      'decline': {
        text: "I understand. These are dangerous times. Just remember, neutrality only helps the oppressor, never the victim. If you change your mind, you know where to find me.",
        nextId: "end"
      },
      'accept-mission': {
        text: "Good. We need to intercept a supply convoy tonight. Meet me at the warehouse at midnight, and I'll brief you on the details. Don't be late, and don't tell anyone where you're going.",
        nextId: "end"
      },
      'think-about-it': {
        text: "Fair enough. But don't take too long. The offer won't be open forever, and neither will our escape routes north if the regime has its way. Come find me when you've made up your mind.",
        nextId: "end"
      },
      'end': {
        text: "Stay safe out there. The walls have ears—and the regime has eyes everywhere."
      }
    };
    
    const smugglerDialog: DialogTree = {
      'start': {
        text: "Psst... looking to cross the border? I know some people who can help, for the right price. The northern checkpoints are heavily guarded, but we know the blind spots.",
        choices: [
          { 
            text: "How much would it cost?", 
            nextId: "cost" 
          },
          { 
            text: "Is it dangerous?", 
            nextId: "danger" 
          },
          { 
            text: "I'm not interested.", 
            nextId: "end" 
          }
        ]
      },
      'cost': {
        text: "For you? 5000 credits. Half up front, half when we get you across. That includes fake IDs, transport, and bribes for any guards we might encounter. Can't go lower—regime's tightened security recently.",
        nextId: "consider"
      },
      'danger': {
        text: "Everything's dangerous these days, friend. But we've moved hundreds of people north without incident. The real danger is staying here, waiting for the regime to come knocking on your door one night.",
        nextId: "consider"
      },
      'consider': {
        text: "So what do you say? Ready to leave this hellhole behind? I've got a group heading out in three days.",
        choices: [
          { 
            text: "I'll need to gather the money first.", 
            nextId: "gather-money",
            action: () => {
              this.uiSystem.setObjective('Find 5000 credits for the smuggler');
              this.uiSystem.showNotification('New objective: Find 5000 credits', 3000);
            }
          },
          { 
            text: "I have other business here first.", 
            nextId: "other-business" 
          }
        ]
      },
      'gather-money': {
        text: "Smart. Don't carry it all at once—too risky with patrols stopping people randomly. When you've got it, come find me at the old marina after dark. Ask for Jensen at the bait shop.",
        nextId: "end"
      },
      'other-business': {
        text: "Your call. Just don't wait too long. Word is the regime's planning something big up north. Border might close completely soon. Offer stands until then—if you change your mind, I'm usually around this area.",
        nextId: "end"
      },
      'end': {
        text: "Keep your head down. And remember—you never met me, we never talked."
      }
    };
    
    const refugeeDialog: DialogTree = {
      'start': {
        text: "Please, have you seen my family? We got separated during the last raid. The militia came in the night, took everyone they suspected of being part of the resistance. I barely escaped...",
        choices: [
          { 
            text: "I'll keep an eye out for them. What do they look like?", 
            nextId: "help-description",
            action: () => {
              this.uiSystem.showNotification('New side quest: Find the refugee\'s family', 3000);
            }
          },
          { 
            text: "The resistance might be able to help you.", 
            nextId: "resistance-suggestion" 
          },
          { 
            text: "I'm sorry, I can't help right now.", 
            nextId: "end" 
          }
        ]
      },
      'help-description': {
        text: "My husband is tall with a beard, wearing a green jacket. My daughter is eight, with braided hair. They were taken toward the eastern detention center. I'd go myself, but I'm injured... Please, if you find anything...",
        nextId: "promise-help"
      },
      'resistance-suggestion': {
        text: "The resistance? You know them? I've heard whispers... Do you think they could help find my family? Or get a message to them? I... I don't know who to trust anymore.",
        nextId: "explain-resistance"
      },
      'promise-help': {
        text: "Thank you. I'll be here, or at the old church when it's safe. My name is Elena. Please, any information at all would help. I just need to know they're alive.",
        nextId: "end"
      },
      'explain-resistance': {
        text: "I've heard they've been helping families reunite, getting people out of detention centers. If anyone can find your family, it's them. There's a contact in the eastern district who might help.",
        nextId: "promise-help",
        choices: [
          {
            text: "Continue",
            nextId: "promise-help",
            action: () => {
              this.uiSystem.showNotification('New side quest: Find the refugee\'s family', 3000);
            }
          }
        ]
      },
      'end': {
        text: "Please... if you hear anything... anything at all..."
      }
    };
    
    // Create the NPC instances
    const resistanceFighter = new NPC(
      this, 500, 200, 'player', 
      'Resistance Fighter', 'Resistance', 
      resistanceFighterDialog
    );
    
    const smuggler = new NPC(
      this, 800, 650, 'player',
      'Smuggler', 'Neutral',
      smugglerDialog
    );
    
    const refugee = new NPC(
      this, 300, 900, 'player',
      'Refugee', 'Civilian',
      refugeeDialog
    );
    
    // Set up patrol for the smuggler
    smuggler.setupPatrol([
      new Phaser.Math.Vector2(800, 650),
      new Phaser.Math.Vector2(900, 650),
      new Phaser.Math.Vector2(900, 750),
      new Phaser.Math.Vector2(800, 750)
    ]);
    
    // Add NPCs to the array
    this.npcs = [resistanceFighter, smuggler, refugee];
  }
  
  private createItems(): void {
    // Create collectible items
    this.items = this.physics.add.group();
    
    // Add some items
    const itemPositions = [
      { x: 250, y: 400, type: 'medkit' },
      { x: 700, y: 300, type: 'ammo' },
      { x: 900, y: 900, type: 'food' }
    ];
    
    itemPositions.forEach(item => {
      // Use the appropriate item texture
      const textureKey = `${item.type}-texture`;
      const itemSprite = this.physics.add.sprite(item.x, item.y, textureKey);
      this.items!.add(itemSprite);
      
      // Add item type as data
      itemSprite.setData('type', item.type);
      
      // Add glow effect
      this.tweens.add({
        targets: itemSprite,
        alpha: 0.7,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Add floating effect
      this.tweens.add({
        targets: itemSprite,
        y: item.y - 10,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }
  
  private createLocationZones(): void {
    // Create zones for different locations in the city
    const locations = [
      { x: 400, y: 300, width: 300, height: 300, name: 'Downtown Miami' },
      { x: 1000, y: 400, width: 400, height: 400, name: 'Eastern District' },
      { x: 600, y: 1000, width: 500, height: 300, name: 'Harbor District' },
      { x: 1500, y: 1500, width: 400, height: 400, name: 'Industrial Zone' }
    ];
    
    locations.forEach(location => {
      const zone = this.add.zone(location.x, location.y, location.width, location.height);
      this.locationZones.push({ zone, name: location.name });
    });
  }
  
  private createDangerZones(): void {
    // Create zones where enemies or danger might be present
    const dangerAreas = [
      { x: 1200, y: 300, radius: 200 },
      { x: 800, y: 1200, radius: 150 },
      { x: 1700, y: 1000, radius: 250 }
    ];
    
    dangerAreas.forEach(area => {
      const zone = this.add.zone(area.x, area.y, area.radius * 2, area.radius * 2);
      this.dangerZones.push(zone);
      
      // Visualize the danger zone (would be invisible in real game)
      const visual = this.add.circle(area.x, area.y, area.radius, 0xff0000, 0.1);
      visual.setDepth(-1);
    });
  }
  
  private setupPhysics(): void {
    // Collide player with obstacles
    if (this.obstacles) {
      this.physics.add.collider(this.player, this.obstacles);
    }
    
    // Collide NPCs with obstacles
    if (this.obstacles) {
      this.npcs.forEach(npc => {
        this.physics.add.collider(npc, this.obstacles!);
      });
    }
    
    // Overlap with items
    if (this.items) {
      // Use a direct function with the proper parameter types for overlap
      this.physics.add.overlap(
        this.player, 
        this.items, 
        (_obj1, obj2) => {
          // Type guard to ensure we have a GameObject
          if (obj2 instanceof Phaser.GameObjects.GameObject) {
            this.collectItem(obj2);
          }
        },
        undefined, 
        this
      );
    }
  }
  
  private collectItem(item: Phaser.GameObjects.GameObject): void {
    const itemType = item.getData('type');
    
    // Handle different item types
    switch (itemType) {
      case 'medkit':
        (this.player as Player).heal(25);
        this.uiSystem.showNotification('Found a medkit (+25 health)', 2000);
        break;
      case 'ammo':
        this.uiSystem.showNotification('Found ammunition', 2000);
        break;
      case 'food':
        this.uiSystem.showNotification('Found food supplies', 2000);
        break;
    }
    
    // Remove the item
    item.destroy();
  }
  
  private checkLocationZones(): void {
    // Check if player entered a new location zone
    this.locationZones.forEach(locationZone => {
      const playerBounds = this.player.getBounds();
      const zoneBounds = locationZone.zone.getBounds();
      
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, zoneBounds)) {
        // Check if the location text needs updating
        if (this.uiSystem) {
          this.uiSystem.setLocation(locationZone.name);
        }
      }
    });
  }
  
  private checkDangerZones(): void {
    // Check if player is in a danger zone
    let inDanger = false;
    
    this.dangerZones.forEach(zone => {
      const playerBounds = this.player.getBounds();
      const zoneBounds = zone.getBounds();
      
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, zoneBounds)) {
        inDanger = true;
        
        // Small chance of enemy encounter in danger zone
        if (Phaser.Math.Between(1, 1000) <= 2) { // 0.2% chance per frame
          this.enemyEncounter();
        }
      }
    });
    
    // Visual indicator of danger
    if (inDanger) {
      this.cameras.main.setBackgroundColor(0x330000);
    } else {
      this.cameras.main.setBackgroundColor(0x000000);
    }
  }
  
  private enemyEncounter(): void {
    // Simulate an enemy encounter
    this.player.takeDamage(10);
    this.uiSystem.showNotification('Ambushed by regime patrol! -10 health', 3000);
    
    // Shake the camera
    this.cameras.main.shake(500, 0.01);
  }
  
  private startDialog(npc: NPC): void {
    if (!this.dialogSystem) return;
    
    // Start dialog with the NPC
    const dialogId = npc.startDialog();
    this.dialogSystem.startDialog(npc.getDialogTree(), npc.getName(), dialogId);
  }
  
  private shutdown(): void {
    // Clean up event listeners
    this.events.off('shutdown');
    
    // Clean up systems
    if (this.dialogSystem) {
      this.dialogSystem.destroy();
    }
    
    if (this.uiSystem) {
      this.uiSystem.destroy();
    }
  }
} 