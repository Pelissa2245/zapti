---
type: community
cohesion: 0.17
members: 16
---

# Authentication Routes & Handlers

**Cohesion:** 0.17 - loosely connected
**Members:** 16 nodes

## Members
- [[AuthenticatedHandler]] - code - apps/api/src/routes/auth.ts
- [[AuthenticatedRequest_1]] - code - apps/api/src/routes/auth.ts
- [[authRoutes()]] - code - apps/api/src/routes/auth.ts
- [[generateInvitationToken()]] - code - apps/api/src/routes/auth.ts
- [[generateTokens()]] - code - apps/api/src/routes/auth.ts
- [[getAuthRequest()]] - code - apps/api/src/routes/auth.ts
- [[hashToken()]] - code - apps/api/src/routes/auth.ts
- [[packages_shared_dist_auth_index_extracttokenfromheader]] - concept
- [[packages_shared_dist_auth_index_generateaccesstoken]] - concept
- [[packages_shared_dist_auth_index_generaterefreshtoken]] - concept
- [[packages_shared_dist_auth_index_hashpassword]] - concept
- [[packages_shared_dist_auth_index_verifypassword]] - concept
- [[ref_crypto]] - concept
- [[routesauth.ts]] - code - apps/api/src/routes/auth.ts
- [[sendWebhookWithRetry()]] - code - packages/shared/src/notification/index.ts
- [[verifyTokenHash()]] - code - apps/api/src/routes/auth.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Authentication_Routes__Handlers
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_API Bootstrap & Middleware]]
- 1 edge to [[_COMMUNITY_Shared Constants & Enums]]

## Top bridge nodes
- [[routesauth.ts]] - degree 26, connects to 1 community
- [[authRoutes()]] - degree 7, connects to 1 community
- [[ref_crypto]] - degree 3, connects to 1 community
- [[packages_shared_dist_auth_index_hashpassword]] - degree 2, connects to 1 community
- [[packages_shared_dist_auth_index_verifypassword]] - degree 2, connects to 1 community