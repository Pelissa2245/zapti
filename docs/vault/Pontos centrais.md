---
tipo: "hub"
tags:
  - "graphify/pontos-centrais"
  - "hub"
---

# Pontos Centrais do Grafo ZapTI

> Nos mais conectados ("god nodes") e conexoes surpreendentes entre comunidades.

## God Nodes (Nos Mais Conectados)

- [[apps_web_package-web-package.json.md]] -- **58 edges** -- web/package.json (`code`) -- *Comunidade: Web Package Configuration*
- [[apps_api_src_app-app.ts.md]] -- **57 edges** -- app.ts (`code`) -- *Comunidade: API Bootstrap & Middleware*
- [[apps_api_src_index-api-src-index.ts.md]] -- **47 edges** -- api/src/index.ts (`code`) -- *Comunidade: API Bootstrap & Middleware*
- [[packages_shared_src_utils_index-utils-index.ts.md]] -- **41 edges** -- utils/index.ts (`code`) -- *Comunidade: Shared Utility Functions*
- [[apps_web_package_dependencies-dependencies.md]] -- **41 edges** -- dependencies (`code`) -- *Comunidade: Web UI Component Dependencies*
- [[apps_api_src_services_whatsapp-whatsapp.ts.md]] -- **38 edges** -- whatsapp.ts (`code`) -- *Comunidade: Automation Engine Execution*
- [[packages_shared_src_validation_index-validation-index.ts.md]] -- **35 edges** -- validation/index.ts (`code`) -- *Comunidade: Validation Schemas (Zod)*
- [[packages_shared_src_types_index-types-index.ts.md]] -- **33 edges** -- types/index.ts (`code`) -- *Comunidade: Shared TypeScript Types*
- [[ref_fastify-fastify.md]] -- **31 edges** -- fastify (`concept`) -- *Comunidade: API Bootstrap & Middleware*
- [[apps_api_package-api-package.json.md]] -- **29 edges** -- api/package.json (`code`) -- *Comunidade: API Package Dependencies*
- [[apps_api_src_app_buildapp-buildApp().md]] -- **27 edges** -- buildApp() (`code`) -- *Comunidade: API Bootstrap & Middleware*
- [[apps_api_src_routes_index-routes-index.ts.md]] -- **26 edges** -- routes/index.ts (`code`) -- *Comunidade: API Bootstrap & Middleware*
- [[apps_api_src_routes_auth-routes-auth.ts.md]] -- **26 edges** -- routes/auth.ts (`code`) -- *Comunidade: Authentication Routes & Handlers*
- [[apps_api_src_routes_integrations-routes-integrations.ts.md]] -- **24 edges** -- routes/integrations.ts (`code`) -- *Comunidade: API Bootstrap & Middleware*
- [[apps_api_src_services_prisma-prisma.ts.md]] -- **24 edges** -- prisma.ts (`code`) -- *Comunidade: API Bootstrap & Middleware*

## Conexoes Surpreendentes (Cross-Community)

*Arestas que conectam comunidades diferentes -- indicam acoplamento arquitetural:*

- [[apps_api_src_app_buildapp-buildApp().md]] -> [[apps_api_src_services_automation_triggerautomations-triggerAutomations().md]] -- **calls** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[apps_api_src_routes_webhooks_evolutionwebhookroutes-evolutionWebhookRoutes().md]] -> [[apps_api_src_services_whatsapp_processevolutionwebhook-processEvolutionWebhook().md]] -- **calls** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[packages_shared_src_email_index_gettransporter-getTransporter().md]] -> [[packages_shared_src_config_index_config-config().md]] -- **calls** -- *Email Service -> Auth Utilities (JWT & Password)*
- [[packages_shared_src_email_index_sendemail-sendEmail().md]] -> [[packages_shared_src_config_index_config-config().md]] -- **calls** -- *Email Service -> Auth Utilities (JWT & Password)*
- [[apps_api_src_services_prisma-prisma.ts.md]] -> [[packages_database_dist_index.md]] -- **re_exports** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_validation_index-validation-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Validation Schemas (Zod)*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_constants_index-constants-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Shared Constants & Enums*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_email_index-email-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Email Service*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_notification_index-notification-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Shared Constants & Enums*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_utils_index-utils-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Shared Utility Functions*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_auth_index-auth-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Auth Utilities (JWT & Password)*
- [[packages_shared_src_index-shared-src-index.ts.md]] -> [[packages_shared_src_types_index-types-index.ts.md]] -- **re_exports** -- *Config Validation (Zod Env) -> Shared TypeScript Types*
- [[apps_api_src_routes_automations_automationroutes-automationRoutes().md]] -> [[apps_api_src_services_automation-automation.ts.md]] -- **imports_from** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[apps_api_src_routes_campaigns_campaignroutes-campaignRoutes().md]] -> [[apps_api_src_services_campaign-campaign.ts.md]] -- **imports_from** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[apps_api_src_routes_conversations_conversationroutes-conversationRoutes().md]] -> [[apps_api_src_services_whatsapp-whatsapp.ts.md]] -- **imports_from** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[apps_api_src_routes_integrations_integrationroutes-integrationRoutes().md]] -> [[apps_api_src_services_integration-integration.ts.md]] -- **imports_from** -- *API Bootstrap & Middleware -> Integration Testing Services*
- [[apps_api_src_routes_messages_messageroutes-messageRoutes().md]] -> [[apps_api_src_services_whatsapp-whatsapp.ts.md]] -- **imports_from** -- *API Bootstrap & Middleware -> Automation Engine Execution*
- [[apps_api_package-api-package.json.md]] -> [[ref_fastify-fastify.md]] -- **imports** -- *API Package Dependencies -> API Bootstrap & Middleware*
- [[apps_api_src_app-app.ts.md]] -> [[apps_api_src_routes_auth_authroutes-authRoutes().md]] -- **imports** -- *API Bootstrap & Middleware -> Authentication Routes & Handlers*
- [[apps_api_src_app-app.ts.md]] -> [[apps_api_src_services_automation_triggerautomations-triggerAutomations().md]] -- **imports** -- *API Bootstrap & Middleware -> Automation Engine Execution*

---
*Gerado automaticamente por `npm run graph:obsidian`*