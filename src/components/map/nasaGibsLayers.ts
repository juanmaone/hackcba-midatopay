export type OverlayLayerName = 'Vegetation' | 'Drought' | 'Soil' | 'Productivity';

interface GibsLayerConfig {
  /** GIBS layer identifier, as listed in https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml */
  layerIdentifier: string;
  /** Verified per-layer against WMTSCapabilities.xml — GIBS layers vary in native resolution and do not share a TileMatrixSet. */
  tileMatrixSet: string;
  /** Highest zoom the TileMatrixSet above actually serves (the trailing "_LevelN"); MapLibre must
   * stop requesting real tiles past this and over-zoom instead, or GIBS 400s on out-of-range z. */
  maxNativeZoom: number;
  /** Official NASA colorbar for this exact layer, from the same capabilities document. */
  legendUrl: string;
  attribution: string;
}

const GIBS_TILE_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

// One real NASA satellite/model product per overlay, verified live against GIBS WMTSCapabilities.xml
// (format=image/png, TileMatrixSet below) and by fetching a sample tile over the field's region.
// 'default' as the time path segment resolves to the most recent date GIBS has published for that
// layer, so this never goes stale like a hardcoded date would.
export const GIBS_LAYERS: Record<OverlayLayerName, GibsLayerConfig> = {
  Vegetation: {
    layerIdentifier: 'MODIS_Terra_NDVI_8Day',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    maxNativeZoom: 9,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_NDVI_H.svg',
    attribution: 'NASA GIBS · MODIS Terra NDVI (8 días)',
  },
  // Precipitation-anomaly isn't published as a GIBS raster layer; land surface temperature is the
  // closest real drought-stress proxy GIBS actually offers as a tile source (docs/TRACK_B_PLAN.md §8).
  Drought: {
    layerIdentifier: 'MODIS_Terra_L3_Land_Surface_Temp_8Day_Day',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxNativeZoom: 7,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg',
    attribution: 'NASA GIBS · MODIS Terra LST (8 días)',
  },
  Soil: {
    layerIdentifier: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxNativeZoom: 6,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/SMAP_Analyzed_Soil_Moisture_H.svg',
    attribution: 'NASA GIBS · SMAP L4 Root Zone Soil Moisture',
  },
  Productivity: {
    layerIdentifier: 'MODIS_Terra_L4_LAI_8Day',
    tileMatrixSet: 'GoogleMapsCompatible_Level8',
    maxNativeZoom: 8,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Leaf_Area_Index_H.svg',
    attribution: 'NASA GIBS · MODIS Terra LAI (8 días)',
  },
};

export function buildGibsTileUrl(layer: OverlayLayerName): string {
  const { layerIdentifier, tileMatrixSet } = GIBS_LAYERS[layer];
  return `${GIBS_TILE_BASE}/${layerIdentifier}/default/default/${tileMatrixSet}/{z}/{y}/{x}.png`;
}
