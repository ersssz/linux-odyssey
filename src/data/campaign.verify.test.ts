import { describe, it, expect } from 'vitest';
import { campaign, type CampaignStep } from './campaign';

const allSteps: CampaignStep[] = campaign.flatMap(c => c.steps);
const byId = (id: string): CampaignStep => {
  const s = allSteps.find(st => st.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
};

describe('step verify gates', () => {
  const cases: [string, string, string][] = [
    ['grepout', 'ERROR boom\nERROR crash\n', 'whatever\n'],
    ['countlines', '2\n', '0\n'],
    ['invert', 'INFO ok\n', 'ERROR boom\n'],
    ['findlogs', './logs/a.log\n./logs/b.log\n', 'nope\n'],
    ['wc', '4 app.log\n', '9\n'],
    ['head', 'a\nb\n', 'a\nb\nc\nd\n'],
    ['sortit', 'alice\nalice\nbob\ncarol\n', 'carol\nalice\nbob\nalice\n'],
    ['uniqit', 'alice\nbob\ncarol\n', 'alice\n'],
    ['pipecount', '2\n', '7\n'],
    ['multipipe', '2\n', '5\n'],
    ['sedrepl', 'FIXED boom\nINFO ok\n', 'ERROR boom\n'],
    ['awkcol', 'ERROR\nINFO\n', 'ERROR boom\nINFO ok\n'],
    ['cutfield', 'root\ndaemon\nbin\n', 'root:x:0:0\n'],
    ['trupper', 'ERROR BOOM\n', 'error boom\n'],
    ['tarcreate', 'logs/\x00\x00logs/a.log\x00', 'not a tar\n'],
    ['netreport', '1: lo: <LOOPBACK,UP>\n', 'x\n'],
  ];

  for (const [id, good, bad] of cases) {
    it(`${id}: accepts correct output, rejects faked`, () => {
      const v = byId(id).verify;
      expect(v, `step ${id} must have a verify gate`).toBeDefined();
      expect(v!.ok(good)).toBe(true);
      expect(v!.ok(bad)).toBe(false);
    });
  }

  it('content-producing steps all have a verify gate', () => {
    const mustHave = [
      'grepout',
      'sedrepl',
      'awkcol',
      'cutfield',
      'trupper',
      'pipecount',
      'multipipe',
      'tarcreate',
    ];
    expect(mustHave.every(id => byId(id).verify)).toBe(true);
  });
});
