import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Message {
  id: string;
  phone: string;
  content: string;
  timestamp: string;
  direction: "sent" | "received";
}

interface MessageLogProps {
  messages: Message[];
}

export default function MessageLog({ messages }: MessageLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Mensagens</CardTitle>
        <CardDescription>Histórico recente de mensagens</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma mensagem ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className={message.direction === "sent" ? "bg-accent/50" : ""}
                  data-testid={`card-message-${message.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-icons text-lg mt-0.5">
                        {message.direction === "sent" ? "arrow_upward" : "arrow_downward"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <p className="font-mono text-sm font-medium" data-testid={`text-phone-${message.id}`}>
                            {message.phone}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-timestamp-${message.id}`}>
                            {message.timestamp}
                          </p>
                        </div>
                        <p className="text-sm" data-testid={`text-content-${message.id}`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
