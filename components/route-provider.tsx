'use client';
import { usePathname } from 'next/navigation';
import { WorkspaceProvider } from './workspace-provider';
export function RouteProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path === '/' ? children : <WorkspaceProvider>{children}</WorkspaceProvider>;
}
