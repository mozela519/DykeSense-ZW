/**
 * DykeSense-ZW Desktop Screening Module
 * Powered by 100% Free OpenStreetMap (OSM) APIs:
 * - Free OSM Cartographic Tiles (Standard, Humanitarian, Topo, Dark)
 * - Free OSM Nominatim Location Search (Zimbabwe Great Dyke Geocoding)
 * - Toggleable Local Great Dyke Geological Boundaries (Ultramafic & Mafic Sequences)
 * - Fault Shears & Chromitite Seam 1-11 Strike Traces
 * - Historical Prospecting Intensity Heatmaps (ASM pits, historic shafts, depletion matrix)
 * - Claims & Tenement Polygons with Access Status & Target Prioritization
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Info,
  Sparkles,
  Flame,
  Globe,
  Search,
  Navigation,
  Loader2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Bot,
  Radio,
} from 'lucide-react';
import { ClaimPolygon, SatelliteScreeningArea, UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

// Great Dyke Geological Sub-chamber sequence zones
const GEOLOGICAL_ZONES = [
  {
    id: 'zone-mus',
    name: 'Musengezi Sub-chamber (North)',
    sequence: 'Ultramafic: Pyroxenite & Dunite with Chromitite Seams 1-4',
    color: '#0d9488',
    bounds: [
      [-16.60, 30.80],
      [-16.60, 30.95],
      [-17.00, 30.75],
      [-17.00, 30.60],
    ] as [number, number][],
  },
  {
    id: 'zone-darw',
    name: 'Hartley / Darwendale Sub-chamber',
    sequence: 'Ultramafic Layered Complex with Seams 1-11 & Gabbroic Norite Cap',
    color: '#14b8a6',
    bounds: [
      [-17.05, 30.75],
      [-17.05, 30.88],
      [-18.10, 30.40],
      [-18.10, 30.25],
    ] as [number, number][],
  },
  {
    id: 'zone-seba',
    name: 'Sebakwe / Lalapanzi Sub-chamber',
    sequence: 'Serpentinite, Chromitite Seams & Harzburgite Package',
    color: '#0284c7',
    bounds: [
      [-18.80, 30.35],
      [-18.80, 30.48],
      [-19.45, 30.15],
      [-19.45, 30.00],
    ] as [number, number][],
  },
  {
    id: 'zone-selu',
    name: 'Selukwe / Shurugwi Peak Complex',
    sequence: 'Podiform Chromite Lenses in Serpentinized Dunite Host Rock',
    color: '#059669',
    bounds: [
      [-19.55, 30.08],
      [-19.55, 30.20],
      [-19.85, 29.95],
      [-19.85, 29.80],
    ] as [number, number][],
  },
  {
    id: 'zone-wedz',
    name: 'Wedza Sub-chamber (South)',
    sequence: 'Southern Ultramafic Axis with Seam packages',
    color: '#047857',
    bounds: [
      [-20.20, 29.90],
      [-20.20, 30.02],
      [-20.80, 29.75],
      [-20.80, 29.60],
    ] as [number, number][],
  },
];

// Great Dyke Structural Shears (Umvimeela Western & Eastern Border Faults)
const GEOLOGICAL_FAULTS = [
  {
    id: 'fault-west',
    name: 'Western Border Shear (Umvimeela Quartz-Gabbro Dyke)',
    color: '#f43f5e',
    coords: [
      [-16.70, 30.68],
      [-17.20, 30.55],
      [-17.80, 30.38],
      [-18.60, 30.22],
      [-19.40, 29.98],
      [-20.40, 29.68],
    ] as [number, number][],
  },
  {
    id: 'fault-east',
    name: 'Eastern Boundary Contact Shear',
    color: '#e11d48',
    coords: [
      [-16.65, 30.90],
      [-17.15, 30.78],
      [-17.75, 30.62],
      [-18.55, 30.48],
      [-19.35, 30.22],
      [-20.35, 29.95],
    ] as [number, number][],
  },
];

// Stratiform Chromitite Seams 1-11 Strike Traces
const CHROMITE_SEAM_TRACES = [
  {
    id: 'trace-seam4',
    name: 'Seam 4 & 5 High-Grade Metallurgical Strike Trace',
    color: '#F4A259',
    coords: [
      [-17.10, 30.67],
      [-17.30, 30.63],
      [-17.65, 30.56],
      [-18.00, 30.42],
    ] as [number, number][],
  },
  {
    id: 'trace-seam1',
    name: 'Seam 1 & 2 Refractory Chromite Trace',
    color: '#fbbf24',
    coords: [
      [-17.12, 30.69],
      [-17.32, 30.65],
      [-17.67, 30.58],
      [-18.02, 30.44],
    ] as [number, number][],
  },
];

// Historical Prospecting Intensity Heatmap clusters
export interface HistoricProspectingCluster {
  id: string;
  name: string;
  subChamber: string;
  lat: number;
  lng: number;
  intensity: 'Extreme' | 'High' | 'Moderate' | 'Low_Virgin';
  densityPitsPerKm2: number;
  historicPeriod: string;
  oreType: string;
  prioritizationAdvice: string;
  radiusMeters: number;
}

const HISTORIC_PROSPECTING_CLUSTERS: HistoricProspectingCluster[] = [
  {
    id: 'hp-muto-01',
    name: 'Mutorashanga North Seam 4 Open-Cast Benches',
    subChamber: 'Darwendale',
    lat: -17.145,
    lng: 30.648,
    intensity: 'High',
    densityPitsPerKm2: 48,
    historicPeriod: '1960 - 2022 (Co-op & Tributer workings)',
    oreType: 'Stratiform Seam 4 (Cr:Fe 2.8:1)',
    prioritizationAdvice: 'Surface seam worked out to 6m; high geophysical target for downdip continuation between 12m-25m.',
    radiusMeters: 3000,
  },
  {
    id: 'hp-darw-02',
    name: 'Darwendale West Virgin Serpentinite Plateau',
    subChamber: 'Darwendale',
    lat: -17.712,
    lng: 30.550,
    intensity: 'Low_Virgin',
    densityPitsPerKm2: 3,
    historicPeriod: 'Minimal historic pitting (thick saprolite overburden)',
    oreType: 'Concealed Chromite Body',
    prioritizationAdvice: 'Top Frontier Rank: Untested strong magnetic anomaly with virgin ground. Highest exploration upside.',
    radiusMeters: 3800,
  },
  {
    id: 'hp-lala-03',
    name: 'Lalapanzi Railway Historic Pits & Trenches',
    subChamber: 'Sebakwe',
    lat: -19.318,
    lng: 30.188,
    intensity: 'Moderate',
    densityPitsPerKm2: 24,
    historicPeriod: '1940s colonial prospecting & 1990s ASM digging',
    oreType: 'Stratiform Seams 1 & 2',
    prioritizationAdvice: 'Moderate historical peggings. Step-out magnetometer lines recommended to test fault displaced blocks.',
    radiusMeters: 2600,
  },
  {
    id: 'hp-shur-04',
    name: 'Selukwe Peak Historic Glory Holes & Adits',
    subChamber: 'Selukwe_Shurugwi',
    lat: -19.660,
    lng: 29.992,
    intensity: 'Extreme',
    densityPitsPerKm2: 72,
    historicPeriod: '1906 - Present (Historic Rhodesia Chrome Mines & ASM)',
    oreType: 'High-Grade Podiform Chromite Lenses',
    prioritizationAdvice: 'Intense surface depletion. Target deeper blind magnetic anomalies (>30m) below historical glory holes.',
    radiusMeters: 4200,
  },
  {
    id: 'hp-seba-05',
    name: 'Sebakwe River Alluvial Washings & Float Pits',
    subChamber: 'Sebakwe',
    lat: -19.090,
    lng: 30.260,
    intensity: 'Moderate',
    densityPitsPerKm2: 19,
    historicPeriod: '1980s eluvial washings',
    oreType: 'Eluvial float and sub-outcrop seams',
    prioritizationAdvice: 'Buffer proximity: Check environmental clearances before trenching.',
    radiusMeters: 2400,
  },
];

interface DesktopScreeningMapProps {
  claims: ClaimPolygon[];
  screeningAreas: SatelliteScreeningArea[];
  currentRole: UserRole;
  language: Language;
  onSelectClaimForSurvey: (claimId: string, lat?: number, lng?: number, label?: string) => void;
  onOpenBookingForClaim: (claimId: string) => void;
  targetHighlight?: { lat: number; lng: number; label: string } | null;
  onClearTargetHighlight?: () => void;
  onSendToAiAdvisor?: (target: {
    subChamber: string;
    claimName: string;
    lat: number;
    lng: number;
    alterationIndex?: number;
  }) => void;
  onSendToSatelliteScreening?: (lat: number, lng: number) => void;
}

export const DesktopScreeningMap: React.FC<DesktopScreeningMapProps> = ({
  claims,
  screeningAreas,
  currentRole,
  language,
  onSelectClaimForSurvey,
  onOpenBookingForClaim,
  targetHighlight,
  onClearTargetHighlight,
  onSendToAiAdvisor,
  onSendToSatelliteScreening,
}) => {
  const t = getTranslation(language);

  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.id || 'claim-muto-01');
  const [selectedProspectingCluster, setSelectedProspectingCluster] =
    useState<HistoricProspectingCluster | null>(HISTORIC_PROSPECTING_CLUSTERS[0]);

  // Clicked / Identified position state
  const [identifiedClickPos, setIdentifiedClickPos] = useState<{
    lat: number;
    lng: number;
    subChamber: string;
    distanceToSeamKm: number;
    nearestSeamName: string;
    nearestPitCluster: string;
    distanceToPitKm: number;
  } | null>(null);

  // Free OpenStreetMap Tile Mode
  const [osmTileStyle, setOsmTileStyle] = useState<'standard' | 'hot' | 'topo' | 'dark'>('standard');

  // Toggleable Overlays
  const [activeOverlays, setActiveOverlays] = useState({
    geologicalBoundaries: true,
    faultShears: true,
    chromiteSeamTraces: true,
    prospectingHeatmap: true,
    claims: true,
  });

  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);

  // Free OpenStreetMap Nominatim Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Map DOM references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlaysLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];
  const matchingScreening =
    screeningAreas.find((s) =>
      s.subChamber.toLowerCase().includes(selectedClaim?.subChamber.toLowerCase() || '')
    ) || screeningAreas[0];

  const getIntensityColor = (intensity: HistoricProspectingCluster['intensity']) => {
    switch (intensity) {
      case 'Extreme':
        return '#ef4444'; // Red
      case 'High':
        return '#f97316'; // Orange
      case 'Moderate':
        return '#F4A259'; // Amber
      case 'Low_Virgin':
        return '#10b981'; // Emerald (Top virgin target)
    }
  };

  // 1. Initialize Map once safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset any previous Leaflet container state
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // Initialize Leaflet map with standard settings
    const map = L.map(mapContainerRef.current, {
      center: [-18.3, 30.4],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false, // We'll add custom controls
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create persistent layer group for overlays
    const overlaysGroup = L.layerGroup().addTo(map);
    overlaysLayerGroupRef.current = overlaysGroup;

    // Advanced Click-to-Identify Position handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Identify Great Dyke sub-chamber by latitude
      let subChamber = 'Flanking Basement / Buffer';
      if (lat >= -17.0) subChamber = 'Musengezi Sub-chamber (North)';
      else if (lat >= -18.5) subChamber = 'Hartley / Darwendale Sub-chamber';
      else if (lat >= -19.5) subChamber = 'Sebakwe / Lalapanzi Sub-chamber';
      else if (lat >= -20.0) subChamber = 'Selukwe / Shurugwi Peak Complex';
      else if (lat >= -21.0) subChamber = 'Wedza Sub-chamber (South)';

      // Approximate distance to nearest chromite seam
      const seamDist = Math.abs(lng - 30.6) * 111.0; // ~111km per deg
      // Find nearest historic cluster
      let nearestCluster = HISTORIC_PROSPECTING_CLUSTERS[0];
      let minClusterDist = Infinity;
      HISTORIC_PROSPECTING_CLUSTERS.forEach((c) => {
        const d = Math.hypot((lat - c.lat) * 111, (lng - c.lng) * 111);
        if (d < minClusterDist) {
          minClusterDist = d;
          nearestCluster = c;
        }
      });

      setIdentifiedClickPos({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        subChamber,
        distanceToSeamKm: Number(seamDist.toFixed(1)),
        nearestSeamName: 'Chromitite Seam 4 (Apparent Horizon)',
        nearestPitCluster: nearestCluster.name,
        distanceToPitKm: Number(minClusterDist.toFixed(1)),
      });

      // Show temporary query pin
      const queryPin = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#F4A259',
        fillColor: '#1B998B',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(overlaysGroup);

      queryPin.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px;">
          <strong style="color: #0f766e;">Identified Position:</strong><br/>
          <span style="font-family: 'JetBrains Mono', monospace;">${lat.toFixed(4)}°S, ${lng.toFixed(4)}°E</span><br/>
          <span>${subChamber}</span>
        </div>
      `).openPopup();
    });

    mapInstanceRef.current = map;

    // Force map size invalidation so tiles never load cropped
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle external target highlight from Satellite Screening module
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetHighlight) return;

    map.flyTo([targetHighlight.lat, targetHighlight.lng], 12, { duration: 1.2 });

    const highlightPin = L.circleMarker([targetHighlight.lat, targetHighlight.lng], {
      radius: 12,
      color: '#ffffff',
      fillColor: '#F4A259',
      fillOpacity: 0.95,
      weight: 3,
    }).addTo(map);

    highlightPin.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 180px;">
        <span style="font-size: 10px; color: #d97706; font-weight: bold; text-transform: uppercase;">Satellite Identified Anomaly:</span>
        <div style="font-weight: bold; color: #0B2545; font-size: 13px;">${targetHighlight.label}</div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #0f766e; margin-top: 4px;">
          ${targetHighlight.lat.toFixed(4)}°S, ${targetHighlight.lng.toFixed(4)}°E
        </div>
      </div>
    `).openPopup();
  }, [targetHighlight]);

  // 2. Update Free OpenStreetMap Base Tile Layer whenever style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    // Free OpenStreetMap Tile Providers (No API Key Required)
    let url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

    if (osmTileStyle === 'hot') {
      // Free Humanitarian OpenStreetMap
      url = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
      attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>';
    } else if (osmTileStyle === 'topo') {
      // Free OpenTopoMap
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution =
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
    } else if (osmTileStyle === 'dark') {
      // Free CartoDB Dark Matter (powered by OpenStreetMap data)
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    const newTileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [osmTileStyle]);

  // 3. Render and Update Overlays (Boundaries, Faults, Heatmap, Claims)
  useEffect(() => {
    const group = overlaysLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    // Layer 1: Geological Boundaries (Sub-chamber zones)
    if (activeOverlays.geologicalBoundaries) {
      GEOLOGICAL_ZONES.forEach((zone) => {
        const poly = L.polygon(zone.bounds, {
          color: zone.color,
          weight: 2,
          fillColor: zone.color,
          fillOpacity: 0.18,
          dashArray: '5, 4',
        });

        poly.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #0f766e; font-size: 13px;">${zone.name}</strong><br/>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; margin-top: 4px; color: #334155;">
              ${zone.sequence}
            </div>
            <div style="margin-top: 4px; font-size: 10px; color: #64748b;">
              Source: Geological Survey of Zimbabwe (Great Dyke Ultramafic Axis)
            </div>
          </div>
        `);

        group.addLayer(poly);
      });
    }

    // Layer 2: Border Fault Shears
    if (activeOverlays.faultShears) {
      GEOLOGICAL_FAULTS.forEach((fault) => {
        const line = L.polyline(fault.coords, {
          color: fault.color,
          weight: 3,
          dashArray: '6, 5',
          opacity: 0.85,
        });

        line.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
            <strong style="color: #e11d48; font-size: 13px;">${fault.name}</strong><br/>
            <span style="color: #475569; font-size: 11px;">Major lateral shear bounding the 550km intrusion graben.</span>
          </div>
        `);

        group.addLayer(line);
      });
    }

    // Layer 3: Chromitite Seam Strike Traces (Seams 1-11)
    if (activeOverlays.chromiteSeamTraces) {
      CHROMITE_SEAM_TRACES.forEach((trace) => {
        const seamLine = L.polyline(trace.coords, {
          color: trace.color,
          weight: 4,
          opacity: 0.95,
        });

        seamLine.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
            <strong style="color: #d97706; font-size: 13px;">${trace.name}</strong><br/>
            <div style="font-size: 11px; margin-top: 2px;">
              Steep inward dip (65°-80° E). Target chromitite layer with economic magnetic susceptibility contrast.
            </div>
          </div>
        `);

        group.addLayer(seamLine);
      });
    }

    // Layer 4: Historical Prospecting Intensity Heatmap
    if (activeOverlays.prospectingHeatmap) {
      HISTORIC_PROSPECTING_CLUSTERS.forEach((cluster) => {
        const clusterColor = getIntensityColor(cluster.intensity);

        // Heatmap density dispersion circle
        const heatCircle = L.circle([cluster.lat, cluster.lng], {
          radius: cluster.radiusMeters,
          color: clusterColor,
          fillColor: clusterColor,
          fillOpacity: heatmapOpacity * 0.45,
          weight: 1.5,
        });

        // Center landmark pin
        const coreMarker = L.circleMarker([cluster.lat, cluster.lng], {
          radius: 9,
          color: '#ffffff',
          fillColor: clusterColor,
          fillOpacity: 1.0,
          weight: 2.5,
        });

        const popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0f172a; min-width: 220px;">
            <div style="font-weight: 700; color: #0B2545; font-size: 13px;">
              ${cluster.name}
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #0284c7; margin-bottom: 6px;">
              ${cluster.subChamber} Sub-Chamber
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px;">
              <div><strong>Intensity:</strong> <span style="color: ${clusterColor}; font-weight: bold;">${cluster.intensity.replace('_', ' ')}</span></div>
              <div><strong>Pit Density:</strong> ${cluster.densityPitsPerKm2} workings/km²</div>
              <div><strong>Era:</strong> ${cluster.historicPeriod}</div>
              <div><strong>Ore:</strong> ${cluster.oreType}</div>
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.4;">
              <strong>Prioritization:</strong> ${cluster.prioritizationAdvice}
            </div>
          </div>
        `;

        heatCircle.bindPopup(popupContent);
        coreMarker.bindPopup(popupContent);

        coreMarker.on('click', () => {
          setSelectedProspectingCluster(cluster);
        });

        group.addLayer(heatCircle);
        group.addLayer(coreMarker);
      });
    }

    // Layer 5: Mining Claims Polygons
    if (activeOverlays.claims) {
      claims.forEach((claim) => {
        const isSelected = claim.id === selectedClaimId;
        const isRestricted = claim.sensitiveLocation;

        const claimPoly = L.polygon(claim.coordinates, {
          color: isSelected ? '#F4A259' : isRestricted ? '#ef4444' : '#38bdf8',
          weight: isSelected ? 3.5 : 2,
          fillColor: isSelected ? '#F4A259' : isRestricted ? '#991b1b' : '#0284c7',
          fillOpacity: isSelected ? 0.65 : 0.35,
        });

        claimPoly.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #0B2545; font-size: 13px;">${claim.name}</strong><br/>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b;">${claim.claimNumber}</span><br/>
            <div style="margin-top: 4px; font-size: 11px;">
              <strong>Holder:</strong> ${claim.cooperativeName}<br/>
              <strong>Area:</strong> ${claim.areaHectares} ha<br/>
              <strong>Status:</strong> <span style="color: ${claim.accessStatus === 'cleared' ? '#16a34a' : '#ea580c'}; font-weight: bold;">${claim.accessStatus.toUpperCase()}</span>
            </div>
          </div>
        `);

        claimPoly.on('click', () => {
          setSelectedClaimId(claim.id);
        });

        group.addLayer(claimPoly);
      });
    }
  }, [activeOverlays, claims, selectedClaimId, heatmapOpacity]);

  // Sub-chamber quick zoom handler
  const handleZoomSubChamber = (subChamberKey: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (subChamberKey === 'Mutorashanga') {
      map.setView([-17.145, 30.648], 12);
    } else if (subChamberKey === 'Kildonan') {
      map.setView([-17.280, 30.610], 12);
    } else if (subChamberKey === 'Darwendale') {
      map.setView([-17.712, 30.550], 11);
    } else if (subChamberKey === 'Sebakwe') {
      map.setView([-19.090, 30.260], 11);
    } else if (subChamberKey === 'Lalapanzi') {
      map.setView([-19.318, 30.188], 12);
    } else if (subChamberKey === 'Selukwe') {
      map.setView([-19.660, 29.992], 12);
    } else if (subChamberKey === 'All') {
      map.setView([-18.3, 30.4], 7);
    }
  };

  // Free OpenStreetMap Nominatim Geocoding Search
  const handleOsmSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchMessage(null);

    try {
      // Query OpenStreetMap Nominatim API for Zimbabwe
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ', Zimbabwe'
      )}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'DykeSense-ZW Exploration Platform',
        },
      });

      if (!response.ok) throw new Error('OSM Search request failed');

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 12);

          // Drop animated temporary pin
          const pin = L.circleMarker([lat, lon], {
            radius: 12,
            color: '#10b981',
            fillColor: '#34d399',
            fillOpacity: 0.8,
            weight: 3,
          }).addTo(mapInstanceRef.current);

          pin.bindPopup(`<strong>${place.display_name}</strong>`).openPopup();
        }
        setSearchMessage(`Found: ${place.name || searchQuery}`);
      } else {
        setSearchMessage('Location not found in Zimbabwe OSM records');
      }
    } catch (err) {
      console.error('OSM Nominatim error', err);
      // Fallback coordinates for key Great Dyke hubs
      const queryLower = searchQuery.toLowerCase();
      if (queryLower.includes('mutorashanga')) {
        mapInstanceRef.current?.setView([-17.14, 30.65], 11);
        setSearchMessage('Focused Mutorashanga North');
      } else if (queryLower.includes('shurugwi') || queryLower.includes('selukwe')) {
        mapInstanceRef.current?.setView([-19.67, 30.00], 11);
        setSearchMessage('Focused Shurugwi Peak');
      } else if (queryLower.includes('darwendale')) {
        mapInstanceRef.current?.setView([-17.71, 30.55], 11);
        setSearchMessage('Focused Darwendale West');
      } else {
        setSearchMessage('Search timed out. Select a sub-chamber preset above.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: ClaimPolygon['accessStatus'], isSensitive?: boolean) => {
    if (isSensitive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-900/60 text-red-200 border border-red-500/50">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          Restricted State Buffer
        </span>
      );
    }
    switch (status) {
      case 'cleared':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/60 text-emerald-200 border border-emerald-500/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Permitted ASM Co-op
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-900/60 text-amber-200 border border-amber-500/50">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Boundary Dispute
          </span>
        );
      case 'pending_inspection':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-900/60 text-blue-200 border border-blue-500/50">
            <Info className="w-3 h-3 text-blue-400" />
            Pending Inspection
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Free OpenStreetMap Controls */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">
                Great Dyke Exploration Map (Free OpenStreetMap API)
              </h2>
              <span className="bg-emerald-900/60 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
                100% Free OpenStreetMap
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Powered by free OpenStreetMap cartography, Nominatim place search, local geological boundaries, and historical prospecting heatmaps.
            </p>
          </div>

          {/* Free OSM Map Style Switcher */}
          <div className="flex items-center gap-1 bg-[#08182b] p-1 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="text-slate-400 text-[10px] px-1.5 hidden sm:inline">OSM Style:</span>
            <button
              onClick={() => setOsmTileStyle('standard')}
              className={`px-2 py-1 rounded transition-colors ${
                osmTileStyle === 'standard' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Official Free OpenStreetMap Standard Tiles"
            >
              OSM Standard
            </button>
            <button
              onClick={() => setOsmTileStyle('hot')}
              className={`px-2 py-1 rounded transition-colors ${
                osmTileStyle === 'hot' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Free Humanitarian OpenStreetMap (High-contrast trails and terrain)"
            >
              OSM HOT
            </button>
            <button
              onClick={() => setOsmTileStyle('topo')}
              className={`px-2 py-1 rounded transition-colors ${
                osmTileStyle === 'topo' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Free OpenTopoMap Contours"
            >
              OpenTopo
            </button>
            <button
              onClick={() => setOsmTileStyle('dark')}
              className={`px-2 py-1 rounded transition-colors ${
                osmTileStyle === 'dark' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="OSM Dark Matter for high geophysical contrast"
            >
              Dark
            </button>
          </div>
        </div>

        {/* Free OSM Nominatim Location Search Bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <form onSubmit={handleOsmSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search via OpenStreetMap (e.g., Mutorashanga, Shurugwi, Gweru)..."
                className="w-full bg-[#05111f] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>Find</span>
            </button>
          </form>

          {searchMessage && (
            <span className="text-[11px] text-teal-300 bg-teal-950/80 px-2 py-1 rounded border border-teal-600/50">
              {searchMessage}
            </span>
          )}

          {/* Quick Sub-Chamber Presets */}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-slate-400">Jump:</span>
            <button
              onClick={() => handleZoomSubChamber('All')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              All Dyke
            </button>
            <button
              onClick={() => handleZoomSubChamber('Mutorashanga')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-teal-300 font-semibold"
            >
              Mutorashanga
            </button>
            <button
              onClick={() => handleZoomSubChamber('Kildonan')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Kildonan
            </button>
            <button
              onClick={() => handleZoomSubChamber('Darwendale')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Darwendale
            </button>
            <button
              onClick={() => handleZoomSubChamber('Sebakwe')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Sebakwe
            </button>
            <button
              onClick={() => handleZoomSubChamber('Lalapanzi')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Lalapanzi
            </button>
            <button
              onClick={() => handleZoomSubChamber('Selukwe')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Shurugwi Peak
            </button>
          </div>
        </div>

        {/* Layer Toggles & Heatmap Controls */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Overlays:</span>

            <button
              onClick={() =>
                setActiveOverlays((prev) => ({
                  ...prev,
                  geologicalBoundaries: !prev.geologicalBoundaries,
                }))
              }
              className={`px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                activeOverlays.geologicalBoundaries
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Geological Boundaries {activeOverlays.geologicalBoundaries ? '●' : '○'}</span>
            </button>

            <button
              onClick={() =>
                setActiveOverlays((prev) => ({
                  ...prev,
                  faultShears: !prev.faultShears,
                }))
              }
              className={`px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                activeOverlays.faultShears
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-semibold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span>Fault Shears {activeOverlays.faultShears ? '●' : '○'}</span>
            </button>

            <button
              onClick={() =>
                setActiveOverlays((prev) => ({
                  ...prev,
                  chromiteSeamTraces: !prev.chromiteSeamTraces,
                }))
              }
              className={`px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                activeOverlays.chromiteSeamTraces
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span>Chromitite Seams 1-11 {activeOverlays.chromiteSeamTraces ? '●' : '○'}</span>
            </button>

            <button
              onClick={() =>
                setActiveOverlays((prev) => ({
                  ...prev,
                  prospectingHeatmap: !prev.prospectingHeatmap,
                }))
              }
              className={`px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                activeOverlays.prospectingHeatmap
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/70 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Prospecting Heatmap {activeOverlays.prospectingHeatmap ? '●' : '○'}</span>
            </button>

            <button
              onClick={() =>
                setActiveOverlays((prev) => ({
                  ...prev,
                  claims: !prev.claims,
                }))
              }
              className={`px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${
                activeOverlays.claims
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 font-semibold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Claims {activeOverlays.claims ? '●' : '○'}</span>
            </button>
          </div>

          {/* Heatmap Opacity */}
          {activeOverlays.prospectingHeatmap && (
            <div className="flex items-center gap-2 bg-[#08182b] px-2.5 py-1 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400">Heatmap Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-16 h-1.5 bg-slate-700 rounded-lg cursor-pointer accent-orange-500"
              />
              <span className="text-[10px] text-orange-300 font-bold">{Math.round(heatmapOpacity * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Map View & Inspection Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OpenStreetMap Canvas */}
        <div className="lg:col-span-8 bg-[#08182b] border border-slate-700/80 rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-[#0c223c] px-4 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>OpenStreetMap Great Dyke Corridor (Lat -16.4° to -20.8° S)</span>
            </span>
            <span className="text-slate-400 text-[10px]">Attribution: © OpenStreetMap Contributors</span>
          </div>

          {/* Leaflet Slippy Map DOM Container */}
          <div
            ref={mapContainerRef}
            className="w-full bg-[#071629] relative z-0"
            style={{ height: '540px', minHeight: '540px' }}
          ></div>

          {/* Bottom Map Legend Bar */}
          <div className="bg-[#0b2038] border-t border-slate-800 px-4 py-2.5 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-[#0d9488]/40 border border-[#0d9488] rounded"></span>
                <span>Ultramafic Layer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#f43f5e]"></span>
                <span>Umvimeela Fault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#F4A259] rounded"></span>
                <span>Chromitite Seams 1-11</span>
              </div>
            </div>

            {/* Density scale */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px]">Historic Workings:</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" title="Virgin / Low Pits"></span>
                <span>Virgin</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4A259]" title="Moderate Pits"></span>
                <span>Moderate</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" title="High Pits"></span>
                <span>High</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" title="Extreme Depletion"></span>
                <span>Extreme</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Historical Prospecting & Position Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Identified Map Click Position Card */}
          {identifiedClickPos && (
            <div className="bg-[#0e243d] border-2 border-teal-500 rounded-xl p-4 shadow-lg space-y-3 font-mono text-xs animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-teal-300 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                  <Compass className="w-4 h-4 text-teal-400 animate-spin-slow" />
                  Identified Ground Position
                </span>
                <button
                  onClick={() => setIdentifiedClickPos(null)}
                  className="text-slate-400 hover:text-white text-[10px] px-1.5 py-0.5 rounded bg-slate-800"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position Coordinates:</span>
                  <span className="text-white font-bold">{identifiedClickPos.lat}°S, {identifiedClickPos.lng}°E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Geological Domain:</span>
                  <span className="text-teal-300 font-semibold">{identifiedClickPos.subChamber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nearest Chromite Seam:</span>
                  <span className="text-amber-300 font-bold">{identifiedClickPos.distanceToSeamKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nearest Historic Workings:</span>
                  <span className="text-slate-200">{identifiedClickPos.distanceToPitKm} km</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() =>
                    onSelectClaimForSurvey(
                      claims[0]?.id || 'claim-muto-01',
                      identifiedClickPos.lat,
                      identifiedClickPos.lng,
                      `Identified Target (${identifiedClickPos.subChamber})`
                    )
                  }
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                  Dispatch Field Survey PWA Here
                </button>

                {onSendToAiAdvisor && (
                  <button
                    onClick={() =>
                      onSendToAiAdvisor({
                        subChamber: identifiedClickPos.subChamber,
                        claimName: `Identified Ground Target (${identifiedClickPos.subChamber})`,
                        lat: identifiedClickPos.lat,
                        lng: identifiedClickPos.lng,
                      })
                    }
                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Analyze with AI Geoscientist
                  </button>
                )}

                {onSendToSatelliteScreening && (
                  <button
                    onClick={() => onSendToSatelliteScreening(identifiedClickPos.lat, identifiedClickPos.lng)}
                    className="w-full py-1.5 bg-[#05111f] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    Inspect Spectral Alteration in Satellite Module
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Historical Prospecting Intensity Inspector */}
          <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">
                  Historical Prospecting & Target Ranking
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded border border-teal-500/40">
                Heatmap Analysis
              </span>
            </div>

            {selectedProspectingCluster ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#071729] border border-slate-800 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-white font-bold text-sm">
                      {selectedProspectingCluster.name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${getIntensityColor(selectedProspectingCluster.intensity)}22`,
                        color: getIntensityColor(selectedProspectingCluster.intensity),
                        border: `1px solid ${getIntensityColor(selectedProspectingCluster.intensity)}66`,
                      }}
                    >
                      {selectedProspectingCluster.intensity.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[11px] pt-1 space-y-0.5">
                    <div>Pits / Workings Density: <strong className="text-white">{selectedProspectingCluster.densityPitsPerKm2} workings/km²</strong></div>
                    <div>Historical Era: <span className="text-slate-300">{selectedProspectingCluster.historicPeriod}</span></div>
                    <div>Target Lithology: <span className="text-amber-300 font-semibold">{selectedProspectingCluster.oreType}</span></div>
                  </div>
                </div>

                {/* Target Ranking Insight */}
                <div className="p-3 bg-[#0a1e36] rounded-lg border border-teal-500/40 space-y-1.5">
                  <span className="text-teal-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Target Prioritization Logic:
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {selectedProspectingCluster.prioritizationAdvice}
                  </p>
                  <div className="pt-1.5 text-[10px] text-slate-400 border-t border-slate-700/60">
                    {selectedProspectingCluster.intensity === 'Low_Virgin' && (
                      <span className="text-emerald-400 font-bold">
                        ★ Priority 1 Virgin Candidate: High magnetic signature with zero surface artisanal depletion.
                      </span>
                    )}
                    {selectedProspectingCluster.intensity === 'High' && (
                      <span className="text-amber-300 font-bold">
                        ★ Priority 1 Deep Extension: Outcrop mined; blind targets between 12m-25m remain intact.
                      </span>
                    )}
                    {selectedProspectingCluster.intensity === 'Extreme' && (
                      <span className="text-rose-300">
                        ⚠ High Depletion Caution: Shallow pits exhausted; require deep magnetometer survey (&gt;30m).
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Cluster Selector */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1 uppercase">
                    Select Historic Workings Cluster:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {HISTORIC_PROSPECTING_CLUSTERS.map((cluster) => {
                      const isSel = selectedProspectingCluster?.id === cluster.id;
                      return (
                        <button
                          key={cluster.id}
                          onClick={() => {
                            setSelectedProspectingCluster(cluster);
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.setView([cluster.lat, cluster.lng], 11);
                            }
                          }}
                          className={`w-full text-left p-1.5 rounded text-[11px] font-mono transition-colors flex items-center justify-between ${
                            isSel
                              ? 'bg-teal-950 text-white border border-teal-500/60 font-bold'
                              : 'bg-[#05111f] text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate max-w-[190px]">{cluster.name.split(' ')[0]} {cluster.name.split(' ')[1]}</span>
                          <span
                            className="text-[9px] px-1 py-0.5 rounded font-bold"
                            style={{ color: getIntensityColor(cluster.intensity) }}
                          >
                            {cluster.densityPitsPerKm2} pits/km²
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Mining Claim Details */}
          <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400">
                  {selectedClaim.subChamber} Sub-Chamber
                </span>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {selectedClaim.name}
                </h3>
              </div>
              {getStatusBadge(selectedClaim.accessStatus, selectedClaim.sensitiveLocation)}
            </div>

            <div className="p-2.5 rounded-lg bg-[#071729] border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Cooperative:</span>
                <span className="text-teal-300 font-bold truncate max-w-[160px]">{selectedClaim.cooperativeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tenement Area:</span>
                <span className="text-white">{selectedClaim.areaHectares} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Commodity:</span>
                <span className="text-amber-300 font-bold">{selectedClaim.commodity}</span>
              </div>
            </div>

            {/* Launch buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => onSelectClaimForSurvey(selectedClaim.id)}
                disabled={selectedClaim.sensitiveLocation}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedClaim.sensitiveLocation
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Launch Field Survey PWA for This Claim
              </button>

              <button
                onClick={() => onOpenBookingForClaim(selectedClaim.id)}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[#14325c] hover:bg-[#1a3f75] text-slate-200 border border-slate-600/70 flex items-center justify-center gap-2 transition-all"
              >
                Calculate Shared Equipment Rental ($/ha)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
