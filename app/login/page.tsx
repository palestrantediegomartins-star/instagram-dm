"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5"
      >
        <div>
          <h1 className="text-xl font-semibold">Automação de DM</h1>
          <p className="text-sm text-slate-400 mt-1">
            Entre com a senha do painel.
          </p>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Senha"
          autoFocus
          required
          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5 outline-none focus:border-emerald-500"
        />
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 font-medium"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
