import { Layer, Source } from 'react-map-gl/maplibre';
import type { Feature, Polygon } from 'geojson';

interface FieldPolygonProps { polygon: Array<[number, number]> }

// GeoJSON and AssessmentRequest.field.polygon both use [lng, lat] — matches the order
// already used in src/data/demoCase.ts, so the raw array is passed straight through.
export function FieldPolygon({ polygon }: FieldPolygonProps) {
  const geojson: Feature<Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[...polygon, polygon[0]]] },
  };
  return (
    <Source id="field-polygon" type="geojson" data={geojson}>
      <Layer id="field-polygon-fill" type="fill" paint={{ 'fill-color': '#5e9a6b', 'fill-opacity': 0.22 }} />
      <Layer id="field-polygon-outline" type="line" paint={{ 'line-color': '#e8f6bd', 'line-width': 2 }} />
    </Source>
  );
}
