import { v4 as uuidv4 } from 'uuid';
import { XPNotificationData } from '../components/ui/XPNotification';

export interface LevelUpEvent {
  newLevel: number;
  skillPointsEarned: number;
  attributePointsEarned: number;
  perksUnlocked: number;
}

export const createXPNotification = (amount: number, reason: string): XPNotificationData => {
  return {
    id: uuidv4(),
    amount,
    reason
  };
};

export const createLevelUpEvent = (
  newLevel: number,
  skillPointsEarned: number,
  attributePointsEarned: number,
  perksUnlocked: number
): LevelUpEvent => {
  return {
    newLevel,
    skillPointsEarned,
    attributePointsEarned,
    perksUnlocked
  };
};
