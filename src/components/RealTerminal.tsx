/* eslint-disable react-refresh/only-export-components */
import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  getPersistentVmHost,
  createEphemeralVmHost,
  clearVisualTerminal,
  type V86Emulator,
  type BootStatus,
} from '../engine/realVmHost';

export { clearVisualTerminal };
export type { V86Emulator, BootStatus };

interface RealTerminalProps {
  onStatus?: (status: BootStatus, bootMs?: number) => void;
  onReady?: (emulator: V86Emulator) => void;
  className?: string;

  persist?: boolean;

  themeId?: string;

  vmId?: string;
}

export function RealTerminal({
  onStatus,
  onReady,
  className,
  persist = false,
  themeId = 'classic',
  vmId = 'default',
}: RealTerminalProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  const onStatusRef = useRef(onStatus);
  const onReadyRef = useRef(onReady);
  useLayoutEffect(() => {
    onStatusRef.current = onStatus;
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const mount = hostRef.current;
    if (!mount) return;
    const vm = persist ? getPersistentVmHost(vmId) : createEphemeralVmHost();
    mount.appendChild(vm.container);

    const doFit = () => {
      try {
        vm.fit.fit();
      } catch {
        void 0;
      }
    };
    doFit();
    const raf = requestAnimationFrame(doFit);
    const resize = new ResizeObserver(doFit);
    resize.observe(mount);

    if (vm.status === 'ready') {
      onStatusRef.current?.('ready', vm.bootMs);
      onReadyRef.current?.(vm.emulator);
    } else {
      onStatusRef.current?.('booting');
    }
    const unsubStatus = vm.onStatus((s, ms) => onStatusRef.current?.(s, ms));
    const unsubReady = vm.onReady(e => onReadyRef.current?.(e));
    vm.focus();

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      unsubStatus();
      unsubReady();

      if (vm.container.parentElement === mount) mount.removeChild(vm.container);
      if (!persist) vm.dispose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const vmInstance = persist ? getPersistentVmHost(vmId) : null;
    if (vmInstance) vmInstance.setTheme(themeId);
  }, [themeId, persist, vmId]);

  return <div ref={hostRef} className={className} />;
}
