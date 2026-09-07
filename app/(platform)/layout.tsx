import { Sidebar } from '../../components/platform/Sidebar';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-svh bg-background text-foreground"><Sidebar /><div className="min-w-0 flex-1 overflow-x-hidden">{children}</div></div>;
}
