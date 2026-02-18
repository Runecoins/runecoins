import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Coins, LogIn, UserPlus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModals } from "@/components/auth-modals";
import logoPath from "@assets/920361e1-d9d6-42a7-b8f4-a1c173bc7ed1-removebg-preview_1771388848903.png";

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

  const openLogin = () => { setShowRegister(false); setShowLogin(true); };
  const openRegister = () => { setShowLogin(false); setShowRegister(true); };

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
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={openLogin} data-testid="button-login">
              <LogIn className="mr-1.5 h-4 w-4" />
              Entrar
            </Button>
            <Button size="sm" onClick={openRegister} data-testid="button-register">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Cadastrar
            </Button>
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
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); openLogin(); }} data-testid="button-login-mobile">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Entrar
                </Button>
                <Button size="sm" onClick={() => { setMobileOpen(false); openRegister(); }} data-testid="button-register-mobile">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Cadastrar
                </Button>
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
