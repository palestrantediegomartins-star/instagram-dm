export const metadata = {
  title: "Termos de Serviço — DM Automática",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold">Termos de Serviço</h1>
        <p className="text-sm text-slate-500">
          Última atualização: 13 de agosto de 2026
        </p>

        <p>
          Este aplicativo é uma ferramenta privada de automação de mensagens do
          Instagram, operada por Diego Martins. Ao interagir com a nossa conta
          do Instagram (por comentários ou mensagens diretas), você concorda com
          estes termos.
        </p>

        <h2 className="text-lg font-semibold">O que o serviço faz</h2>
        <p>
          Quando você comenta uma palavra-chave em uma publicação da nossa conta
          ou nos envia essa palavra-chave por mensagem direta, o aplicativo envia
          automaticamente uma resposta com o conteúdo solicitado (por exemplo, um
          link). O serviço responde apenas a interações iniciadas por você.
        </p>

        <h2 className="text-lg font-semibold">Uso adequado</h2>
        <p>
          O serviço é oferecido &quot;como está&quot;, sem garantias de
          disponibilidade contínua. Podemos alterar, pausar ou encerrar as
          automações a qualquer momento, sem aviso prévio.
        </p>

        <h2 className="text-lg font-semibold">Privacidade</h2>
        <p>
          O tratamento de dados pessoais é descrito na nossa{" "}
          <a href="/privacidade" className="text-emerald-600 underline">
            Política de Privacidade
          </a>
          .
        </p>

        <h2 className="text-lg font-semibold">Contato</h2>
        <p>
          Dúvidas podem ser enviadas para{" "}
          <a
            href="mailto:palestrantediegomartins@gmail.com"
            className="text-emerald-600 underline"
          >
            palestrantediegomartins@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
