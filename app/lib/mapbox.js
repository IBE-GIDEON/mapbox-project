export const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

export function getMapboxToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
}
