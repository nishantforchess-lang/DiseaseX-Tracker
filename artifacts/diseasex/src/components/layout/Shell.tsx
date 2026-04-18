import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  BookOpen,
  MapPin,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/intake", label: "New Assessment", icon: Stethoscope },
  { href: "/queue", label: "Patient Queue", icon: Users },
  { href: "/protocols", label: "Protocols", icon: BookOpen },
  { href: "/outbreaks", label: "Outbreaks", icon: MapPin },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90" data-testid="button-mobile-menu">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-secondary p-0">
            <div className="flex h-16 items-center border-b border-secondary-foreground/10 px-6">
              <span className="text-lg font-bold text-secondary-foreground">DiseaseX Triage</span>
            </div>
            <nav className="flex flex-col gap-2 p-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground",
                    location === item.href && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="text-lg font-bold text-primary-foreground">DiseaseX Triage</span>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-secondary sm:flex">
          <div className="flex h-16 items-center border-b border-secondary-foreground/10 px-6">
            <span className="text-xl font-bold text-secondary-foreground">DiseaseX Triage</span>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground",
                  location === item.href && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                data-testid={`link-desktop-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
