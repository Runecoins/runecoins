import { useState, useRef, useEffect } from "react";
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
import { ShoppingCart, Wallet, Calculator, Loader2, CheckCircle, X, Copy, Check, Upload, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { CoinPackage, Server } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

const quantityPresets = [25, 50, 100, 250, 500, 1000, 5000, 10000];
const BUY_PRICE_PER_UNIT = 0.799;
const SELL_PRICE_PER_UNIT = 0.0649;

interface PixResult {
  orderId: string;
  pixQrCode: string;
  pixQrCodeBase64: string;
  ticketUrl: string;
}

export function CoinCalculator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("comprar");
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPaymentMethod("");
    setShowCheckout(false);
    setSellStep(1);
  };
  const [quantity, setQuantity] = useState(250);
  const [characterName, setCharacterName] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [sellStep, setSellStep] = useState(1);
  const [sellPixKey, setSellPixKey] = useState("");
  const [sellPixHolder, setSellPixHolder] = useState("");
  const [storeScreenshot, setStoreScreenshot] = useState<File | null>(null);
  const [marketScreenshot, setMarketScreenshot] = useState<File | null>(null);
  const [sellOrderId, setSellOrderId] = useState("");
  const [sellComplete, setSellComplete] = useState(false);

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

  const paymentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/payments", data);
      return res.json();
    },
    onSuccess: (result) => {
      if (result.paymentMethod === "pix") {
        setPixResult({
          orderId: result.orderId,
          pixQrCode: result.pixQrCode,
          pixQrCodeBase64: result.pixQrCodeBase64 || "",
          ticketUrl: result.ticketUrl || "",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Pagamento",
        description: error?.message || "Nao foi possivel processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/sell-orders", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar pedido");
      }
      return res.json();
    },
    onSuccess: (result) => {
      setSellOrderId(result.orderId);
      setSellComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel criar o pedido de venda.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCharacterName("");
    setContactInfo("");
    setQuantity(250);
    setShowCheckout(false);
    setPixResult(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerDocument("");
    setCustomerPhone("");
  };

  const resetSellForm = () => {
    setSellStep(1);
    setCharacterName("");
    setSelectedServer("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSellPixKey("");
    setSellPixHolder("");
    setStoreScreenshot(null);
    setMarketScreenshot(null);
    setSellOrderId("");
    setSellComplete(false);
    setQuantity(250);
  };

  const handleProceedToCheckout = (type: "buy" | "sell") => {
    if (!characterName.trim()) {
      toast({ title: "Erro", description: "Informe o nome do personagem.", variant: "destructive" });
      return;
    }
    if (!selectedServer) {
      toast({ title: "Erro", description: "Selecione um servidor.", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Erro", description: "Selecione a forma de pagamento.", variant: "destructive" });
      return;
    }
    if (quantity < 25) {
      toast({ title: "Erro", description: "Quantidade minima: 25 coins.", variant: "destructive" });
      return;
    }
    setShowCheckout(true);
  };

  const handlePayment = (type: "buy" | "sell") => {
    if (!customerName.trim() || !customerEmail.trim() || !customerDocument.trim() || !customerPhone.trim()) {
      toast({ title: "Erro", description: "Preencha todos os dados pessoais.", variant: "destructive" });
      return;
    }

    const payload: Record<string, unknown> = {
      type,
      characterName: characterName.trim(),
      serverId: selectedServer,
      quantity,
      paymentMethod,
      contactInfo: contactInfo.trim(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerDocument: customerDocument.replace(/\D/g, ""),
      customerPhone: customerPhone.replace(/\D/g, ""),
    };

    paymentMutation.mutate(payload);
  };

  const handleSubmitSellOrder = () => {
    const formData = new FormData();
    formData.append("characterName", characterName.trim());
    formData.append("serverId", selectedServer);
    formData.append("quantity", quantity.toString());
    formData.append("customerName", customerName.trim());
    formData.append("customerEmail", customerEmail.trim());
    formData.append("customerPhone", customerPhone.replace(/\D/g, ""));
    formData.append("pixKey", sellPixKey.trim());
    formData.append("pixAccountHolder", sellPixHolder.trim());
    if (storeScreenshot) formData.append("storeScreenshot", storeScreenshot);
    if (marketScreenshot) formData.append("marketScreenshot", marketScreenshot);
    sellMutation.mutate(formData);
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

  if (pixResult) {
    return (
      <section id="comprar" className="relative py-20">
        <div className="relative mx-auto max-w-lg px-4 sm:px-6">
          <PixQrCodeDisplay
            pixResult={pixResult}
            totalPrice={activeTab === "comprar" ? buyPrice : sellPrice}
            onClose={resetForm}
          />
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
            <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                  {showCheckout ? (
                    <CheckoutForm
                      type="buy"
                      paymentMethod={paymentMethod}
                      quantity={quantity}
                      totalPrice={buyPrice}
                      customerName={customerName}
                      setCustomerName={setCustomerName}
                      customerEmail={customerEmail}
                      setCustomerEmail={setCustomerEmail}
                      customerDocument={customerDocument}
                      setCustomerDocument={setCustomerDocument}
                      customerPhone={customerPhone}
                      setCustomerPhone={setCustomerPhone}
                      onSubmit={() => handlePayment("buy")}
                      onBack={() => setShowCheckout(false)}
                      isPending={paymentMutation.isPending}
                    />
                  ) : (
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
                      onSubmit={() => handleProceedToCheckout("buy")}
                      isPending={false}
                    />
                  )}
                </TabsContent>

                <TabsContent value="vender" className="mt-0 space-y-6">
                  <SellWizard
                    step={sellStep}
                    setStep={setSellStep}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    characterName={characterName}
                    setCharacterName={setCharacterName}
                    selectedServer={selectedServer}
                    setSelectedServer={setSelectedServer}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerEmail={customerEmail}
                    setCustomerEmail={setCustomerEmail}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                    sellPixKey={sellPixKey}
                    setSellPixKey={setSellPixKey}
                    sellPixHolder={sellPixHolder}
                    setSellPixHolder={setSellPixHolder}
                    storeScreenshot={storeScreenshot}
                    setStoreScreenshot={setStoreScreenshot}
                    marketScreenshot={marketScreenshot}
                    setMarketScreenshot={setMarketScreenshot}
                    servers={servers}
                    serversLoading={serversLoading}
                    totalPrice={sellPrice}
                    onSubmit={handleSubmitSellOrder}
                    isPending={sellMutation.isPending}
                    sellComplete={sellComplete}
                    sellOrderId={sellOrderId}
                    onReset={resetSellForm}
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

interface SellWizardProps {
  step: number;
  setStep: (v: number) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  characterName: string;
  setCharacterName: (v: string) => void;
  selectedServer: string;
  setSelectedServer: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  sellPixKey: string;
  setSellPixKey: (v: string) => void;
  sellPixHolder: string;
  setSellPixHolder: (v: string) => void;
  storeScreenshot: File | null;
  setStoreScreenshot: (v: File | null) => void;
  marketScreenshot: File | null;
  setMarketScreenshot: (v: File | null) => void;
  servers: Server[];
  serversLoading: boolean;
  totalPrice: number;
  onSubmit: () => void;
  isPending: boolean;
  sellComplete: boolean;
  sellOrderId: string;
  onReset: () => void;
}

function SellWizard(props: SellWizardProps) {
  const { toast } = useToast();
  const storeFileRef = useRef<HTMLInputElement>(null);
  const marketFileRef = useRef<HTMLInputElement>(null);

  const {
    step, setStep, quantity, setQuantity,
    characterName, setCharacterName, selectedServer, setSelectedServer,
    customerName, setCustomerName, customerEmail, setCustomerEmail,
    customerPhone, setCustomerPhone,
    sellPixKey, setSellPixKey, sellPixHolder, setSellPixHolder,
    storeScreenshot, setStoreScreenshot, marketScreenshot, setMarketScreenshot,
    servers, serversLoading, totalPrice, onSubmit, isPending,
    sellComplete, sellOrderId, onReset,
  } = props;

  const totalSteps = 6;

  const validateAndNext = () => {
    if (step === 1) {
      if (quantity < 25) {
        toast({ title: "Erro", description: "Quantidade minima: 25 coins.", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!characterName.trim()) {
        toast({ title: "Erro", description: "Informe o nome do personagem.", variant: "destructive" });
        return;
      }
      if (!selectedServer) {
        toast({ title: "Erro", description: "Selecione um servidor.", variant: "destructive" });
        return;
      }
    }
    if (step === 4) {
      if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
        toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
        return;
      }
    }
    if (step === 5) {
      if (!sellPixKey.trim() || !sellPixHolder.trim()) {
        toast({ title: "Erro", description: "Preencha a chave PIX e o titular.", variant: "destructive" });
        return;
      }
    }
    setStep(Math.min(step + 1, totalSteps));
  };

  if (sellComplete) {
    return (
      <div className="space-y-6 py-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </motion.div>
        <h3 className="text-2xl font-bold">Pedido Criado com Sucesso!</h3>
        <p className="text-muted-foreground">
          Seu pedido de venda foi registrado. Aguarde a confirmacao do recebimento das coins.
          Apos a verificacao, o pagamento sera enviado para sua chave PIX.
        </p>
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-mono font-medium" data-testid="text-sell-order-id">#{sellOrderId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-medium">{quantity.toLocaleString("pt-BR")} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor a receber:</span>
                <span className="font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Aguarde a verificacao. Voce sera contatado em breve.
        </div>
        <Button variant="outline" className="w-full" onClick={onReset} data-testid="button-sell-new-order">
          Fazer novo pedido
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? "bg-primary" : "bg-muted"
            }`}
            data-testid={`sell-step-indicator-${i + 1}`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">Passo {step} de {totalSteps}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold" data-testid="text-sell-step-title">
                Selecione a quantidade de coins que deseja vender
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {quantityPresets.map((preset) => (
                  <Badge
                    key={preset}
                    variant={quantity === preset ? "default" : "secondary"}
                    className="cursor-pointer tabular-nums"
                    onClick={() => setQuantity(preset)}
                    data-testid={`badge-sell-quantity-${preset}`}
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
                className="text-center text-lg"
                data-testid="input-sell-quantity"
              />
              <Card className="border-primary/20 bg-muted/30">
                <CardContent className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">Voce recebera:</p>
                  <p className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{quantity.toLocaleString("pt-BR")} coins x R$ {SELL_PRICE_PER_UNIT.toFixed(4)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold" data-testid="text-sell-step2-title">
                Qual personagem enviara as {quantity.toLocaleString("pt-BR")} coins?
              </h3>
              <div>
                <Label className="mb-1 block text-sm font-medium">Personagem</Label>
                <Input
                  placeholder="Nome do personagem..."
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  data-testid="input-sell-character"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">Servidor</Label>
                <Select value={selectedServer} onValueChange={setSelectedServer}>
                  <SelectTrigger data-testid="select-sell-server">
                    <SelectValue placeholder="Selecione o servidor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serversLoading ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      servers.filter((s) => s.active && s.name === "Deletera").map((server) => (
                        <SelectItem key={server.id} value={server.id}>
                          {server.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold" data-testid="text-sell-step3-title">
                Envie as Coins e nos mostre o comprovante
              </h3>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold text-primary uppercase">
                    ENVIE AS COINS PARA O PERSONAGEM "RUNECOINS" NO SERVIDOR DELETERA
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Caso voce nao possua um personagem no servidor, basta criar um char no servidor Deletera e envie o print abaixo.
                  </p>
                </CardContent>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-sm font-medium">Print do Historico da STORE</Label>
                  <div
                    className="hover-elevate flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-6 text-center transition-colors"
                    onClick={() => storeFileRef.current?.click()}
                    data-testid="upload-store-screenshot"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {storeScreenshot ? storeScreenshot.name : "Escolher arquivo"}
                    </span>
                  </div>
                  <input
                    ref={storeFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setStoreScreenshot(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-sm font-medium">Print do Historico do MARKET</Label>
                  <div
                    className="hover-elevate flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-6 text-center transition-colors"
                    onClick={() => marketFileRef.current?.click()}
                    data-testid="upload-market-screenshot"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {marketScreenshot ? marketScreenshot.name : "Escolher arquivo"}
                    </span>
                  </div>
                  <input
                    ref={marketFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setMarketScreenshot(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Envie prints comprovando o envio das coins.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold" data-testid="text-sell-step4-title">
                Agora diga-me suas informacoes!
              </h3>
              <p className="text-center text-sm text-muted-foreground">Informacoes pessoais:</p>
              <div>
                <Label className="mb-1 block text-sm font-medium">Seu nome</Label>
                <Input
                  placeholder="Seu nome completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  data-testid="input-sell-name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-sm font-medium">E-mail</Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    data-testid="input-sell-email"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-sm font-medium">Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    data-testid="input-sell-phone"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold" data-testid="text-sell-step5-title">
                Agora diga-me as informacoes do pagamento!
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                Garanta que esta digitando corretamente
              </p>
              <p className="text-sm font-medium text-muted-foreground">Informacoes de recebimento:</p>
              <div>
                <Label className="mb-1 block text-sm font-medium">Chave PIX</Label>
                <Input
                  placeholder="Sua chave PIX"
                  value={sellPixKey}
                  onChange={(e) => setSellPixKey(e.target.value)}
                  data-testid="input-sell-pix-key"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">Titular da conta</Label>
                <Input
                  placeholder="Nome do titular da conta"
                  value={sellPixHolder}
                  onChange={(e) => setSellPixHolder(e.target.value)}
                  data-testid="input-sell-pix-holder"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold" data-testid="text-sell-step6-title">
                Envie {quantity.toLocaleString("pt-BR")} coins para RuneCoins
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                CLIQUE EM GERAR PEDIDO
              </p>
              <Card className="border-primary/20">
                <CardContent className="space-y-2 p-4 text-center">
                  <p className="text-lg font-bold">
                    {quantity.toLocaleString("pt-BR")} coins por R$ {totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-primary">Chave PIX</p>
                  <p className="font-medium">{sellPixKey}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep(step - 1)}
            data-testid="button-sell-back"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        )}
        {step < totalSteps && (
          <Button
            className="flex-1"
            onClick={validateAndNext}
            data-testid="button-sell-next"
          >
            Continuar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
        {step === totalSteps && (
          <Button
            className="flex-1"
            onClick={onSubmit}
            disabled={isPending}
            data-testid="button-sell-generate"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Gerar Pedido
          </Button>
        )}
      </div>
    </div>
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
            Continuar para Pagamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface CheckoutFormProps {
  type: "buy" | "sell";
  paymentMethod: string;
  quantity: number;
  totalPrice: number;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerDocument: string;
  setCustomerDocument: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
}

function CheckoutForm({
  type,
  paymentMethod,
  quantity,
  totalPrice,
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerDocument,
  setCustomerDocument,
  customerPhone,
  setCustomerPhone,
  onSubmit,
  onBack,
  isPending,
}: CheckoutFormProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dados para Pagamento</h3>
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-order">
          Voltar
        </Button>
      </div>

      <Card className="border-primary/10 bg-muted/30">
        <CardContent className="p-3">
          <p className="text-sm text-muted-foreground">
            {quantity.toLocaleString("pt-BR")} coins - PIX
          </p>
          <p className="text-xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-sm font-medium">
            Nome Completo <span className="text-primary">*</span>
          </Label>
          <Input
            placeholder="Seu nome completo"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            data-testid="input-customer-name"
          />
        </div>
        <div>
          <Label className="mb-1 block text-sm font-medium">
            E-mail <span className="text-primary">*</span>
          </Label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            data-testid="input-customer-email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-sm font-medium">
            CPF <span className="text-primary">*</span>
          </Label>
          <Input
            placeholder="000.000.000-00"
            value={customerDocument}
            onChange={(e) => setCustomerDocument(e.target.value)}
            data-testid="input-customer-document"
          />
        </div>
        <div>
          <Label className="mb-1 block text-sm font-medium">
            Celular / WhatsApp <span className="text-primary">*</span>
          </Label>
          <Input
            placeholder="(11) 99999-9999"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            data-testid="input-customer-phone"
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={isPending}
        data-testid={`button-pay-${type}`}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        Gerar QR Code PIX
      </Button>
    </div>
  );
}

function PixQrCodeDisplay({
  pixResult,
  totalPrice,
  onClose,
}: {
  pixResult: PixResult;
  totalPrice: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);

  useEffect(() => {
    if (paymentApproved) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${pixResult.orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid" || data.mercadoPagoStatus === "approved") {
            setPaymentApproved(true);
            clearInterval(interval);
          }
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [pixResult.orderId, paymentApproved]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixResult.pixQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (paymentApproved) {
    return (
      <Card className="border-green-500/30 bg-gradient-to-b from-green-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="space-y-6 py-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-14 w-14 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-green-500" data-testid="text-payment-approved-title">
                Pagamento Aprovado!
              </h3>
              <p className="mt-2 text-muted-foreground">
                Seu pagamento foi confirmado com sucesso.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pedido:</span>
                      <span className="font-mono font-medium" data-testid="text-approved-order-id">
                        #{pixResult.orderId.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor pago:</span>
                      <span className="font-bold text-green-500" data-testid="text-approved-amount">
                        R$ {totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-green-500" data-testid="text-approved-status">
                        Aprovado
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm" data-testid="text-delivery-notice">
                <Clock className="h-5 w-5 shrink-0 text-yellow-500" />
                <div className="text-left">
                  <p className="font-semibold text-yellow-500">Aguarde a entrega</p>
                  <p className="text-muted-foreground">
                    Suas coins serao enviadas em ate <span className="font-bold text-foreground">5 minutos</span> para o seu personagem dentro do jogo.
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <p>A entrega e realizada manualmente por nossa equipe. Em horarios de pico, pode levar alguns minutos a mais. Caso demore, entre em contato pelo nosso Instagram.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button variant="outline" className="w-full" onClick={onClose} data-testid="button-approved-new-order">
                Fazer novo pedido
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Pagamento PIX</h3>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-pix">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar:</p>
          <p className="text-3xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</p>
        </div>

        <div className="mb-4 flex justify-center">
          {pixResult.pixQrCodeBase64 ? (
            <img
              src={`data:image/png;base64,${pixResult.pixQrCodeBase64}`}
              alt="QR Code PIX"
              className="h-56 w-56 rounded-md border border-border bg-white p-2"
              data-testid="img-pix-qrcode"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-md border border-border bg-muted">
              <p className="text-sm text-muted-foreground">QR Code indisponivel</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <Label className="mb-1 block text-sm font-medium">Codigo PIX (Copia e Cola)</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={pixResult.pixQrCode}
              className="text-xs"
              data-testid="input-pix-code"
            />
            <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy-pix">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Aguardando pagamento...</span>
        </div>

        <div className="mt-2 rounded-md bg-muted/50 p-3 text-center text-sm text-muted-foreground">
          <p>Abra o app do seu banco, escolha pagar via PIX e escaneie o QR Code ou copie e cole o codigo acima.</p>
          <p className="mt-1 font-medium text-primary">O QR Code expira em 1 hora.</p>
        </div>

        <Button variant="outline" className="mt-4 w-full" onClick={onClose} data-testid="button-new-order">
          Fazer novo pedido
        </Button>
      </CardContent>
    </Card>
  );
}
