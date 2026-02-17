import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Server as ServerIcon, Wifi } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Server } from "@shared/schema";
import { motion } from "framer-motion";

export function ServersSection() {
  const { data: servers = [], isLoading } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const activeServers = servers.filter((s) => s.active);

  return (
    <section id="servidores" className="relative py-20">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
            <ServerIcon className="mr-1 h-3 w-3" />
            Servidores
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Servidores{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Disponiveis
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Atendemos os principais servidores. Selecione o seu e faca seu pedido.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeServers.map((server, i) => (
              <motion.div
                key={server.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="border-border/50 hover-elevate">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Wifi className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-server-${server.id}`}>{server.name}</p>
                      <p className="text-xs text-accent">Online</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
