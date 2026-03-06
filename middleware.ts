import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Middleware não verifica auth — AppShell faz o redirect
  // Só protege contra acesso direto a rotas internas sem JS
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
