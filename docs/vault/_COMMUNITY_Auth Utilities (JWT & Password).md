---
type: community
cohesion: 0.21
members: 12
---

# Auth Utilities (JWT & Password)

**Cohesion:** 0.21 - loosely connected
**Members:** 12 nodes

## Members
- [[JWTPayload_1]] - code - packages/shared/src/auth/index.ts
- [[authindex.ts]] - code - packages/shared/src/auth/index.ts
- [[config()]] - code - packages/shared/src/config/index.ts
- [[decodeToken()]] - code - packages/shared/src/auth/index.ts
- [[extractTokenFromHeader()]] - code - packages/shared/src/auth/index.ts
- [[generateAccessToken()]] - code - packages/shared/src/auth/index.ts
- [[generateRefreshToken()]] - code - packages/shared/src/auth/index.ts
- [[hashPassword()]] - code - packages/shared/src/auth/index.ts
- [[jsonwebtoken]] - concept - packages/shared/package.json
- [[ref_bcryptjs]] - concept
- [[verifyPassword()]] - code - packages/shared/src/auth/index.ts
- [[verifyToken()]] - code - packages/shared/src/auth/index.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Utilities_JWT__Password
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Email Service]]
- 3 edges to [[_COMMUNITY_Config Validation (Zod Env)]]
- 1 edge to [[_COMMUNITY_Shared Package Configuration]]

## Top bridge nodes
- [[config()]] - degree 8, connects to 2 communities
- [[authindex.ts]] - degree 13, connects to 1 community
- [[jsonwebtoken]] - degree 2, connects to 1 community