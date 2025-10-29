import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AddNumberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (phone: string, label: string) => void;
}

export default function AddNumberModal({
  open,
  onOpenChange,
  onAdd,
}: AddNumberModalProps) {
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && label) {
      onAdd(phone, label);
      setPhone("");
      setLabel("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Número Autorizado</DialogTitle>
          <DialogDescription>
            Adicione um novo número que poderá receber respostas automáticas
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input
                id="phone"
                placeholder="+351912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Formato: código do país + número (ex: +351912345678)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Nome/Etiqueta</Label>
              <Input
                id="label"
                placeholder="João Silva"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                data-testid="input-label"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-add">
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
