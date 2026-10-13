---
type: community
cohesion: 0.06
members: 120
---

# API Bootstrap & Middleware

**Cohesion:** 0.06 - loosely connected
**Members:** 120 nodes

## Members
- [[AuditQueryParams]] - code - apps/api/src/routes/audit.ts
- [[AuthenticatedRequest]] - code - apps/api/src/routes/audit.ts
- [[AuthenticatedSocket]] - code - apps/api/src/services/websocket.ts
- [[TenantWithMeta]] - code - apps/api/src/middleware/index.ts
- [[TenantWithMeta_1]] - code - apps/api/src/plugins/auth.ts
- [[TenantWithMeta_2]] - code - apps/api/src/plugins/tenant.ts
- [[apisrcindex.ts]] - code - apps/api/src/index.ts
- [[app.ts]] - code - apps/api/src/app.ts
- [[apps_api_src_routes_webhooks_genericwebhookroutes]] - concept
- [[apps_api_src_routes_webhooks_leadcaptureroutes]] - concept
- [[apps_api_src_services_automation_automationtrigger]] - concept
- [[apps_api_src_services_prisma_prisma]] - concept
- [[audit.ts]] - code - apps/api/src/routes/audit.ts
- [[auditRoutes()]] - code - apps/api/src/routes/audit.ts
- [[authPlugin()]] - code - apps/api/src/plugins/auth.ts
- [[automationRoutes()]] - code - apps/api/src/routes/automations.ts
- [[automations.ts]] - code - apps/api/src/routes/automations.ts
- [[buildApp()]] - code - apps/api/src/app.ts
- [[buildApp()_1]] - code - apps/api/src/index.ts
- [[campaignRoutes()]] - code - apps/api/src/routes/campaigns.ts
- [[campaigns.ts]] - code - apps/api/src/routes/campaigns.ts
- [[contactRoutes()]] - code - apps/api/src/routes/contacts.ts
- [[contacts.ts]] - code - apps/api/src/routes/contacts.ts
- [[conversationRoutes()]] - code - apps/api/src/routes/conversations.ts
- [[conversations.ts]] - code - apps/api/src/routes/conversations.ts
- [[cors.ts]] - code - apps/api/src/plugins/cors.ts
- [[corsPlugin()]] - code - apps/api/src/plugins/cors.ts
- [[errorHandler()]] - code - apps/api/src/middleware/errorHandler.ts
- [[errorHandler.ts]] - code - apps/api/src/middleware/errorHandler.ts
- [[evolutionWebhookRoutes()]] - code - apps/api/src/routes/webhooks.ts
- [[fastify]] - concept - apps/api/package.json
- [[getActionConfigSchema()]] - code - apps/api/src/routes/automations.ts
- [[getActionDescription()]] - code - apps/api/src/routes/automations.ts
- [[getIO()]] - code - apps/api/src/services/websocket.ts
- [[getIntegrationConfigSchema()]] - code - apps/api/src/routes/integrations.ts
- [[getIntegrationDescription()]] - code - apps/api/src/routes/integrations.ts
- [[getTriggerDescription()]] - code - apps/api/src/routes/automations.ts
- [[groupRoutes()]] - code - apps/api/src/routes/groups.ts
- [[groups.ts]] - code - apps/api/src/routes/groups.ts
- [[healthRoutes()]] - code - apps/api/src/routes/health.ts
- [[integrationRoutes()]] - code - apps/api/src/routes/integrations.ts
- [[logging.ts]] - code - apps/api/src/plugins/logging.ts
- [[loggingPlugin()]] - code - apps/api/src/plugins/logging.ts
- [[messageRoutes()]] - code - apps/api/src/routes/messages.ts
- [[messages.ts]] - code - apps/api/src/routes/messages.ts
- [[middlewareindex.ts]] - code - apps/api/src/middleware/index.ts
- [[multipart.ts]] - code - apps/api/src/plugins/multipart.ts
- [[multipartPlugin()]] - code - apps/api/src/plugins/multipart.ts
- [[packages_database_dist_index_prisma]] - concept
- [[packages_shared_dist_auth_index]] - concept
- [[packages_shared_dist_auth_index_jwtpayload]] - concept
- [[packages_shared_dist_auth_index_verifytoken]] - concept
- [[packages_shared_dist_config_index]] - concept
- [[packages_shared_dist_config_index_config]] - concept
- [[packages_shared_dist_constants_index]] - concept
- [[packages_shared_dist_constants_index_automation_action]] - concept
- [[packages_shared_dist_constants_index_automation_trigger]] - concept
- [[packages_shared_dist_constants_index_campaign_status]] - concept
- [[packages_shared_dist_constants_index_contact_source]] - concept
- [[packages_shared_dist_constants_index_contact_status]] - concept
- [[packages_shared_dist_constants_index_conversation_priority]] - concept
- [[packages_shared_dist_constants_index_conversation_status]] - concept
- [[packages_shared_dist_constants_index_error_codes]] - concept
- [[packages_shared_dist_constants_index_integration_status]] - concept
- [[packages_shared_dist_constants_index_integration_type]] - concept
- [[packages_shared_dist_constants_index_message_direction]] - concept
- [[packages_shared_dist_constants_index_message_status]] - concept
- [[packages_shared_dist_constants_index_message_type]] - concept
- [[packages_shared_dist_constants_index_setting_keys]] - concept
- [[packages_shared_dist_constants_index_template_status]] - concept
- [[packages_shared_dist_constants_index_ticket_priority]] - concept
- [[packages_shared_dist_constants_index_ticket_status]] - concept
- [[packages_shared_dist_constants_index_user_roles]] - concept
- [[packages_shared_dist_constants_index_webhook_events]] - concept
- [[packages_shared_dist_constants_index_websocket_events]] - concept
- [[packages_shared_dist_notification_index]] - concept
- [[packages_shared_dist_notification_index_broadcasttowebsocket]] - concept
- [[packages_shared_dist_validation_index]] - concept
- [[packages_shared_dist_validation_index_idparamschema]] - concept
- [[packages_shared_dist_validation_index_paginationqueryschema]] - concept
- [[packages_shared_dist_validation_index_searchqueryschema]] - concept
- [[packages_shared_dist_validation_index_updatesettingsschema]] - concept
- [[pluginsauth.ts]] - code - apps/api/src/plugins/auth.ts
- [[prisma.ts]] - code - apps/api/src/services/prisma.ts
- [[processWhatsAppWebhook()]] - code - apps/api/src/services/whatsapp.ts
- [[rateLimit.ts]] - code - apps/api/src/plugins/rateLimit.ts
- [[rateLimitPlugin()]] - code - apps/api/src/plugins/rateLimit.ts
- [[ref_dotenv]] - concept
- [[ref_fastify_plugin]] - concept
- [[ref_zod]] - concept
- [[registerMiddleware()]] - code - apps/api/src/middleware/index.ts
- [[registerWebhookRoutes()]] - code - apps/api/src/routes/webhooks.ts
- [[routeshealth.ts]] - code - apps/api/src/routes/health.ts
- [[routesindex.ts]] - code - apps/api/src/routes/index.ts
- [[routesintegrations.ts]] - code - apps/api/src/routes/integrations.ts
- [[sanitizeConfig()]] - code - apps/api/src/routes/integrations.ts
- [[settingRoutes()]] - code - apps/api/src/routes/settings.ts
- [[settings.ts]] - code - apps/api/src/routes/settings.ts
- [[setupHealthCheck()]] - code - apps/api/src/utils/health.ts
- [[setupWebSocket()]] - code - apps/api/src/services/websocket.ts
- [[start()]] - code - apps/api/src/app.ts
- [[start()_1]] - code - apps/api/src/index.ts
- [[swagger.ts]] - code - apps/api/src/plugins/swagger.ts
- [[swaggerPlugin()]] - code - apps/api/src/plugins/swagger.ts
- [[templateRoutes()]] - code - apps/api/src/routes/templates.ts
- [[templates.ts]] - code - apps/api/src/routes/templates.ts
- [[tenant.ts]] - code - apps/api/src/plugins/tenant.ts
- [[tenantPlugin()]] - code - apps/api/src/plugins/tenant.ts
- [[tenantRoutes()]] - code - apps/api/src/routes/tenants.ts
- [[tenants.ts]] - code - apps/api/src/routes/tenants.ts
- [[ticketRoutes()]] - code - apps/api/src/routes/tickets.ts
- [[tickets.ts]] - code - apps/api/src/routes/tickets.ts
- [[userRoutes()]] - code - apps/api/src/routes/users.ts
- [[users.ts]] - code - apps/api/src/routes/users.ts
- [[utilshealth.ts]] - code - apps/api/src/utils/health.ts
- [[validateIntegrationConfig()]] - code - apps/api/src/routes/integrations.ts
- [[webhookRoutes()]] - code - apps/api/src/routes/webhooks.ts
- [[webhooks.ts]] - code - apps/api/src/routes/webhooks.ts
- [[websocket.ts]] - code - apps/api/src/services/websocket.ts
- [[whatsappWebhookRoutes()]] - code - apps/api/src/routes/webhooks.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API_Bootstrap__Middleware
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_Automation Engine Execution]]
- 17 edges to [[_COMMUNITY_Authentication Routes & Handlers]]
- 11 edges to [[_COMMUNITY_API Package Dependencies]]
- 4 edges to [[_COMMUNITY_Integration Testing Services]]
- 1 edge to [[_COMMUNITY_Shared Constants & Enums]]
- 1 edge to [[_COMMUNITY_Config Validation (Zod Env)]]
- 1 edge to [[_COMMUNITY_Validation Schemas (Zod)]]

## Top bridge nodes
- [[ref_zod]] - degree 18, connects to 3 communities
- [[packages_shared_dist_config_index]] - degree 15, connects to 3 communities
- [[packages_shared_dist_config_index_config]] - degree 15, connects to 3 communities
- [[app.ts]] - degree 57, connects to 2 communities
- [[fastify]] - degree 31, connects to 2 communities