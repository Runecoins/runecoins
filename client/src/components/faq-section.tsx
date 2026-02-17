import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "O que sao Tibia Coins?",
    answer:
      "Tibia Coins sao a moeda virtual do jogo Tibia, desenvolvido pela CipSoft. Com elas voce pode comprar produtos na Store do jogo, como Premium Time, montarias, outfits, itens cosmeticos e muito mais. Tambem e possivel vende-las no Market por Gold Coins.",
  },
  {
    question: "Como funciona a compra de Tibia Coins?",
    answer:
      "O processo e simples: escolha a quantidade de coins desejada, informe o nome do seu personagem e o servidor, selecione a forma de pagamento e finalize o pedido. Apos a confirmacao do pagamento, as coins serao enviadas diretamente ao seu personagem via gift no jogo.",
  },
  {
    question: "Quanto tempo demora a entrega?",
    answer:
      "A entrega e feita em minutos apos a confirmacao do pagamento. Para pagamentos via PIX, a confirmacao e praticamente instantanea. Em casos excepcionais, pode levar ate 30 minutos.",
  },
  {
    question: "E seguro comprar aqui?",
    answer:
      "Sim, 100% seguro! Trabalhamos com transacoes verificadas e protegidas. Temos milhares de clientes satisfeitos e uma avaliacao media de 4.9 estrelas. Suas informacoes sao tratadas com total sigilo.",
  },
  {
    question: "Quais formas de pagamento sao aceitas?",
    answer:
      "Aceitamos PIX (confirmacao instantanea), transferencia bancaria e cartao de credito. O PIX e a forma mais rapida e recomendada para entrega imediata.",
  },
  {
    question: "Posso vender minhas Tibia Coins?",
    answer:
      "Sim! Alem de comprar, voce tambem pode vender suas Tibia Coins conosco. Basta acessar a aba 'Vender Coins', informar a quantidade e seus dados de contato. Oferecemos os melhores precos de compra do mercado.",
  },
  {
    question: "Preciso estar online para receber as coins?",
    answer:
      "Nao! As Tibia Coins sao enviadas como gift diretamente ao personagem informado. Elas ficarao disponiveis na sua Store quando voce logar no jogo.",
  },
  {
    question: "Qual a quantidade minima de compra?",
    answer:
      "A quantidade minima para compra e de 25 Tibia Coins. O pacote mais popular e o de 250 coins, que equivale a uma Premium Time no Tibia.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
            <HelpCircle className="mr-1 h-3 w-3" />
            Duvidas Frequentes
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-md border border-border/50 bg-card/50 px-4"
                data-testid={`accordion-faq-${i}`}
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
