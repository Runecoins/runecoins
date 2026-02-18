import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ShoppingCart, Wallet, Calculator, Loader2, CheckCircle } from "lucide-react";
import type { CoinPackage, Server } from "@shared/schema";
import { motion } from "framer-motion";

const quantityPresets = [25, 50, 100, 250, 500, 1000, 5000, 10000];
const BUY_PRICE_PER_UNIT = 0.0799;
const SELL_PRICE_PER_UNIT = 0.06;

export function CoinCalculator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("comprar");
  const [quantity, setQuantity] = useState(250);
  const [characterName, setCharacterName] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const { data: packages = [], isLoading: packagesLoading } = useQuery<CoinPackage[]>({
    queryKey: ["/api/packages"],
  });

  const { data: servers = [], isLoading: serversLoading } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const activePackages = packages.filter((p) => p.active);
  const currentPkg = activePackages.length > 0 ? activePackages[0] : null;

  const buyPrice = BUY_PRICE_PER_UNIT * quantity;
  const sellPrice = SELL_PRICE_PER_UNIT * quantity;

  const orderMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido Criado!",
        description: "Seu pedido foi registrado com sucesso. Entraremos em contato em breve.",
      });
      setCharacterName("");
      setContactInfo("");
      setQuantity(250);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Nao foi possivel criar o pedido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (type: "buy" | "sell") => {
    if (!characterName.trim()) {
      toast({ title: "Erro", description: "Informe o nome do personagem.", variant: "destructive" });
      return;
    }
    if (!selectedServer) {
      toast({ title: "Erro", description: "Selecione um servidor.", variant: "destructive" });
      return;
    }
    if (quantity < 25) {
      toast({ title: "Erro", description: "Quantidade minima: 25 coins.", variant: "destructive" });
      return;
    }

    const finalPrice = type === "buy" ? buyPrice : sellPrice;

    orderMutation.mutate({
      type,
      characterName: characterName.trim(),
      serverId: selectedServer,
      packageId: currentPkg?.id || "",
      quantity,
      totalPrice: finalPrice.toFixed(2),
      paymentMethod: paymentMethod || "pix",
      contactInfo: contactInfo.trim(),
    });
  };

  if (packagesLoading) {
    return (
      <section id="comprar" className="relative py-20">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <Skeleton className="mx-auto mb-3 h-6 w-32" />
            <Skeleton className="mx-auto mb-2 h-10 w-80" />
            <Skeleton className="mx-auto h-5 w-64" />
          </div>
          <Skeleton className="h-96 rounded-md" />
        </div>
      </section>
    );
  }

  return (
    <section id="comprar" className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
            <Calculator className="mr-1 h-3 w-3" />
            Calculadora
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-calculator-title">
            Calcule e{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Faca seu Pedido
            </span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Escolha a quantidade, informe seu personagem e finalize em segundos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="overflow-visible border-primary/20">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-border/50 px-4 pt-4 sm:px-6 sm:pt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="comprar" className="flex-1" data-testid="tab-buy">
                    <ShoppingCart className="mr-1.5 h-4 w-4" />
                    Comprar Coins
                  </TabsTrigger>
                  <TabsTrigger value="vender" className="flex-1" data-testid="tab-sell" id="vender">
                    <Wallet className="mr-1.5 h-4 w-4" />
                    Vender Coins
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="p-4 sm:p-6">
                <TabsContent value="comprar" className="mt-0 space-y-6">
                  <CoinForm
                    type="buy"
                    quantity={quantity}
                    setQuantity={setQuantity}
                    characterName={characterName}
                    setCharacterName={setCharacterName}
                    selectedServer={selectedServer}
                    setSelectedServer={setSelectedServer}
                    contactInfo={contactInfo}
                    setContactInfo={setContactInfo}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    servers={servers}
                    serversLoading={serversLoading}
                    pricePerUnit={BUY_PRICE_PER_UNIT}
                    totalPrice={buyPrice}
                    onSubmit={() => handleSubmit("buy")}
                    isPending={orderMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="vender" className="mt-0 space-y-6">
                  <CoinForm
                    type="sell"
                    quantity={quantity}
                    setQuantity={setQuantity}
                    characterName={characterName}
                    setCharacterName={setCharacterName}
                    selectedServer={selectedServer}
                    setSelectedServer={setSelectedServer}
                    contactInfo={contactInfo}
                    setContactInfo={setContactInfo}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    servers={servers}
                    serversLoading={serversLoading}
                    pricePerUnit={SELL_PRICE_PER_UNIT}
                    totalPrice={sellPrice}
                    onSubmit={() => handleSubmit("sell")}
                    isPending={orderMutation.isPending}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

interface CoinFormProps {
  type: "buy" | "sell";
  quantity: number;
  setQuantity: (v: number) => void;
  characterName: string;
  setCharacterName: (v: string) => void;
  selectedServer: string;
  setSelectedServer: (v: string) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  servers: Server[];
  serversLoading: boolean;
  pricePerUnit: number;
  totalPrice: number;
  onSubmit: () => void;
  isPending: boolean;
}

function CoinForm({
  type,
  quantity,
  setQuantity,
  characterName,
  setCharacterName,
  selectedServer,
  setSelectedServer,
  contactInfo,
  setContactInfo,
  paymentMethod,
  setPaymentMethod,
  servers,
  serversLoading,
  pricePerUnit,
  totalPrice,
  onSubmit,
  isPending,
}: CoinFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2 block text-sm font-medium">Quantidade de Coins</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {quantityPresets.map((preset) => (
            <Badge
              key={preset}
              variant={quantity === preset ? "default" : "secondary"}
              className="cursor-pointer tabular-nums"
              onClick={() => setQuantity(preset)}
              data-testid={`badge-quantity-${preset}`}
            >
              {preset.toLocaleString("pt-BR")}
            </Badge>
          ))}
        </div>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
          min={25}
          max={100000}
          data-testid="input-quantity"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm font-medium">Nome do Personagem</Label>
          <Input
            placeholder="Seu character name"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            data-testid="input-character-name"
          />
        </div>
        <div>
          <Label className="mb-2 block text-sm font-medium">Servidor</Label>
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger data-testid="select-server">
              <SelectValue placeholder="Selecione o servidor" />
            </SelectTrigger>
            <SelectContent>
              {serversLoading ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : (
                servers.filter((s) => s.active).map((server) => (
                  <SelectItem key={server.id} value={server.id} data-testid={`option-server-${server.id}`}>
                    {server.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm font-medium">
            {type === "buy" ? "Forma de Pagamento" : "Forma de Recebimento"}
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger data-testid="select-payment">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credit_card">Cartao de Credito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm font-medium">Contato (WhatsApp / Discord)</Label>
          <Input
            placeholder="Seu contato para entrega"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            data-testid="input-contact"
          />
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <img src="/images/tibia-coin.png" alt="Tibia Coin" className="h-12 w-12" data-testid="img-tibia-coin" />
            <div>
              <p className="text-sm text-muted-foreground" data-testid="text-price-breakdown">
                {quantity.toLocaleString("pt-BR")} coins x R$ {pricePerUnit.toFixed(4)}
              </p>
              <p className="text-2xl font-bold">
                R$ <span className="text-primary" data-testid="text-total-price">{totalPrice.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={onSubmit}
            disabled={isPending}
            className="w-full sm:w-auto"
            data-testid={`button-submit-${type}`}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {type === "buy" ? "Comprar Agora" : "Vender Agora"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
