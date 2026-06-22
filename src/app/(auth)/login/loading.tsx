import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-7 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}
