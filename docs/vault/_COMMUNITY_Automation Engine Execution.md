---
type: community
cohesion: 0.06
members: 59
---

# Automation Engine Execution

**Cohesion:** 0.06 - loosely connected
**Members:** 59 nodes

## Members
- [[AutomationContext]] - code - apps/api/src/services/automation.ts
- [[CampaignJobData]] - code - apps/api/src/services/campaign.ts
- [[TODO Implement WhatsApp Business API webhook processing]] - rationale - apps/api/src/services/whatsapp.ts
- [[WhatsAppMessagePayload]] - code - apps/api/src/services/whatsapp.ts
- [[apps_api_src_services_whatsapp_getevolutionqrcode]] - concept
- [[apps_api_src_services_whatsapp_testevolutionconnection]] - concept
- [[automation.ts]] - code - apps/api/src/services/automation.ts
- [[buildEvolutionMessagePayload()]] - code - apps/api/src/services/whatsapp.ts
- [[buildTemplateComponents()]] - code - apps/api/src/services/whatsapp.ts
- [[buildWhatsAppBusinessPayload()]] - code - apps/api/src/services/whatsapp.ts
- [[campaign.ts]] - code - apps/api/src/services/campaign.ts
- [[cancelCampaign()]] - code - apps/api/src/services/campaign.ts
- [[evaluateConditions()]] - code - apps/api/src/services/automation.ts
- [[evaluateOperator()]] - code - apps/api/src/services/automation.ts
- [[executeAction()]] - code - apps/api/src/services/automation.ts
- [[executeAddTag()]] - code - apps/api/src/services/automation.ts
- [[executeAssignConversation()]] - code - apps/api/src/services/automation.ts
- [[executeAutomation()]] - code - apps/api/src/services/automation.ts
- [[executeCondition()]] - code - apps/api/src/services/automation.ts
- [[executeCreateTicket()]] - code - apps/api/src/services/automation.ts
- [[executeDelay()]] - code - apps/api/src/services/automation.ts
- [[executeSendMessage()]] - code - apps/api/src/services/automation.ts
- [[executeUpdateContact()]] - code - apps/api/src/services/automation.ts
- [[executeWebhook()]] - code - apps/api/src/services/automation.ts
- [[getEvolutionMediaType()]] - code - apps/api/src/services/whatsapp.ts
- [[getEvolutionMessageType()]] - code - apps/api/src/services/whatsapp.ts
- [[getWhatsAppBusinessType()]] - code - apps/api/src/services/whatsapp.ts
- [[markMessageDelivered()]] - code - apps/api/src/services/whatsapp.ts
- [[markMessageFailed()]] - code - apps/api/src/services/whatsapp.ts
- [[markMessageFailedByExternalId()]] - code - apps/api/src/services/whatsapp.ts
- [[markMessageRead()]] - code - apps/api/src/services/whatsapp.ts
- [[packages_database_dist_index]] - concept
- [[packages_database_dist_index_automationtrigger]] - concept
- [[packages_database_dist_index_campaignstatus]] - concept
- [[packages_database_dist_index_messagedirection]] - concept
- [[packages_database_dist_index_messagestatus]] - concept
- [[packages_database_dist_index_messagetype]] - concept
- [[packages_database_dist_index_prismaclient]] - concept
- [[pauseCampaign()]] - code - apps/api/src/services/campaign.ts
- [[prisma_2]] - code - apps/api/src/services/automation.ts
- [[prisma_3]] - code - apps/api/src/services/campaign.ts
- [[prisma_4]] - code - apps/api/src/services/whatsapp.ts
- [[processEvolutionConnectionUpdate()]] - code - apps/api/src/services/whatsapp.ts
- [[processEvolutionMessageUpdate()]] - code - apps/api/src/services/whatsapp.ts
- [[processEvolutionMessageUpsert()]] - code - apps/api/src/services/whatsapp.ts
- [[processEvolutionWebhook()]] - code - apps/api/src/services/whatsapp.ts
- [[resumeCampaign()]] - code - apps/api/src/services/campaign.ts
- [[scheduleCampaign()]] - code - apps/api/src/services/campaign.ts
- [[sendCampaign()]] - code - apps/api/src/services/campaign.ts
- [[sendViaEvolutionAPI()]] - code - apps/api/src/services/whatsapp.ts
- [[sendViaWhatsAppBusinessAPI()]] - code - apps/api/src/services/whatsapp.ts
- [[sendWhatsAppMessage()]] - code - apps/api/src/services/whatsapp.ts
- [[servicesintegrations.ts]] - code - apps/api/src/services/integrations.ts
- [[testIntegration()]] - code - apps/api/src/services/integrations.ts
- [[testSMTPConnection()]] - code - apps/api/src/services/integrations.ts
- [[testWebhookConnection()]] - code - apps/api/src/services/integrations.ts
- [[testWhatsAppBusinessConnection()]] - code - apps/api/src/services/integrations.ts
- [[triggerAutomations()]] - code - apps/api/src/services/automation.ts
- [[whatsapp.ts]] - code - apps/api/src/services/whatsapp.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Automation_Engine_Execution
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_API Bootstrap & Middleware]]
- 2 edges to [[_COMMUNITY_Integration Testing Services]]

## Top bridge nodes
- [[packages_database_dist_index]] - degree 6, connects to 2 communities
- [[whatsapp.ts]] - degree 38, connects to 1 community
- [[automation.ts]] - degree 22, connects to 1 community
- [[campaign.ts]] - degree 14, connects to 1 community
- [[servicesintegrations.ts]] - degree 9, connects to 1 community