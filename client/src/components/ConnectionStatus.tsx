import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  isConnected: boolean;
  authorizedCount: number;
  messagesToday: number;
  lastActivity: string;
}

export default function ConnectionStatus({
  isConnected,
  authorizedCount,
  messagesToday,
  lastActivity,
}: ConnectionStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="material-icons text-2xl text-primary">
              {isConnected ? "check_circle" : "error"}
            </span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="mt-1"
                data-testid="badge-connection-status"
              >
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="material-icons text-2xl text-primary">group</span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Números Autorizados</p>
              <p className="text-2xl font-semibold mt-1" data-testid="text-authorized-count">
                {authorizedCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="material-icons text-2xl text-primary">send</span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Mensagens Hoje</p>
              <p className="text-2xl font-semibold mt-1" data-testid="text-messages-today">
                {messagesToday}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="material-icons text-2xl text-primary">schedule</span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Última Atividade</p>
              <p className="text-sm font-medium mt-1" data-testid="text-last-activity">
                {lastActivity}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
