import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/hero-bg.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary">
            <Zap className="mr-1 h-3 w-3" />
            Entrega Instantanea
          </Badge>
        </motion.div>

        <motion.h1
          className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Compre e Venda{" "}
          <span className="bg-gradient-to-r from-primary via-red-400 to-orange-500 bg-clip-text text-transparent">
            Tibia Coins
          </span>
          <br />
          com Seguranca
        </motion.h1>

        <motion.p
          className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Seu parceiro confiável para compra e venda de Paulistinha Coins. Transações rápidas, seguras e com os melhores preços do mercado.
        </motion.p>

        <motion.div
          className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <a href="#comprar">
            <Button size="lg" data-testid="button-hero-buy">
              <img src="/images/tibia-coin.png" alt="" className="mr-2 h-5 w-5" />
              Comprar Coins
            </Button>
          </a>
          <a href="#vender">
            <Button variant="outline" size="lg" data-testid="button-hero-sell">
              <Shield className="mr-2 h-5 w-5" />
              Vender Coins
            </Button>
          </a>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-600 sm:text-3xl">4.9</p>
            <p className="text-xs text-muted-foreground sm:text-sm">Avaliacao Media</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-primary sm:text-3xl">24/7</p>
            <p className="text-xs text-muted-foreground sm:text-sm">Suporte Online</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </motion.div>
    </section>
  );
}
