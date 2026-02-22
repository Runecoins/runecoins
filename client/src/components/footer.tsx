import { SiDiscord, SiInstagram, SiWhatsapp } from "react-icons/si";
import logoPath from "@assets/image_1771376960094.png";

const socialLinks = [
  { icon: SiInstagram, label: "Instagram", href: "https://www.instagram.com/runecoins.oficial/" },
  { icon: SiDiscord, label: "Discord", href: "#" },
  { icon: SiWhatsapp, label: "WhatsApp", href: "#" },
];

const footerLinks = [
  {
    title: "Servicos",
    links: [
      { label: "Comprar Coins", href: "#comprar" },
      { label: "Vender Coins", href: "#vender" },
      { label: "Calculadora", href: "#comprar" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Contato", href: "#" },
      { label: "Termos de Uso", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nos", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Politica de Privacidade", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="/" className="mb-4 flex items-center gap-2" data-testid="link-footer-home">
              <img
                src={logoPath}
                alt="RuneCoins"
                className="h-10 w-auto max-w-[120px] object-contain"
              />
            </a>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Seu parceiro confiável para compra e venda de Paulistinha Coins. Transações rápidas, seguras e com os melhores preços do mercado.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-muted p-2 text-muted-foreground transition-colors hover:text-foreground"
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-sm font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            RuneCoins &copy; {new Date().getFullYear()} - Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            <img
              src="/images/shield-trust.png"
              alt="Seguro"
              className="h-6 w-6"
            />
            <span className="text-xs text-muted-foreground">Site Seguro e Verificado</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
