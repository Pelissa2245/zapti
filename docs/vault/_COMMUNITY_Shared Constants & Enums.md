---
type: community
cohesion: 0.08
members: 32
---

# Shared Constants & Enums

**Cohesion:** 0.08 - loosely connected
**Members:** 32 nodes

## Members
- [[AUTOMATION_TRIGGERS]] - code - packages/shared/src/constants/index.ts
- [[CAMPAIGN_STATUS]] - code - packages/shared/src/constants/index.ts
- [[CONVERSATION_PRIORITY]] - code - packages/shared/src/constants/index.ts
- [[CONVERSATION_STATUS]] - code - packages/shared/src/constants/index.ts
- [[ERROR_CODES]] - code - packages/shared/src/constants/index.ts
- [[FILE_UPLOAD]] - code - packages/shared/src/constants/index.ts
- [[INTEGRATION_TYPES]] - code - packages/shared/src/constants/index.ts
- [[MESSAGE_DIRECTION]] - code - packages/shared/src/constants/index.ts
- [[MESSAGE_STATUS]] - code - packages/shared/src/constants/index.ts
- [[MESSAGE_TYPE]] - code - packages/shared/src/constants/index.ts
- [[NotificationPayload]] - code - packages/shared/src/notification/index.ts
- [[PAGINATION_DEFAULTS]] - code - packages/shared/src/constants/index.ts
- [[REGEX]] - code - packages/shared/src/constants/index.ts
- [[SETTING_KEYS]] - code - packages/shared/src/constants/index.ts
- [[TICKET_PRIORITY]] - code - packages/shared/src/constants/index.ts
- [[TICKET_STATUS]] - code - packages/shared/src/constants/index.ts
- [[USER_ROLES]] - code - packages/shared/src/constants/index.ts
- [[WEBHOOK_EVENTS]] - code - packages/shared/src/constants/index.ts
- [[WEBSOCKET_EVENTS]] - code - packages/shared/src/constants/index.ts
- [[WebSocketPayload]] - code - packages/shared/src/notification/index.ts
- [[broadcastToConversation()]] - code - packages/shared/src/notification/index.ts
- [[broadcastToTenant()]] - code - packages/shared/src/notification/index.ts
- [[broadcastToUser()]] - code - packages/shared/src/notification/index.ts
- [[broadcastToWebsocket()]] - code - packages/shared/src/notification/index.ts
- [[constantsindex.ts]] - code - packages/shared/src/constants/index.ts
- [[crypto]] - code - crypto
- [[notificationindex.ts]] - code - packages/shared/src/notification/index.ts
- [[ref_axios]] - concept
- [[ref_socket_io]] - concept
- [[sendErrorNotification()]] - code - packages/shared/src/notification/index.ts
- [[sendNotification()]] - code - packages/shared/src/notification/index.ts
- [[sendNotificationEmail()]] - code - packages/shared/src/notification/index.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Shared_Constants__Enums
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Config Validation (Zod Env)]]
- 1 edge to [[_COMMUNITY_Authentication Routes & Handlers]]
- 1 edge to [[_COMMUNITY_API Bootstrap & Middleware]]

## Top bridge nodes
- [[notificationindex.ts]] - degree 16, connects to 2 communities
- [[constantsindex.ts]] - degree 20, connects to 1 community
- [[ref_socket_io]] - degree 2, connects to 1 community