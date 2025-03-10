import Phaser from 'phaser';
import { DialogTree } from '../entities/NPC';

export class DialogSystem {
  private scene: Phaser.Scene;
  private dialogBox!: Phaser.GameObjects.Container;
  private dialogText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private continueText!: Phaser.GameObjects.Text;
  private choiceButtons!: Phaser.GameObjects.Container;
  private currentDialog: DialogTree | null = null;
  private currentDialogId: string | null = null;
  private isActive: boolean = false;
  private currentSpeakerName: string = '';
  private onDialogEnd: (() => void) | null = null;
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createDialogUI();
  }
  
  private createDialogUI(): void {
    // Create a container for the dialog box
    this.dialogBox = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - 150
    );
    this.dialogBox.setDepth(1000); // Make sure dialog is above everything
    this.dialogBox.setScrollFactor(0); // Fix to camera
    this.dialogBox.setVisible(false);
    
    // Background panel
    const background = this.scene.add.rectangle(
      0, 0, 
      this.scene.cameras.main.width * 0.8, 
      120, 0x000000, 0.8
    );
    background.setStrokeStyle(2, 0xff3b3b);
    
    // Name background
    const nameBg = this.scene.add.rectangle(
      -background.width / 2 + 80, 
      -background.height / 2 - 15,
      150, 30, 0xff3b3b, 0.9
    );
    
    // Dialog text
    this.dialogText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      align: 'left',
      wordWrap: { width: this.scene.cameras.main.width * 0.75 }
    });
    this.dialogText.setOrigin(0.5);
    
    // Speaker name text
    this.nameText = this.scene.add.text(
      -background.width / 2 + 80, 
      -background.height / 2 - 15, 
      '', 
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.nameText.setOrigin(0.5);
    
    // Continue prompt
    this.continueText = this.scene.add.text(
      background.width / 2 - 20, 
      background.height / 2 - 20, 
      '[Space]', 
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#aaaaaa'
      }
    );
    this.continueText.setOrigin(1);
    
    // Choice buttons container
    this.choiceButtons = this.scene.add.container(0, 40);
    
    // Add everything to the container
    this.dialogBox.add([background, nameBg, this.dialogText, this.nameText, this.continueText, this.choiceButtons]);
    
    // Add keyboard input
    if (this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-SPACE', this.handleContinue, this);
    }
  }
  
  public startDialog(dialogTree: DialogTree, speakerName: string, startId: string = 'start', onEnd?: () => void): void {
    this.currentDialog = dialogTree;
    this.currentDialogId = startId;
    this.isActive = true;
    this.currentSpeakerName = speakerName;
    this.onDialogEnd = onEnd || null;
    
    // Show the dialog box
    this.dialogBox.setVisible(true);
    
    // Display the first dialog line
    this.displayDialogLine();
  }
  
  private displayDialogLine(): void {
    if (!this.currentDialog || !this.currentDialogId) return;
    
    const dialogLine = this.currentDialog[this.currentDialogId];
    if (!dialogLine) {
      this.endDialog();
      return;
    }
    
    // Set the dialog text
    this.dialogText.setText(dialogLine.text);
    
    // Set the speaker name
    this.nameText.setText(this.currentSpeakerName);
    
    // Clear previous choice buttons
    this.choiceButtons.removeAll(true);
    
    // Show choices if any
    if (dialogLine.choices && dialogLine.choices.length > 0) {
      this.continueText.setVisible(false);
      this.displayChoices(dialogLine.choices);
    } else {
      this.continueText.setVisible(true);
    }
    
    // Typewriter effect for text
    this.typewriterEffect(dialogLine.text);
  }
  
  private typewriterEffect(text: string): void {
    const originalText = text;
    let currentText = '';
    let currentIndex = 0;
    
    // Initially set empty text
    this.dialogText.setText('');
    
    // Clear any existing timer
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
      this.typewriterTimer = null;
    }
    
    // Create typewriter effect
    this.typewriterTimer = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        currentIndex++;
        currentText = originalText.substring(0, currentIndex);
        this.dialogText.setText(currentText);
        
        // Stop when we've reached the end
        if (currentIndex === originalText.length) {
          if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
          }
        }
      },
      callbackScope: this,
      repeat: originalText.length - 1,
      startAt: 0,
    });
    
    // Allow for skipping the animation
    this.scene.input.once('pointerdown', () => {
      if (this.typewriterTimer) {
        this.typewriterTimer.remove();
        this.typewriterTimer = null;
      }
      this.dialogText.setText(originalText);
    });
  }
  
  private displayChoices(choices: { text: string; nextId?: string; action?: () => void }[]): void {
    choices.forEach((choice, index) => {
      const button = this.scene.add.text(
        0, 
        index * 30, 
        choice.text, 
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#444444',
          padding: {
            left: 10,
            right: 10,
            top: 5,
            bottom: 5
          }
        }
      );
      
      button.setInteractive({ useHandCursor: true });
      
      // Hover effects
      button.on('pointerover', () => {
        button.setStyle({ color: '#ff3b3b' });
      });
      
      button.on('pointerout', () => {
        button.setStyle({ color: '#ffffff' });
      });
      
      // Click handler
      button.on('pointerdown', () => {
        // Execute action if any
        if (choice.action) {
          choice.action();
        }
        
        // Go to next dialog line if specified
        if (choice.nextId) {
          this.currentDialogId = choice.nextId;
          this.displayDialogLine();
        } else {
          this.endDialog();
        }
      });
      
      this.choiceButtons.add(button);
    });
    
    // Center the buttons
    const totalHeight = choices.length * 30;
    this.choiceButtons.setPosition(0, this.dialogText.y + 30);
    
    // Position each button for better alignment
    let buttonY = -totalHeight / 2;
    this.choiceButtons.each((button: Phaser.GameObjects.Text) => {
      button.setPosition(0, buttonY);
      buttonY += 30;
      return true;
    });
  }
  
  private handleContinue(): void {
    if (!this.isActive) return;
    
    const dialogLine = this.currentDialog?.[this.currentDialogId || ''];
    if (!dialogLine) {
      this.endDialog();
      return;
    }
    
    // If we have choices, don't continue on space
    if (dialogLine.choices && dialogLine.choices.length > 0) return;
    
    // Go to next dialog line if specified
    if (dialogLine.nextId) {
      this.currentDialogId = dialogLine.nextId;
      this.displayDialogLine();
    } else {
      this.endDialog();
    }
  }
  
  private endDialog(): void {
    this.isActive = false;
    this.dialogBox.setVisible(false);
    this.currentDialog = null;
    this.currentDialogId = null;
    
    // Execute onEnd callback if provided
    if (this.onDialogEnd) {
      this.onDialogEnd();
    }
  }
  
  public isDialogActive(): boolean {
    return this.isActive;
  }
  
  public destroy(): void {
    // Clean up event listeners
    if (this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-SPACE', this.handleContinue, this);
    }
    
    // Clean up timer
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }
    
    // Destroy UI components
    this.dialogBox.destroy();
  }
} 