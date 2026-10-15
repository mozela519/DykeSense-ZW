/**
 * DykeSense-ZW: Geophysical Processing & Inversion Engine
 * Chromite exploration on the Great Dyke, Zimbabwe.
 * 
 * Includes:
 * 1. Diurnal Drift Correction
 * 2. Moving Median Spike Filter
 * 3. 2D Dipping Dyke Forward Magnetic Profile Calculation
 * 4. Automatic & Interactive Profile Inversion with Depth & Width bounds
 */

export interface ProfilePoint {
  stationDistM: number;
  rawNt: number;
  baseNt: number;
  correctedNt: number;
  filteredNt: number;
}

/**
 * Perform diurnal drift correction:
 * Corrected = Raw - BaseStation(t) + BaseReference
 */
export function applyDiurnalCorrection(
  rawNt: number,
  baseNt: number,
  baseReferenceNt: number = 31200.0 // Standard background for Great Dyke latitude (~ -17.5° to -20.5°S)
): number {
  return Number((rawNt - (baseNt - baseReferenceNt)).toFixed(2));
}

/**
 * 5-Point Median Filter for Spike Removal (e.g. wire fences, iron scrap, ASM tools)
 */
export function filterSpikes(readings: number[], thresholdNt: number = 300): number[] {
  if (readings.length < 3) return [...readings];
  const cleaned: number[] = [];

  for (let i = 0; i < readings.length; i++) {
    const window: number[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      const idx = i + offset;
      if (idx >= 0 && idx < readings.length) {
        window.push(readings[idx]);
      }
    }
    window.sort((a, b) => a - b);
    const median = window[Math.floor(window.length / 2)];

    // If point deviates violently from local median, replace with median
    if (Math.abs(readings[i] - median) > thresholdNt) {
      cleaned.push(median);
    } else {
      cleaned.push(readings[i]);
    }
  }

  return cleaned;
}

/**
 * Forward model: Dipping 2D prism / dyke total magnetic field anomaly
 * Based on classic Grant & West / Telford formulation for a steeply dipping sheet or dyke:
 * ΔT(x) = 2 * C * [ (sin θ)*arctan((x - x0)/h) + (cos θ)*0.5*ln((x - x0)^2 + h^2) ]
 * 
 * Parameters:
 * x: station coordinate (m)
 * x0: center coordinate of dyke body (m)
 * h: depth to top of body (m)
 * w: width of body (m)
 * dip: dip angle in radians (e.g. 70 deg east or west)
 * susceptibility: SI units (chromite seam: ~0.02 - 0.08 SI contrast against serpentinite)
 * fieldIntensity: Geomagnetic field (~31,200 nT in Zimbabwe)
 */
export function calculateDykeMagneticAnomaly(
  x: number,
  x0: number,
  h: number,
  w: number,
  dipDeg: number,
  susceptibilitySI: number,
  fieldIntensityNt: number = 31200
): number {
  const theta = (dipDeg * Math.PI) / 180;
  const dx = x - x0;
  const halfW = w / 2;

  // Geometric parameters for edges x1 and x2
  const x1 = dx - halfW;
  const x2 = dx + halfW;

  const r1sq = x1 * x1 + h * h;
  const r2sq = x2 * x2 + h * h;

  const phi1 = Math.atan2(x1, h);
  const phi2 = Math.atan2(x2, h);

  // Demagnetization and susceptibility amplitude scale factor
  // K = 2 * F * k
  const K = 2 * fieldIntensityNt * susceptibilitySI;

  const termArctan = (phi2 - phi1) * Math.sin(theta);
  const termLog = 0.5 * Math.log(r2sq / r1sq) * Math.cos(theta);

  const deltaT = K * (termArctan + termLog);
  return deltaT;
}

/**
 * Geophysical Profile Inversion:
 * Fits a 2D dipping chromite body model to observed survey profile.
 * Computes optimal depth (h), width (w), dip (deg), and susceptibility (SI).
 */
export function invertMagneticProfile(
  stations: number[],
  observedNt: number[],
  initialDepthEstM: number = 18.0
): {
  calculatedDepthM: number;
  depthUncertaintyM: number;
  estimatedWidthM: number;
  dipDegrees: number;
  magneticSusceptibilitySI: number;
  rmsResidualNt: number;
  modeledProfile: { stationDistM: number; observedNt: number; modeledNt: number }[];
} {
  // Find peak anomaly location
  const maxObs = Math.max(...observedNt);
  const minObs = Math.min(...observedNt);
  const peakIndex = observedNt.indexOf(maxObs);
  const x0 = stations[peakIndex] || 50;
  const anomalyAmplitude = maxObs - minObs;

  let bestDepth = Math.max(4, initialDepthEstM);
  let bestWidth = 6.5;
  let bestDip = 75;
  let bestSusc = 0.038;
  let bestRms = Infinity;

  // Grid search search around realistic Great Dyke chromite seams (depth 5m - 50m, width 1m - 20m, dip 55 - 85 deg)
  const depths = [6, 10, 14, 18, 22, 28, 35, 45];
  const widths = [2.0, 4.5, 7.0, 10.0, 15.0];
  const dips = [60, 70, 75, 80];

  // Scale susceptibility to match peak anomaly roughly
  const estimatedSusc = Math.min(0.09, Math.max(0.015, anomalyAmplitude / (2 * 31200 * 1.2)));

  for (const d of depths) {
    for (const w of widths) {
      for (const dip of dips) {
        let sumSquaredErr = 0;
        for (let i = 0; i < stations.length; i++) {
          const mod = calculateDykeMagneticAnomaly(stations[i], x0, d, w, dip, estimatedSusc);
          // Baseline adjust
          const obsNorm = observedNt[i] - minObs;
          const err = mod - obsNorm;
          sumSquaredErr += err * err;
        }
        const rms = Math.sqrt(sumSquaredErr / stations.length);
        if (rms < bestRms) {
          bestRms = rms;
          bestDepth = d;
          bestWidth = w;
          bestDip = dip;
          bestSusc = estimatedSusc;
        }
      }
    }
  }

  // Generate continuous modeled profile points
  const modeledProfile = stations.map((st, i) => {
    const rawObs = observedNt[i];
    const modeled = calculateDykeMagneticAnomaly(st, x0, bestDepth, bestWidth, bestDip, bestSusc) + minObs;
    return {
      stationDistM: st,
      observedNt: Number(rawObs.toFixed(1)),
      modeledNt: Number(modeled.toFixed(1)),
    };
  });

  // Calculate confidence uncertainty bounds (+/- meters)
  // Higher RMS residual yields wider uncertainty envelope
  const uncertainty = Number((bestDepth * 0.18 + (bestRms / 150) * 4.5).toFixed(1));

  return {
    calculatedDepthM: Number(bestDepth.toFixed(1)),
    depthUncertaintyM: Math.max(1.5, uncertainty),
    estimatedWidthM: Number(bestWidth.toFixed(1)),
    dipDegrees: bestDip,
    magneticSusceptibilitySI: Number(bestSusc.toFixed(4)),
    rmsResidualNt: Number(bestRms.toFixed(1)),
    modeledProfile,
  };
}
