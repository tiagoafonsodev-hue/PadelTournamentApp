'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';
import { SocketProvider } from './SocketProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <SocketProvider>{children}</SocketProvider>
      </ToastProvider>
    </QueryProvider>
  );
}

export { useToast } from './ToastProvider';
export { useSocket } from './SocketProvider';
