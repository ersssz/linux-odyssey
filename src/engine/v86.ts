import wasmUrl from 'v86/build/v86.wasm?url';

const BASE = import.meta.env.BASE_URL;

export const v86Assets = {
  wasm: wasmUrl,
  bios: `${BASE}v86/seabios.bin`,
  vgaBios: `${BASE}v86/vgabios.bin`,
  bzimage: `${BASE}v86/buildroot-bzimage68.bin`,
};

export const v86Cmdline = 'tsc=reliable mitigations=off random.trust_cpu=on';

export function isRealLinuxSupported(): boolean {
  return (
    typeof WebAssembly === 'object' &&
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof crossOriginIsolated !== 'undefined' &&
    crossOriginIsolated === true
  );
}

export function realLinuxUnsupportedReason(): string | null {
  if (typeof WebAssembly !== 'object') return 'WebAssembly недоступен в этом браузере';
  if (typeof SharedArrayBuffer === 'undefined') return 'SharedArrayBuffer недоступен';
  if (typeof crossOriginIsolated === 'undefined' || !crossOriginIsolated)
    return 'Страница не cross-origin isolated (нет заголовков COOP/COEP)';
  return null;
}
