// Real field-average NDVI from the latest low-cloud Sentinel-2 scene, via Microsoft Planetary
// Computer's free, no-auth STAC API (the provider docs/TRACK_B_PLAN.md §2 chose over Copernicus
// CDSE OAuth2). Verified end-to-end from the browser: STAC search -> SAS-sign the band asset ->
// ranged read of just the pixel window over the field (not the whole ~190MB band) -> the same
// NDVI formula server/satellite/indices/ndvi.ts already implements (mirrored in
// src/domain/satellite/ndvi.ts — see that file's comment for why it's duplicated, not imported).
//
// Sentinel-2 COGs are projected in the scene's local UTM zone, not lat/lng, so the field's WGS84
// bbox has to be reprojected (via proj4) before it means anything as a pixel window.

import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import { calculateNDVI, classifyNDVI } from '../../domain/satellite/ndvi';

export interface RealVegetationData {
  meanNdvi: number;
  classification: string;
  sceneDate: string; // YYYY-MM-DD
  cloudCoverPercent: number;
  pixelCount: number;
  sourceUrl: string;
}

const STAC_SEARCH_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const SAS_SIGN_URL = 'https://planetarycomputer.microsoft.com/api/sas/v1/sign';
const MAX_CLOUD_COVER = 30;
const SEARCH_WINDOW_DAYS = 90; // wide enough to reliably find a recent low-cloud scene

type Bbox = [number, number, number, number];

interface StacFeature {
  id: string;
  properties: { datetime: string; 'eo:cloud_cover': number; 'proj:epsg': number };
  assets: Record<string, { href: string }>;
  links: Array<{ rel: string; href: string }>;
}

function bboxOf(polygon: Array<[number, number]>): Bbox {
  const lngs = polygon.map(([lng]) => lng);
  const lats = polygon.map(([, lat]) => lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

// EPSG:326xx = WGS84 UTM north zone xx, EPSG:327xx = south.
function utmProjDef(epsg: number): string {
  const zone = epsg % 100;
  const isSouth = Math.floor(epsg / 100) === 327;
  return `+proj=utm +zone=${zone} ${isSouth ? '+south ' : ''}+datum=WGS84 +units=m +no_defs`;
}

function reprojectBbox(bbox4326: Bbox, utmDef: string): Bbox {
  const [minE, minN] = proj4('WGS84', utmDef, [bbox4326[0], bbox4326[1]]);
  const [maxE, maxN] = proj4('WGS84', utmDef, [bbox4326[2], bbox4326[3]]);
  return [Math.min(minE, maxE), Math.min(minN, maxN), Math.max(minE, maxE), Math.max(minN, maxN)];
}

async function findLatestScene(bbox4326: Bbox): Promise<StacFeature> {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - SEARCH_WINDOW_DAYS);

  const res = await fetch(STAC_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collections: ['sentinel-2-l2a'],
      bbox: bbox4326,
      datetime: `${start.toISOString()}/${end.toISOString()}`,
      query: { 'eo:cloud_cover': { lt: MAX_CLOUD_COVER } },
      sortby: [{ field: 'properties.datetime', direction: 'desc' }],
      limit: 1,
    }),
  });
  if (!res.ok) throw new Error(`Planetary Computer STAC search failed: ${res.status}`);
  const json: { features: StacFeature[] } = await res.json();
  const item = json.features[0];
  if (!item) throw new Error(`No cloud-free Sentinel-2 scene found in the last ${SEARCH_WINDOW_DAYS} days`);
  return item;
}

async function signAssetUrl(href: string): Promise<string> {
  const res = await fetch(`${SAS_SIGN_URL}?href=${encodeURIComponent(href)}`);
  if (!res.ok) throw new Error(`Planetary Computer sign failed: ${res.status}`);
  const json: { href: string } = await res.json();
  return json.href;
}

// Reads only the pixel window covering bboxNative, not the whole ~190MB band — readRasters'
// own `bbox` option silently falls back to a full-image read for this dataset (verified), so the
// window is computed by hand from the image's affine transform instead.
async function readBandWindow(assetHref: string, bboxNative: Bbox): Promise<Uint16Array> {
  const signed = await signAssetUrl(assetHref);
  const tiff = await fromUrl(signed);
  const image = await tiff.getImage();
  const [minX, , , maxY] = image.getBoundingBox();
  const [resX, resY] = image.getResolution();

  const left = Math.floor((bboxNative[0] - minX) / resX);
  const right = Math.ceil((bboxNative[2] - minX) / resX);
  const top = Math.floor((maxY - bboxNative[3]) / Math.abs(resY));
  const bottom = Math.ceil((maxY - bboxNative[1]) / Math.abs(resY));

  const rasters = await image.readRasters({ window: [left, top, right, bottom], resampleMethod: 'nearest' });
  return rasters[0] as Uint16Array;
}

export async function fetchRealVegetationIndex(polygon: Array<[number, number]>): Promise<RealVegetationData> {
  const bbox4326 = bboxOf(polygon);
  const item = await findLatestScene(bbox4326);
  const bboxNative = reprojectBbox(bbox4326, utmProjDef(item.properties['proj:epsg']));

  const [red, nir] = await Promise.all([
    readBandWindow(item.assets.B04.href, bboxNative),
    readBandWindow(item.assets.B08.href, bboxNative),
  ]);

  const ndvi = calculateNDVI(nir, red);
  const meanNdvi = ndvi.reduce((a, b) => a + b, 0) / ndvi.length;
  const sourceUrl = item.links.find((link) => link.rel === 'self')?.href ?? '';

  return {
    meanNdvi: Math.round(meanNdvi * 1000) / 1000,
    classification: classifyNDVI(meanNdvi),
    sceneDate: item.properties.datetime.slice(0, 10),
    cloudCoverPercent: Math.round(item.properties['eo:cloud_cover'] * 10) / 10,
    pixelCount: ndvi.length,
    sourceUrl,
  };
}
