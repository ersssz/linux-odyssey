import { describe, it, expect } from 'vitest';
import { achievements } from './achievements';
import { campaignStepIds, stepKey } from './campaign';

describe('achievements', () => {
  it('has unique ids', () => {
    const ids = achievements.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('server-saved requires the whole campaign', () => {
    const serverSaved = achievements.find(a => a.id === 'server-saved');
    expect(serverSaved).toBeDefined();
    expect(serverSaved?.condition({ completed: new Set(), xp: 0, level: 1 })).toBe(false);

    const allDone = new Set(campaignStepIds.map(stepKey));
    expect(serverSaved?.condition({ completed: allDone, xp: 0, level: 1 })).toBe(true);
  });

  it('chapter achievements unlock on their steps', () => {
    const guru = achievements.find(a => a.id === 'permission-guru');
    expect(
      guru?.condition({
        completed: new Set([stepKey('lockdown'), stepKey('makeexec')]),
        xp: 0,
        level: 1,
      })
    ).toBe(true);
    expect(guru?.condition({ completed: new Set([stepKey('lockdown')]), xp: 0, level: 1 })).toBe(
      false
    );
  });

  it('level achievements gate on level', () => {
    const l5 = achievements.find(a => a.id === 'level-5');
    expect(l5?.condition({ completed: new Set(), xp: 0, level: 4 })).toBe(false);
    expect(l5?.condition({ completed: new Set(), xp: 0, level: 5 })).toBe(true);
  });
});
