import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-6">
          <span className="font-semibold text-emerald-400">DM Automática</span>
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            Painel
          </Link>
          <Link
            href="/automations"
            className="text-sm text-slate-300 hover:text-white"
          >
            Automações
          </Link>
          <Link
            href="/atividade"
            className="text-sm text-slate-300 hover:text-white"
          >
            Atividade
          </Link>
          <form action={logout} className="ml-auto">
            <button className="text-sm text-slate-500 hover:text-slate-300">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
