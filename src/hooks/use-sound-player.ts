

'use client';

import type { SoundSettings } from '@/types';
import { useJournalStore } from './use-journal-store';

type SoundType = 'click' | 'notification' | 'error' | 'success' | 'undo' | 'redo' | 'delete';

const soundFiles: Record<SoundType, string> = {
  click: '/sounds/click.wav',
  notification: '/sounds/notification.wav',
  error: '/sounds/error.wav',
  success: '/sounds/success.wav',
  undo: '/sounds/undo.wav',
  redo: '/sounds/redo.wav',
  delete: '/sounds/crush.wav',
};

// This is no longer a hook, but a direct utility function.
// This prevents it from being part of the React render cycle.
export const playSound = (type: SoundType) => {
    // Get the latest state directly from the store.
    const state = useJournalStore.getState();
    const activeJournal = state.journals.find(j => j.id === state.activeJournalId);
    
    // Check global app settings if journal specific settings don't exist
    const soundSettings = activeJournal?.soundSettings || state.appSettings.soundSettings;

    if (!soundSettings || !soundSettings.enabled) return;

    const effectKey = type as keyof typeof soundSettings.effects;
    if (soundSettings.effects.hasOwnProperty(effectKey) && !soundSettings.effects[effectKey]) {
        return;
    }
    
    try {
      const audio = new Audio(soundFiles[type]);
      audio.volume = soundSettings.volume / 100;
      audio.play().catch(error => {
        // This can happen if the user hasn't interacted with the page yet. It's safe to ignore.
        console.warn(`Could not play sound (${type}):`, error.message);
      });
    } catch (error) {
      console.error(`Error creating or playing sound (${type}):`, error);
    }
};
