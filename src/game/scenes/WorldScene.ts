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
    
    // Create a more atmospheric background
    const background = this.add.rectangle(0, 0, 2000, 2000, 0x111111);
    background.setOrigin(0);
    
    // Add atmospheric elements - distant city lights
    this.createAtmosphericBackground();
    
    // Create a dystopian city with our new textures
    this.createDystopianCity();
    
    // Create player with enhanced sprite
    this.player = new Player(this, 400, 300);
    
    // Setup camera
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
    this.cameras.main.setZoom(1);
    
    // Add a subtle vignette effect
    this.addVignetteEffect();
    
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
  
  private createAtmosphericBackground(): void {
    // Add a gradient background
    const gradientTexture = this.createGradientTexture();
    const background = this.add.image(0, 0, gradientTexture);
    background.setOrigin(0);
    background.setScale(2000 / 256, 2000 / 256);
    background.setDepth(-100);
    
    // Add distant lights
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, 2000);
      const y = Phaser.Math.Between(0, 2000);
      
      // Small distant light
      const lightSize = Phaser.Math.Between(1, 3);
      const light = this.add.rectangle(x, y, lightSize, lightSize, 0xAAFFFF, 0.3);
      light.setDepth(-90);
      
      // Add a subtle pulse animation
      this.tweens.add({
        targets: light,
        alpha: { from: 0.2, to: 0.4 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
    
    // Add distant city silhouette
    for (let x = 0; x < 2000; x += 40) {
      const height = Phaser.Math.Between(10, 80);
      const building = this.add.rectangle(x, 2000 - height, 30, height, 0x222222);
      building.setOrigin(0, 0);
      building.setDepth(-80);
      
      // Add some windows
      for (let y = 2000 - height + 10; y < 2000 - 5; y += 15) {
        if (Math.random() > 0.7) {
          const window = this.add.rectangle(x + 10, y, 4, 4, 0xFFFF99, 0.4);
          window.setDepth(-79);
        }
      }
    }
  }
  
  private createGradientTexture(): string {
    const textureKey = 'gradient-bg';
    
    // Don't recreate if exists
    if (this.textures.exists(textureKey)) {
      return textureKey;
    }
    
    // Create a gradient background texture
    const size = 256;
    const canvas = this.textures.createCanvas(textureKey, size, size);
    const ctx = canvas.getContext();
    
    // Create a gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#0A0A0F');
    gradient.addColorStop(0.4, '#111318');
    gradient.addColorStop(1, '#1A1A22');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add some "stars"
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 1;
      ctx.globalAlpha = Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    canvas.refresh();
    return textureKey;
  }
  
  private createDystopianCity(): void {
    // This will be replaced with a proper tilemap
    this.obstacles = this.physics.add.staticGroup();
    
    // Create a grid of buildings with our new textures
    const gridSize = 5;
    const cellSize = 350;
    
    // Building types
    const buildingTypes = [
      'building-corporate',
      'building-residential',
      'building-government'
    ];
    
    // Create a city grid
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (Math.random() > 0.3) { // 70% chance of a building
          const buildingX = 100 + x * cellSize;
          const buildingY = 100 + y * cellSize;
          
          // Select a building type
          const buildingType = Phaser.Utils.Array.GetRandom(buildingTypes);
          
          // Scale and size depend on building type
          let scaleX = 1;
          let scaleY = 1;
          
          switch (buildingType) {
            case 'building-corporate':
              scaleX = Phaser.Math.FloatBetween(0.8, 1.2);
              scaleY = Phaser.Math.FloatBetween(0.9, 1.4);
              break;
            case 'building-residential':
              scaleX = Phaser.Math.FloatBetween(1.0, 1.6);
              scaleY = Phaser.Math.FloatBetween(1.0, 1.3);
              break;
            case 'building-government':
              scaleX = Phaser.Math.FloatBetween(1.0, 1.3);
              scaleY = 1;
              break;
          }
          
          // Create the building with our new texture
          const building = this.add.image(buildingX, buildingY, buildingType);
          building.setScale(scaleX, scaleY);
          building.setOrigin(0.5);
          
          // Add a physics body for collision
          this.physics.add.existing(building, true);
          
          // Add to obstacles group
          this.obstacles.add(building);
          
          // Add some post-processing for dystopian feel
          if (Math.random() > 0.7) {
            // Add smoke particles from some buildings
            this.createSmokeEmitter(buildingX, buildingY - (building.height * scaleY) / 2);
          }
          
          // Add neon signs to some buildings
          if (Math.random() > 0.8) {
            this.createNeonSign(buildingX, buildingY);
          }
        }
      }
    }
    
    // Add roads using our road texture
    this.createRoads(gridSize, cellSize);
  }
  
  private createRoads(gridSize: number, cellSize: number): void {
    // Create horizontal roads
    for (let y = 0; y <= gridSize; y++) {
      const roadY = y * cellSize;
      const road = this.add.tileSprite(0, roadY, 2000, 50, 'road-texture');
      road.setOrigin(0, 0.5);
      road.setDepth(-10);
      
      // Add some details to the roads
      for (let x = 100; x < 2000; x += 200) {
        if (Math.random() > 0.7) {
          // Random road debris
          const debris = this.add.rectangle(x, roadY + Phaser.Math.Between(-20, 20), 
            Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10), 0x888888);
          debris.setDepth(-9);
        }
      }
    }
    
    // Create vertical roads
    for (let x = 0; x <= gridSize; x++) {
      const roadX = x * cellSize;
      const road = this.add.tileSprite(roadX, 0, 50, 2000, 'road-texture');
      road.setOrigin(0.5, 0);
      road.setDepth(-10);
      road.angle = 90;
    }
  }
  
  private createSmokeEmitter(x: number, y: number): void {
    const particles = this.add.particles(x, y, 'particle', {
      angle: { min: 240, max: 300 },
      speed: { min: 10, max: 30 },
      quantity: 1,
      lifespan: { min: 2000, max: 4000 },
      alpha: { start: 0.2, end: 0 },
      scale: { min: 0.5, max: 1.5 },
      tint: [0x666666, 0x777777, 0x888888],
      frequency: 500
    });
    
    particles.setDepth(10);
  }
  
  private createNeonSign(x: number, y: number): void {
    const signTexts = [
      'NEON', 'CYBER', 'CLUB', 'BAR', '2036', 'CAFE',
      'HOTEL', 'SYNTH', 'DATA', 'TECH', 'CORP'
    ];
    
    const colors = [0xFF3366, 0x33CCFF, 0x66FF33, 0xFFCC00];
    const text = Phaser.Utils.Array.GetRandom(signTexts);
    const color = Phaser.Utils.Array.GetRandom(colors);
    
    // Create neon sign text
    const sign = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '24px'
    });
    sign.setOrigin(0.5);
    sign.setTint(color);
    sign.setDepth(5);
    
    // Add glow effect
    sign.setShadow(0, 0, color, 8, false, true);
    
    // Flickering animation for neon effect
    this.tweens.add({
      targets: sign,
      alpha: { from: 0.7, to: 1 },
      duration: Phaser.Math.Between(500, 2000),
      yoyo: true,
      repeat: -1
    });
  }
  
  private addVignetteEffect(): void {
    // Create a vignette effect (darkened edges)
    const width = this.scale.width;
    const height = this.scale.height;
    
    const vignetteKey = 'vignette';
    const graphics = this.make.graphics({});
    
    // Create a radial gradient for the vignette
    const canvas = this.textures.createCanvas(vignetteKey, width, height);
    const ctx = canvas.getContext();
    
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.3,
      width / 2, height / 2, height * 0.7
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    canvas.refresh();
    
    // Add the vignette as an overlay
    const vignette = this.add.image(0, 0, vignetteKey);
    vignette.setOrigin(0);
    vignette.setScrollFactor(0);
    vignette.setDepth(1000);
    vignette.setAlpha(0.7);
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