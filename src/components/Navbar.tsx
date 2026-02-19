import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserRoles, type AppRole } from "@/hooks/useRoles";
import { useRolePermissions, hasAccess } from "@/config/rbac";
import { useThemeLogo } from "@/hooks/useThemeLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Tags,
  Wallet,
  BarChart3,
  Settings,
  Users,
  Truck,
  LogOut,
  User,
  Heart,
  Menu,
  ChevronDown,
  ShoppingCart,
  Boxes,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

const navStructure: NavEntry[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  {
    label: "Satış",
    icon: ShoppingCart,
    items: [
      { label: "Kasa", path: "/kasa", icon: Wallet },
      { label: "Kampanyalar", path: "/kampanyalar", icon: Tags },
      { label: "Sadakat", path: "/sadakat", icon: Heart },
    ],
  },
  {
    label: "Stok & Tedarik",
    icon: Boxes,
    items: [
      { label: "Stok Yönetimi", path: "/stok", icon: Package },
      { label: "Stok Raporu", path: "/stok-raporu", icon: ClipboardList },
      { label: "Tedarikçiler", path: "/tedarikciler", icon: Truck },
    ],
  },
  { label: "Raporlar", path: "/raporlar", icon: BarChart3 },
  {
    label: "Yönetim",
    icon: Shield,
    items: [
      { label: "Personel", path: "/personel", icon: Users },
      { label: "Ayarlar", path: "/ayarlar", icon: Settings },
    ],
  },
];

// Flatten for mobile & RBAC filtering
const allNavItems: NavItem[] = navStructure.flatMap((entry) =>
  isGroup(entry) ? entry.items : [entry]
);

function NavDropdownGroup({
  group,
  permissions,
  userRoles,
  currentPath,
}: {
  group: NavGroup;
  permissions: any[];
  userRoles: AppRole[];
  currentPath: string;
}) {
  const visibleItems = group.items.filter((item) => hasAccess(permissions, userRoles, item.path));
  if (visibleItems.length === 0) return null;

  const isActiveGroup = visibleItems.some((item) => currentPath === item.path);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors outline-none",
            isActiveGroup
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <group.icon className="h-4 w-4" />
          <span>{group.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {visibleItems.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link
              to={item.path}
              className={cn(
                "flex items-center gap-2 w-full",
                currentPath === item.path && "bg-primary/10 text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const { data: userRoles = [] } = useCurrentUserRoles();
  const { data: permissions = [] } = useRolePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoUrl } = useThemeLogo();

  const visibleMobileItems = allNavItems.filter((item) => hasAccess(permissions, userRoles, item.path));

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="page-container flex h-16 items-center justify-between py-0">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-9 object-contain" />
                  ) : (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Wallet className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold leading-none tracking-tight">TekelPOS</span>
                        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">ERP Sistemi</span>
                      </div>
                    </>
                  )}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {visibleMobileItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.full_name || "Kullanıcı"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive mt-1" onClick={() => { setMobileOpen(false); signOut(); }}>
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 object-contain" />
            ) : (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none tracking-tight">TekelPOS</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">ERP Sistemi</span>
                </div>
              </>
            )}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navStructure.map((entry) => {
            if (isGroup(entry)) {
              return (
                <NavDropdownGroup
                  key={entry.label}
                  group={entry}
                  permissions={permissions}
                  userRoles={userRoles}
                  currentPath={location.pathname}
                />
              );
            }
            // Standalone item
            if (!hasAccess(permissions, userRoles, entry.path)) return null;
            const isActive = location.pathname === entry.path;
            return (
              <Link
                key={entry.path}
                to={entry.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <entry.icon className="h-4 w-4" />
                <span>{entry.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name || "Kullanıcı"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profil" className="gap-2">
                  <User className="h-4 w-4" />
                  Profilim
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
