/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine.
 *
 * A fórmula considera a Terra como uma esfera e retorna a distância aproximada em quilômetros.
 *
 * IMPORTANTE: latitude e longitude devem ser convertidas de graus para radianos,
 * pois as funções trigonométricas do JavaScript trabalham em radianos.
 */

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio médio da Terra em km

  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}