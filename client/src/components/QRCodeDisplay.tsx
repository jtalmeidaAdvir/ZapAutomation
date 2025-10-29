import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface QRCodeDisplayProps {
  qrCode: string | null;
  loading: boolean;
}

export default function QRCodeDisplay({ qrCode, loading }: QRCodeDisplayProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <span className="material-icons text-6xl text-primary">qr_code_scanner</span>
          </div>
          <CardTitle className="text-2xl">Conectar ao WhatsApp</CardTitle>
          <CardDescription>
            Escaneie o código QR com seu WhatsApp para conectar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : qrCode ? (
            <div className="bg-white p-4 rounded-lg">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-64 h-64"
                data-testid="img-qrcode"
              />
            </div>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-muted-foreground text-sm text-center p-4">
              Aguardando código QR...
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Abra o WhatsApp no seu celular, vá em Configurações e selecione "Aparelhos conectados"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
