import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface WhatsAppState {
  isConnected: boolean;
  qrCode: string | null;
  loading: boolean;
}

export function useWhatsApp() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<WhatsAppState>({
    isConnected: false,
    qrCode: null,
    loading: false,
  });

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Conectado ao servidor WebSocket");
    });

    newSocket.on("qr-code", (qrImage: string) => {
      console.log("QR Code recebido");
      setState((prev) => ({
        ...prev,
        qrCode: qrImage,
        loading: false,
      }));
    });

    newSocket.on("whatsapp-ready", () => {
      console.log("WhatsApp conectado!");
      setState((prev) => ({
        ...prev,
        isConnected: true,
        qrCode: null,
        loading: false,
      }));
    });

    newSocket.on("whatsapp-authenticated", () => {
      console.log("WhatsApp autenticado");
    });

    newSocket.on("whatsapp-disconnected", () => {
      console.log("WhatsApp desconectado");
      setState((prev) => ({
        ...prev,
        isConnected: false,
        qrCode: null,
        loading: false,
      }));
    });

    newSocket.on("error", (error: string) => {
      console.error("Erro do WhatsApp:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      setState((prev) => ({ ...prev, loading: true }));
      socket.emit("initialize-whatsapp");
    }
  }, [socket]);

  const initialize = () => {
    if (socket) {
      setState((prev) => ({ ...prev, loading: true }));
      socket.emit("initialize-whatsapp");
    }
  };

  return {
    ...state,
    initialize,
    socket,
  };
}
