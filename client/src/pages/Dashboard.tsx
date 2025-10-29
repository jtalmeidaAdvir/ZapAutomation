import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useAuth } from "@/lib/auth";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import ConnectionStatus from "@/components/ConnectionStatus";
import AuthorizedNumbers from "@/components/AuthorizedNumbers";
import MessageLog from "@/components/MessageLog";
import AddNumberModal from "@/components/AddNumberModal";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthorizedNumber as AuthorizedNumberType, Message as MessageType } from "@shared/schema";

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const { isConnected, qrCode, loading, initialize, socket } = useWhatsApp();

  const { data: authorizedNumbers = [], isLoading: loadingNumbers } = useQuery<AuthorizedNumberType[]>({
    queryKey: ["/api/authorized-numbers"],
  });

  const { data: messagesData = [], isLoading: loadingMessages } = useQuery<MessageType[]>({
    queryKey: ["/api/messages"],
  });

  const addNumberMutation = useMutation({
    mutationFn: async (data: { phone: string; label: string }) => {
      return await apiRequest("POST", "/api/authorized-numbers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-numbers"] });
      toast({
        title: "Número adicionado",
        description: "O número foi adicionado com sucesso à lista de autorizados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar número",
        variant: "destructive",
      });
    },
  });

  const deleteNumberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/authorized-numbers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-numbers"] });
      toast({
        title: "Número removido",
        description: "O número foi removido da lista de autorizados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover número",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket]);

  const handleAddNumber = (phone: string, label: string) => {
    addNumberMutation.mutate({ phone, label });
    setShowModal(false);
  };

  const handleDeleteNumber = (id: string) => {
    deleteNumberMutation.mutate(id);
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `Há ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours}h`;
    
    return date.toLocaleDateString("pt-PT");
  };

  const messages = messagesData.map((msg) => ({
    id: msg.id,
    phone: msg.phone,
    content: msg.content,
    direction: msg.direction as "sent" | "received",
    timestamp: formatTimestamp(msg.timestamp),
  }));

  const numbersWithFormattedDates = authorizedNumbers.map((num) => ({
    ...num,
    dateAdded: new Date(num.dateAdded).toLocaleDateString("pt-PT"),
  }));

  const lastActivity = messages[0]?.timestamp || "Nunca";
  const messagesToday = messages.filter((msg) => {
    const msgDate = new Date(messagesData.find(m => m.id === msg.id)?.timestamp || new Date());
    const today = new Date();
    return msgDate.toDateString() === today.toDateString();
  }).length;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="material-icons text-2xl text-primary">chat</span>
                <h1 className="text-xl font-semibold">WhatsApp Automação</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground" data-testid="text-username">
                  {user?.username}
                </span>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  data-testid="button-logout"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <QRCodeDisplay qrCode={qrCode} loading={loading} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="material-icons text-2xl text-primary">chat</span>
              <h1 className="text-xl font-semibold">WhatsApp Automação</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="text-username">
                {user?.username}
              </span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="button-logout"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <ConnectionStatus
            isConnected={isConnected}
            authorizedCount={numbersWithFormattedDates.length}
            messagesToday={messagesToday}
            lastActivity={lastActivity}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AuthorizedNumbers
                numbers={numbersWithFormattedDates}
                onAdd={() => setShowModal(true)}
                onDelete={handleDeleteNumber}
              />
            </div>

            <div className="lg:col-span-1">
              <MessageLog messages={messages} />
            </div>
          </div>
        </div>
      </main>

      <AddNumberModal
        open={showModal}
        onOpenChange={setShowModal}
        onAdd={handleAddNumber}
      />
    </div>
  );
}
