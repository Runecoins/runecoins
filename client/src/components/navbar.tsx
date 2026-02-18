import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, UserPlus, Shield, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModals } from "@/components/auth-modals";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import logoPath from "@assets/920361e1-d9d6-42a7-b8f4-a1c173bc7ed1-removebg-preview_1771388848903.png";
import instagramIconPath from "@assets/image_1771438136331.png";

const navLinks = [
  { label: "Comprar", href: "#comprar" },
  { label: "Vender", href: "#vender" },
  { label: "Servidores", href: "#servidores" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const openLogin = () => { setShowRegister(false); setShowLogin(true); };
  const openRegister = () => { setShowLogin(false); setShowRegister(true); };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <img
              src={logoPath}
              alt="RuneCoins Logo"
              className="h-10 w-auto max-w-[120px] object-contain"
              data-testid="img-logo"
            />
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                asChild
                data-testid={`link-nav-${link.label.toLowerCase()}`}
              >
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="https://www.instagram.com/runecoinsot/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-instagram"
            >
              <img
                src={instagramIconPath}
                alt="Instagram"
                className="h-9 w-9 rounded-md object-contain"
              />
            </a>
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-muted-foreground" data-testid="text-username">
                  <User className="mr-1 inline h-4 w-4" />
                  {user.username}
                </span>
                {user.role === "admin" && (
                  <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} data-testid="button-admin-panel">
                    <Shield className="mr-1.5 h-4 w-4" />
                    Painel Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={openLogin} data-testid="button-login">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Entrar
                </Button>
                <Button size="sm" onClick={openRegister} data-testid="button-register">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Cadastrar
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start"
                  data-testid={`link-nav-mobile-${link.label.toLowerCase()}`}
                >
                  <a href={link.href} onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </a>
                </Button>
              ))}
              <a
                href="https://www.instagram.com/runecoinsot/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1"
                data-testid="link-instagram-mobile"
              >
                <img src={instagramIconPath} alt="Instagram" className="h-7 w-7 rounded-md object-contain" />
                <span className="text-sm text-muted-foreground">Instagram</span>
              </a>
              <div className="mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <span className="px-3 py-1 text-sm text-muted-foreground" data-testid="text-username-mobile">
                      <User className="mr-1 inline h-4 w-4" />
                      {user.username}
                    </span>
                    {user.role === "admin" && (
                      <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); setLocation("/admin"); }} data-testid="button-admin-panel-mobile">
                        <Shield className="mr-1.5 h-4 w-4" />
                        Painel Admin
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setMobileOpen(false); handleLogout(); }} data-testid="button-logout-mobile">
                      <LogOut className="mr-1.5 h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); openLogin(); }} data-testid="button-login-mobile">
                      <LogIn className="mr-1.5 h-4 w-4" />
                      Entrar
                    </Button>
                    <Button size="sm" onClick={() => { setMobileOpen(false); openRegister(); }} data-testid="button-register-mobile">
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      Cadastrar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModals
        showLogin={showLogin}
        showRegister={showRegister}
        onCloseLogin={() => setShowLogin(false)}
        onCloseRegister={() => setShowRegister(false)}
        onSwitchToRegister={openRegister}
        onSwitchToLogin={openLogin}
      />
    </>
  );
}
