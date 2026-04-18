import { Link, useLocation } from "wouter";
import { Activity, Home, Users, BookOpen, AlertTriangle, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/intake", label: "New Assessment", icon: Stethoscope },
  { href: "/queue", label: "Patient Queue", icon: Users },
  { href: "/protocols", label: "Protocols", icon: BookOpen },
  { href: "/outbreaks", label: "Outbreaks", icon: AlertTriangle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
        <div className="bg-teal-500 rounded-md p-1.5">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-lg leading-none">DiseaseX</div>
          <div className="text-xs text-slate-400 leading-none mt-0.5">Triage & Protocol Engine</div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar nav — desktop */}
        <nav className="hidden md:flex flex-col w-56 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0" aria-label="Main navigation">
          <div className="p-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium text-sm",
                    isActive
                      ? "bg-teal-600 text-white"
                      : "hover:bg-slate-800 text-slate-300"
                  )}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                    {item.href === "/intake" && (
                      <span className="ml-auto bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">New</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto p-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "You are the first line of defense. This tool backs your expertise."
            </p>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-200 border-t border-slate-800 z-10" aria-label="Mobile navigation">
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex-1" data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className={cn(
                  "flex flex-col items-center gap-1 py-3 px-1 transition-all",
                  isActive ? "text-teal-400" : "text-slate-400"
                )}>
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium leading-none">{item.label.split(" ")[0]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
