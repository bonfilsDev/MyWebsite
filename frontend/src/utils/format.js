export function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

export function today() {
  return new Date().toISOString().split('T')[0];
}
