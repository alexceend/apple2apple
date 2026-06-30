const ROUTE_ID_KEY = "routeId";

export function getOrCreateRouteId() {
  const existing = localStorage.getItem(ROUTE_ID_KEY);

  if (existing) {
    return existing;
  }

  const routeId = `pc-${crypto.randomUUID()}`;
  localStorage.setItem(ROUTE_ID_KEY, routeId);

  return routeId;
}