import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AuthorizedNumber {
  id: string;
  phone: string;
  label: string;
  dateAdded: string;
}

interface AuthorizedNumbersProps {
  numbers: AuthorizedNumber[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function AuthorizedNumbers({
  numbers,
  onAdd,
  onDelete,
}: AuthorizedNumbersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Números Autorizados</CardTitle>
            <CardDescription>
              Gerencie os números que podem receber respostas automáticas
            </CardDescription>
          </div>
          <Button onClick={onAdd} data-testid="button-add-number">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Número
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {numbers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum número autorizado ainda</p>
            <p className="text-sm mt-2">Adicione números para começar</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Telefone</TableHead>
                    <TableHead>Nome/Etiqueta</TableHead>
                    <TableHead>Data Adicionada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numbers.map((number) => (
                    <TableRow key={number.id} data-testid={`row-number-${number.id}`}>
                      <TableCell className="font-mono" data-testid={`text-phone-${number.id}`}>
                        {number.phone}
                      </TableCell>
                      <TableCell data-testid={`text-label-${number.id}`}>
                        {number.label}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {number.dateAdded}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(number.id)}
                          data-testid={`button-delete-${number.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-4">
              {numbers.map((number) => (
                <Card key={number.id} data-testid={`card-number-${number.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-mono font-medium" data-testid={`text-phone-${number.id}`}>
                          {number.phone}
                        </p>
                        <p className="text-sm mt-1" data-testid={`text-label-${number.id}`}>
                          {number.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {number.dateAdded}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(number.id)}
                        data-testid={`button-delete-${number.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
