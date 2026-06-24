import { describe, it, expect } from 'vitest';
import { resolveAchievements } from './useGameState';
import { achievements } from '../data/achievements';
import { campaignStepIds, stepKey } from '../data/campaign';

describe('resolveAchievements', () => {
  it('awards XP for newly unlocked achievements', () => {
    const completed = new Set<string>([stepKey('recon')]);
    const unlocked = new Set<string>();
    const { xp, level } = resolveAchievements(completed, 0, unlocked);

    const expectedXp = achievements
      .filter(a => a.id === 'first-command')
      .reduce((sum, a) => sum + a.xp, 0);
    expect(xp).toBe(expectedXp);
    expect(level).toBe(1);
    expect(unlocked.has('first-command')).toBe(true);
  });

  it('stacks multiple achievement XP rewards', () => {
    const completed = new Set<string>(campaignStepIds.map(stepKey));
    const unlocked = new Set<string>();
    const { xp } = resolveAchievements(completed, 0, unlocked);

    expect(xp).toBeGreaterThan(0);
    expect(unlocked.size).toBeGreaterThan(1);
    expect(unlocked.has('server-saved')).toBe(true);
  });
});
