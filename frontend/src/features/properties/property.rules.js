export function filterManagedProperties(properties, user) {
  if (!Array.isArray(properties)) return [];
  if (user?.isTestMode) return properties;

  const username = user?.username?.toLowerCase();
  return properties.filter(property => (
    (username && property.createdBy?.toLowerCase() === username)
    || (username && property.managerUsername?.toLowerCase() === username)
    || (user?.houseCode && property.code === user.houseCode)
  ));
}
