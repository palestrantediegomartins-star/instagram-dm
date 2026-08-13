export const metadata = {
  title: "Política de Privacidade — DM Automática",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold">Política de Privacidade</h1>
        <p className="text-sm text-slate-500">
          Última atualização: 13 de agosto de 2026
        </p>

        <p>
          Este aplicativo é uma ferramenta privada de automação de mensagens do
          Instagram, operada por Diego Martins (&quot;nós&quot;). Ele responde
          automaticamente, por mensagem direta, a pessoas que comentam
          palavras-chave nas publicações da nossa própria conta do Instagram ou
          que nos enviam mensagens diretas com essas palavras-chave.
        </p>

        <h2 className="text-lg font-semibold">Quais dados coletamos</h2>
        <p>
          Ao interagir com a nossa conta do Instagram (comentando uma publicação
          ou enviando uma mensagem), podemos receber e armazenar: o identificador
          e o nome de usuário do seu perfil no Instagram, o texto do comentário
          ou da mensagem que acionou a automação, e a data e hora da interação.
          Esses dados são fornecidos pela plataforma da Meta por meio das APIs
          oficiais do Instagram.
        </p>

        <h2 className="text-lg font-semibold">Como usamos os dados</h2>
        <p>
          Os dados são usados exclusivamente para: enviar a você a mensagem
          automática com o conteúdo solicitado, evitar envios duplicados e manter
          um registro interno de atividade. Não vendemos, alugamos nem
          compartilhamos seus dados com terceiros. Não enviamos mensagens não
          solicitadas (spam).
        </p>

        <h2 className="text-lg font-semibold">Armazenamento e segurança</h2>
        <p>
          Os dados ficam armazenados em banco de dados seguro (Supabase) com
          acesso restrito ao servidor da aplicação. Tokens de acesso são
          guardados de forma protegida e nunca são expostos publicamente.
        </p>

        <h2 className="text-lg font-semibold">Exclusão de dados</h2>
        <p>
          Você pode solicitar a exclusão dos seus dados a qualquer momento
          enviando um e-mail para{" "}
          
            href="mailto:palestrantediegomartins@gmail.com"
            className="text-emerald-600 underline"
          >
            palestrantediegomartins@gmail.com
          </a>{" "}
          com o seu nome de usuário do Instagram. Atenderemos a solicitação em
          até 7 dias. Ao remover o acesso do aplicativo nas configurações do seu
          Instagram, novos dados deixam de ser coletados.
        </p>

        <h2 className="text-lg font-semibold">Contato</h2>
        <p>
          Dúvidas sobre esta política podem ser enviadas para{" "}
          
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
