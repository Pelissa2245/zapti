// ZapTI Database — Tenant Context
// This module provides functions to get/set the current tenant context
// for Prisma middleware to enforce tenant isolation

let currentTenantId: string | null = null;
let currentIsSuperadmin = false;

export function setTenantContext(tenantId: string | null) {
  currentTenantId = tenantId;
}

export function setSuperadminContext(isSuperadmin: boolean) {
  currentIsSuperadmin = isSuperadmin;
}

export function clearContext() {
  currentTenantId = null;
  currentIsSuperadmin = false;
}

export function getCurrentTenantId(): string | null {
  return currentTenantId;
}

export function getCurrentIsSuperadmin(): boolean {
  return currentIsSuperadmin;
}