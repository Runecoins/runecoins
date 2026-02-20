import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ShoppingCart, TrendingUp, Clock, CheckCircle, ArrowLeft,
  Search, Filter, Eye, ChevronDown, ChevronUp, X, Image, Users
} from "lucide-react";
import type { Order, User } from "@shared/schema";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  awaiting_payment: "Aguardando Pagamento",
  paid: "Pago",
  processing: "Processando",
  completed: "Concluido",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  awaiting_payment: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"orders" | "clients">("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");

  const { data: stats } = useQuery<{ total: number; pending: number; paid: number; sell: number; buy: number }>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && user.role === "admin",
    refetchInterval: 10000,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user && user.role === "admin",
    refetchInterval: 10000,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-access-denied">Acesso Negado</h1>
        <p className="text-muted-foreground">Voce nao tem permissao para acessar esta pagina.</p>
        <Button onClick={() => setLocation("/")} data-testid="button-back-home">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Inicio
        </Button>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || order.type === filterType;
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-admin-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-admin-title">Painel Administrativo</h1>
          </div>
          <Badge className="border border-primary/30 bg-primary/10 text-primary" data-testid="badge-admin-role">
            Administrador
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4" data-testid="card-stat-total">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pedidos</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4" data-testid="card-stat-pending">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">{stats?.pending ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4" data-testid="card-stat-paid">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold text-foreground">{stats?.paid ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4" data-testid="card-stat-sell">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas</p>
                <p className="text-2xl font-bold text-foreground">{stats?.sell ?? 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
            data-testid="button-tab-orders"
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Pedidos
          </Button>
          <Button
            variant={activeTab === "clients" ? "default" : "outline"}
            onClick={() => setActiveTab("clients")}
            data-testid="button-tab-clients"
          >
            <Users className="mr-1.5 h-4 w-4" />
            Clientes Cadastrados
          </Button>
        </div>

        {activeTab === "clients" && (
          <Card className="p-4" data-testid="card-clients">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-foreground" data-testid="text-clients-title">Clientes Cadastrados</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-clients"
                />
              </div>
            </div>
            {clientsLoading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando clientes...</div>
            ) : clients.filter(c => c.role !== "admin").length === 0 ? (
              <div className="py-12 text-center text-muted-foreground" data-testid="text-no-clients">Nenhum cliente cadastrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Nome</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Usuario</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">E-mail</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Telefone</th>
                      <th className="pb-2 font-medium text-muted-foreground">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients
                      .filter(c => c.role !== "admin")
                      .filter(c => {
                        if (!clientSearch) return true;
                        const term = clientSearch.toLowerCase();
                        return (
                          c.fullName?.toLowerCase().includes(term) ||
                          c.username.toLowerCase().includes(term) ||
                          c.email?.toLowerCase().includes(term) ||
                          c.phone?.toLowerCase().includes(term)
                        );
                      })
                      .map((client) => (
                        <tr key={client.id} className="border-b border-border/50" data-testid={`row-client-${client.id}`}>
                          <td className="py-3 pr-4 font-medium text-foreground">{client.fullName || "-"}</td>
                          <td className="py-3 pr-4 text-foreground">{client.username}</td>
                          <td className="py-3 pr-4 text-foreground">{client.email || "-"}</td>
                          <td className="py-3 pr-4 text-foreground">{client.phone || "-"}</td>
                          <td className="py-3 text-muted-foreground">{client.createdAt ? new Date(client.createdAt).toLocaleDateString("pt-BR") : "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === "orders" && (
          <Card className="p-4" data-testid="card-orders">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-foreground" data-testid="text-orders-title">Pedidos</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-orders"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                data-testid="select-filter-type"
              >
                <option value="all">Todos os Tipos</option>
                <option value="buy">Compra</option>
                <option value="sell">Venda</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                data-testid="select-filter-status"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="awaiting_payment">Aguardando</option>
                <option value="paid">Pago</option>
                <option value="processing">Processando</option>
                <option value="completed">Concluido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {ordersLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground" data-testid="text-no-orders">Nenhum pedido encontrado</div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expanded={expandedOrder === order.id}
                  onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                  updating={updateStatusMutation.isPending}
                  onViewImage={(url) => setImageModal(url)}
                />
              ))}
            </div>
          )}
        </Card>
        )}
      </main>

      {imageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setImageModal(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 z-10 bg-background"
              onClick={() => setImageModal(null)}
              data-testid="button-close-image"
            >
              <X className="h-5 w-5" />
            </Button>
            <img src={imageModal} alt="Screenshot" className="max-h-[85vh] rounded-md object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onUpdateStatus,
  updating,
  onViewImage,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (status: string) => void;
  updating: boolean;
  onViewImage: (url: string) => void;
}) {
  return (
    <div className="rounded-md border border-border" data-testid={`row-order-${order.id}`}>
      <div
        className="flex cursor-pointer flex-wrap items-center gap-3 p-3 hover-elevate"
        onClick={onToggle}
        data-testid={`button-expand-order-${order.id}`}
      >
        <Badge className={`border ${order.type === "buy" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"}`}>
          {order.type === "buy" ? "Compra" : "Venda"}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
        <span className="text-sm font-medium text-foreground">{order.characterName}</span>
        <span className="text-sm text-muted-foreground">{order.quantity} coins</span>
        <span className="text-sm font-semibold text-foreground">R$ {order.totalPrice}</span>
        <Badge className={`ml-auto border ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
          {statusLabels[order.status] || order.status}
        </Badge>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Personagem</p>
              <p className="text-sm text-foreground" data-testid="text-order-character">{order.characterName}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Servidor</p>
              <p className="text-sm text-foreground">{order.serverId}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Pagamento</p>
              <p className="text-sm text-foreground">{order.paymentMethod === "pix" ? "PIX" : order.paymentMethod === "credit_card" ? "Cartao de Credito" : order.paymentMethod}</p>
            </div>
            {order.customerName && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Cliente</p>
                <p className="text-sm text-foreground">{order.customerName}</p>
              </div>
            )}
            {order.customerEmail && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">E-mail</p>
                <p className="text-sm text-foreground">{order.customerEmail}</p>
              </div>
            )}
            {order.customerPhone && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Telefone</p>
                <p className="text-sm text-foreground">{order.customerPhone}</p>
              </div>
            )}
            {order.pixKey && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Chave PIX</p>
                <p className="text-sm text-foreground">{order.pixKey}</p>
              </div>
            )}
            {order.pixAccountHolder && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Titular PIX</p>
                <p className="text-sm text-foreground">{order.pixAccountHolder}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Data</p>
              <p className="text-sm text-foreground">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
            </div>
          </div>

          {(order.storeScreenshot || order.marketScreenshot) && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Screenshots</p>
              <div className="flex flex-wrap gap-2">
                {order.storeScreenshot && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewImage(order.storeScreenshot!)}
                    data-testid={`button-view-store-screenshot-${order.id}`}
                  >
                    <Image className="mr-1.5 h-4 w-4" />
                    Print Store
                  </Button>
                )}
                {order.marketScreenshot && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewImage(order.marketScreenshot!)}
                    data-testid={`button-view-market-screenshot-${order.id}`}
                  >
                    <Image className="mr-1.5 h-4 w-4" />
                    Print Market
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Alterar Status</p>
            <div className="flex flex-wrap gap-2">
              {["pending", "awaiting_payment", "paid", "processing", "completed", "cancelled"].map((status) => (
                <Button
                  key={status}
                  variant={order.status === status ? "default" : "outline"}
                  size="sm"
                  disabled={order.status === status || updating}
                  onClick={() => onUpdateStatus(status)}
                  data-testid={`button-status-${status}-${order.id}`}
                >
                  {statusLabels[status]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
