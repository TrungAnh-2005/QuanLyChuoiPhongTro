// Commands consume current state through the app's composition boundary.
export function createSystemCommands({ request }) {
  return {
updateSystemIntegration: (key,config) => request('put',`/auth/integrations/${encodeURIComponent(key)}`,config),
addAuditLog: input => request('post','/auth/audit-logs',input)
};
}
