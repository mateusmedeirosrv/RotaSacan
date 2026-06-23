export default function OfflinePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">Você está offline</h1>
      <p className="text-sm text-muted-foreground">
        Esta página ainda não foi carregada antes e não está disponível sem conexão. As
        bipagens continuam funcionando normalmente quando a conexão voltar.
      </p>
    </main>
  );
}
