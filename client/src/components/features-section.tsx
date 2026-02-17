import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Clock, Users, HeadphonesIcon, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Todas as transacoes sao protegidas e verificadas. Sua seguranca e nossa prioridade.",
    color: "text-primary",
  },
  {
    icon: Zap,
    title: "Entrega Rapida",
    description: "Receba suas coins em minutos apos a confirmacao do pagamento.",
    color: "text-accent",
  },
  {
    icon: Clock,
    title: "Disponivel 24/7",
    description: "Nosso sistema esta disponivel a qualquer hora, todos os dias da semana.",
    color: "text-primary",
  },
  {
    icon: Users,
    title: "Equipe Dedicada",
    description: "Time de atendimento, designers e programadores para melhor te atender.",
    color: "text-accent",
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte Premium",
    description: "Atendimento rapido e personalizado via WhatsApp e Discord.",
    color: "text-primary",
  },
  {
    icon: Globe,
    title: "Multi-Servidor",
    description: "Atendemos todos os servidores disponiveis. Nao importa onde voce joga.",
    color: "text-accent",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
            <Shield className="mr-1 h-3 w-3" />
            Por que nos escolher
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Confianca e{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Qualidade
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Somos referencia em compra e venda de Tibia Coins no Brasil.
            Nao arrisque negociando com desconhecidos.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full border-border/50 hover-elevate">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`rounded-md bg-muted p-2 ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold" data-testid={`text-feature-${i}`}>{feature.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
