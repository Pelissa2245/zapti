// ZapTI Web — Terms of Service Page
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="mb-8 flex items-center gap-2">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Termos de Serviço</h1>
          </div>

          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Ao acessar e utilizar o ZapTI, você concorda em cumprir e estar vinculado a estes Termos de Serviço.
                Se você não concordar com qualquer parte destes termos, não deve utilizar o serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">2. Descrição do Serviço</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                O ZapTI é uma plataforma de helpdesk multi-tenant para WhatsApp, permitindo gerenciar conversas,
                tickets, automações e integrações. O serviço é fornecido "como está" e "conforme disponível".
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">3. Contas de Usuário</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Para utilizar o ZapTI, você deve criar uma conta. Você é responsável por manter a confidencialidade
                de suas credenciais e por todas as atividades que ocorram em sua conta. Você concorda em fornecer
                informações precisas e atualizadas durante o registro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">4. Uso Aceitável</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Você concorda em não utilizar o serviço para:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                <li>Violar quaisquer leis ou regulamentos aplicáveis</li>
                <li>Enviar spam, mensagens não solicitadas ou conteúdo abusivo</li>
                <li>Tentar acessar dados ou sistemas sem autorização</li>
                <li>Interferir na operação do serviço ou de servidores</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">5. Dados e Privacidade</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                O tratamento de seus dados pessoais é regido pela nossa <Link href="/privacy" className="underline hover:text-primary-600 dark:hover:text-primary-400">Política de Privacidade</Link>.
                Ao utilizar o serviço, você consente com a coleta e uso de informações conforme descrito nessa política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">6. Propriedade Intelectual</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Todo o conteúdo, recursos e funcionalidades do ZapTI (exceto o conteúdo fornecido pelos usuários)
                são de propriedade exclusiva do ZapTI e estão protegidos por leis de propriedade intelectual.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Em nenhuma hipótese o ZapTI será responsável por danos indiretos, incidentais, especiais,
                consequenciais ou punitivos, incluindo perda de lucros, dados ou oportunidades de negócio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">8. Modificações ao Serviço</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Reservamos o direito de modificar, suspender ou descontinuar o serviço a qualquer momento,
                com ou sem aviso prévio. Não seremos responsáveis por quaisquer modificações, suspensões
                ou descontinuidade do serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">9. Rescisão</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por violação destes
                Termos. Após a rescisão, seu direito de usar o serviço cessará imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">10. Lei Aplicável e Jurisdição</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Estes Termos serão regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa
                decorrente destes Termos será submetida à jurisdição exclusiva dos tribunais brasileiros.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                <strong>Última atualização:</strong> Janeiro de 2025
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}