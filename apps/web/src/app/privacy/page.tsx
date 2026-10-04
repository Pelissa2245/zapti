// ZapTI Web — Privacy Policy Page
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Política de Privacidade</h1>
          </div>

          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">1. Introdução</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                A sua privacidade é importante para nós. Esta Política de Privacidade explica como o ZapTI
                ("nós", "nosso", "a plataforma") coleta, usa, divulga e protege suas informações quando você
                utiliza nosso serviço de helpdesk para WhatsApp.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">2. Informações que Coletamos</h2>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">2.1 Informações que você fornece</h3>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                <li>Dados de conta: nome, email, senha (hasheada), foto de perfil</li>
                <li>Configurações de preferência: idioma, fuso horário, notificações</li>
                <li>Dados de onboarding: nome da empresa/tenant</li>
              </ul>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-4 mb-2">2.2 Informações coletadas automaticamente</h3>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                <li>Logs de acesso: IP, user agent, timestamps, ações realizadas</li>
                <li>Dados de sessão: tokens, refresh tokens, expiração</li>
                <li>Métricas de uso: funcionalidades acessadas, tempo de sessão</li>
              </ul>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-4 mb-2">2.3 Dados do WhatsApp</h3>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                <li>Mensagens recebidas/enviadas através das instâncias conectadas</li>
                <li>Contatos: nome, número de telefone, foto de perfil, metadados</li>
                <li>Conversas e tickets associados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">3. Como Usamos suas Informações</h2>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>Fornecer, manter e melhorar o serviço</li>
                <li>Processar transações e enviar comunicações relacionadas</li>
                <li>Enviar notificações técnicas, atualizações e alertas de segurança</li>
                <li>Responder a solicitações de suporte</li>
                <li>Detectar, prevenir e resolver problemas técnicos e de segurança</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Personalizar a experiência do usuário</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">4. Compartilhamento de Informações</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar dados nas seguintes circunstâncias:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li><strong>Dentro da sua organização:</strong> Dados são visíveis para membros do mesmo tenant conforme permissões</li>
                <li><strong>Provedores de serviço:</strong> Hospedagem, email, analytics (com contratos de proteção de dados)</li>
                <li><strong>Obrigations legais:</strong> Quando exigido por lei, ordem judicial ou regulamento</li>
                <li><strong>Transferência de negócio:</strong> Em caso de fusão, aquisição ou venda de ativos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">5. Segurança dos Dados</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Implementamos medidas de segurança técnicas e organizacionais apropriadas:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256)</li>
                <li>Senhas hasheadas com Argon2id</li>
                <li>Tokens JWT com expiração curta e refresh tokens rotativos</li>
                <li>Autenticação de dois fatores (2FA) opcional</li>
                <li>Logs de auditoria para ações sensíveis</li>
                <li>Backups criptografados e testados regularmente</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">6. Retenção de Dados</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Mantemos seus dados apenas pelo tempo necessário:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>Dados de conta: enquanto a conta estiver ativa</li>
                <li>Logs de auditoria: 2 anos</li>
                <li>Mensagens WhatsApp: conforme configuração do tenant (padrão: 1 ano)</li>
                <li>Backups: 30 dias (rotação automática)</li>
                <li>Dados anonimizados para analytics: indefinidamente</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">7. Seus Direitos</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
                <li>Portabilidade dos dados a outro fornecedor</li>
                <li>Eliminar dados tratados com consentimento</li>
                <li>Informação sobre compartilhamento</li>
                <li>Revogar consentimento</li>
                <li>Opor-se a tratamento irregular</li>
              </ul>
              <p className="text-slate-600 dark:text-slate-300 mt-4">
                Para exercer seus direitos, entre em contato: <a href="mailto:privacidade@zapti.local" className="underline hover:text-primary-600 dark:hover:text-primary-400">privacidade@zapti.local</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">8. Cookies e Tecnologias Similares</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Utilizamos cookies essenciais para:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>Autenticação e sessão (HttpOnly, Secure, SameSite=Lax)</li>
                <li>Preferências de tema (localStorage)</li>
                <li>Prevenção de CSRF</li>
              </ul>
              <p className="text-slate-600 dark:text-slate-300 mt-4">
                Não utilizamos cookies de rastreamento ou publicidade de terceiros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">9. Transferência Internacional</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Seus dados podem ser processados em servidores localizados no Brasil. Caso haja transferência
                internacional, garantiremos proteção adequada conforme a LGPD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">10. Alterações a esta Política</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Podemos atualizar esta política periodicamente. Notificaremos sobre alterações materiais
                através do serviço ou por email. O uso contínuo após alterações constitui aceitação.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                <strong>Última atualização:</strong> Janeiro de 2025
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">11. Contato</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Dúvidas sobre esta política ou seus dados? Entre em contato:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                <li>Email: <a href="mailto:privacidade@zapti.local" className="underline hover:text-primary-600 dark:hover:text-primary-400">privacidade@zapti.local</a></li>
                <li>Encarregado de Proteção de Dados (DPO): Disponível mediante solicitação</li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}