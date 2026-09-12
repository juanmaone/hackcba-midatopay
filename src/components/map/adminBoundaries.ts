// Real administrative boundary polygons (OpenStreetMap, via Nominatim lookup, fetched once and
// committed as static files under public/boundaries/ — these don't change, and re-fetching from
// Nominatim on every page load would violate its usage policy). Purely a reference overlay: helps
// the analyst place the field within its department/province, no scoring data attached.

export interface AdminBoundaryConfig {
  id: string;
  label: string;
  url: string;
  color: string;
  dashArray?: number[];
}

export const ADMIN_BOUNDARIES: AdminBoundaryConfig[] = [
  { id: 'departamento', label: 'Departamento Marcos Juárez', url: '/boundaries/marcosJuarezDepartamento.geojson', color: '#f2d98c' },
  { id: 'provincia', label: 'Provincia de Córdoba', url: '/boundaries/cordobaProvincia.geojson', color: '#8cc9f2', dashArray: [2, 2] },
];
