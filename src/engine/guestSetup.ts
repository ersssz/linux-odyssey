import type { V86Emulator } from '../components/RealTerminal';

const GUEST_RC = [
  'sudo() { "$@"; }',

  '_ody_edit() {',
  '  f="${1:-untitled.txt}";',
  '  case "$f" in',
  '    /*) ;;',
  '    *) f="$(pwd)/$f" ;;',
  '  esac;',
  '  printf "%s" "$f" > /mnt/.edit-req;',
  '}',
  'alias nano=_ody_edit',
  'alias vi=_ody_edit',
  'alias vim=_ody_edit',

  'export ODY_SHELL=$$',

  '( while true; do',

  '  if [ -f /mnt/.snap-req ]; then',
  '    snaptoken=$(cat /mnt/.snap-req 2>/dev/null); rm -f /mnt/.snap-req;',
  '    {',
  '      echo "$snaptoken";',
  '      readlink /proc/$ODY_SHELL/cwd 2>/dev/null || pwd;',
  '      echo "<<<TREE>>>";',
  '      ls -laR "$(readlink /proc/$ODY_SHELL/cwd 2>/dev/null || pwd)" 2>/dev/null;',
  '      echo "<<<PROCS>>>";',
  '      for p in /proc/[0-9]*/; do pid=${p#/proc/}; pid=${pid%/}; echo "$pid $(cat $p/comm 2>/dev/null)"; done;',
  '      echo "<<<VICTIMS>>>";',
  '      cat /mnt/.victims 2>/dev/null;',
  '    } > /mnt/.snap-tmp 2>&1;',
  '    mv /mnt/.snap-tmp /mnt/.snap-out;',
  '  fi;',

  '  if [ -f /mnt/.io-req ]; then',
  '    ioreq=$(cat /mnt/.io-req 2>/dev/null); rm -f /mnt/.io-req;',
  '    iotok=${ioreq%% *}; iorest=${ioreq#* }; ioop=${iorest%% *}; iopath=${iorest#* };',
  '    if [ "$ioop" = READ ]; then',
  '      { echo "$iotok"; cat "$iopath" 2>/dev/null; } > /mnt/.io-tmp 2>&1; mv /mnt/.io-tmp /mnt/.io-out;',
  '    elif [ "$ioop" = WRITE ]; then',
  '      cp /mnt/.io-data "$iopath" 2>/dev/null; echo "$iotok ok" > /mnt/.io-tmp; mv /mnt/.io-tmp /mnt/.io-out;',
  '    elif [ "$ioop" = EXEC ]; then',
  '      { echo "$iotok"; eval "$iopath"; } > /mnt/.io-tmp 2>&1; mv /mnt/.io-tmp /mnt/.io-out;',
  '    fi;',
  '  fi;',

  '  sleep 0.1;',
  'done ) &',

  'clear',
  "printf '\\033[1;32mWelcome to Linux Odyssey (Alpine x86_64)\\033[0m\\n'",
  "printf '\\n'",
  "printf ' * Documentation:  https://linux-odyssey.local/docs\\n'",
  "printf ' * Support:        https://linux-odyssey.local/support\\n'",
  "printf '\\n'",
  'printf \'Last login: %s from 192.168.1.42\\n\\n\' "$(date)"',

  'printf ody-ready > /mnt/.ody-ready',
  '',
].join('\n');

export async function applyGuestSetup(emulator: V86Emulator): Promise<void> {
  await emulator.create_file('.ody-ready', new TextEncoder().encode(''));
  await emulator.create_file('odyssey-rc.sh', new TextEncoder().encode(GUEST_RC));
  emulator.serial0_send('. /mnt/odyssey-rc.sh\n');

  const dec = new TextDecoder();
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 200));
    try {
      if (dec.decode(await emulator.read_file('.ody-ready')).includes('ody-ready')) return;
    } catch {
      void 0;
    }
  }
}
