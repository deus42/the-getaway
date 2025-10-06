import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate Phaser engine into its own chunk (largest dependency ~1.1MB)
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }

          // React and Redux into vendor chunk
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/redux') ||
              id.includes('node_modules/@reduxjs')) {
            return 'vendor';
          }

          // Game core logic (combat, pathfinding, scenes)
          if (id.includes('/game/scenes/') ||
              id.includes('/game/combat/') ||
              id.includes('/game/world/pathfinding')) {
            return 'game-core';
          }

          // Content data (can be loaded separately)
          if (id.includes('/content/levels/') ||
              id.includes('/content/perks') ||
              id.includes('/content/ui') ||
              id.includes('/content/system')) {
            return 'game-content';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500, // Phaser alone is ~1.4MB, which is expected
  },
})
