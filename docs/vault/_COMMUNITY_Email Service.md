---
type: community
cohesion: 0.38
members: 7
---

# Email Service

**Cohesion:** 0.38 - loosely connected
**Members:** 7 nodes

## Members
- [[EmailOptions]] - code - packages/shared/src/email/index.ts
- [[emailindex.ts]] - code - packages/shared/src/email/index.ts
- [[emailTemplates]] - code - packages/shared/src/email/index.ts
- [[getTransporter()]] - code - packages/shared/src/email/index.ts
- [[nodemailer_1]] - concept - packages/shared/package.json
- [[sendEmail()]] - code - packages/shared/src/email/index.ts
- [[verifyEmailConfig()]] - code - packages/shared/src/email/index.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Email_Service
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Auth Utilities (JWT & Password)]]
- 2 edges to [[_COMMUNITY_Config Validation (Zod Env)]]
- 1 edge to [[_COMMUNITY_Shared Package Configuration]]

## Top bridge nodes
- [[emailindex.ts]] - degree 9, connects to 2 communities
- [[getTransporter()]] - degree 4, connects to 1 community
- [[sendEmail()]] - degree 3, connects to 1 community
- [[nodemailer_1]] - degree 2, connects to 1 community