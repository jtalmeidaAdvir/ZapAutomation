import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { insertSettingsSchema, type Settings as SettingsType, type InsertSettings } from "@shared/schema";

export default function Settings() {
  const { logout, user } = useAuth();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SettingsType | null>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      username: "",
      password: "",
      company: "",
      url: "",
      instance: "",
      line: "",
      grantType: "",
    },
    values: settings ? {
      username: settings.username,
      password: settings.password,
      company: settings.company,
      url: settings.url,
      instance: settings.instance,
      line: settings.line,
      grantType: settings.grantType,
    } : undefined,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: InsertSettings) => {
      // Attempt to install missing libraries if libgbm.so.1 is not found
      // This is a workaround for Replit environment issues
      try {
        await apiRequest("POST", "/api/install-deps", { libraries: ["libgbm1"] });
      } catch (error) {
        console.error("Failed to install libgbm1:", error);
      }
      return await apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSettings) => {
    saveSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
            <CardDescription>
              Configure os parâmetros de conexão e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-username">Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Digite o username"
                          data-testid="input-settings-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-password">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Digite o password"
                          data-testid="input-settings-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-company">Company</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Digite a company"
                          data-testid="input-settings-company"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-url">URL da Empresa</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="Digite a URL da empresa"
                          data-testid="input-settings-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-instance">Instance</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Digite a instance"
                          data-testid="input-settings-instance"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="line"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-line">Line</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Digite a line"
                          data-testid="input-settings-line"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-settings-grant-type">Grant Type</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Digite o grant type"
                          data-testid="input-settings-grant-type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}