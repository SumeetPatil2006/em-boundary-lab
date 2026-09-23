/**
 * EM Boundary Lab - Fundamental Physical Constants & Utility Helpers
 * Electronics & Telecommunication Engineering Project
 */

export const CONSTANTS = {
  // Permittivity of free space (vacuum permittivity) in Farads per meter (F/m)
  EPSILON_0: 8.8541878128e-12,

  // Permeability of free space (vacuum permeability) in Henries per meter (H/m)
  MU_0: 4 * Math.PI * 1e-7, // ~1.2566370614e-6 H/m

  // Speed of light in vacuum in meters per second (m/s)
  C_0: 299792458,

  // Intrinsic impedance of free space in Ohms (Ω)
  ETA_0: Math.sqrt((4 * Math.PI * 1e-7) / 8.8541878128e-12), // ~376.7303 Ω

  // Numerical verification tolerance for floating point comparisons
  TOLERANCE_RELATIVE: 1e-5,
  TOLERANCE_ABSOLUTE: 1e-9
};

/**
 * Formats a numerical value using standard SI metric prefixes.
 * @param {number} value The number to format
 * @param {string} unit The unit symbol (e.g. 'V/m', 'C/m²', 'A/m', 'T', 'Ω')
 * @param {number} precision Number of significant digits
 * @returns {string} Formatted string with SI prefix
 */
export function formatSI(value, unit = '', precision = 4) {
  if (value === undefined || value === null || isNaN(value)) {
    return '—';
  }
  if (!isFinite(value)) {
    return value > 0 ? '+∞' : '-∞';
  }
  if (Math.abs(value) === 0) {
    return `0.00 ${unit}`.trim();
  }

  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const prefixes = [
    { factor: 1e12, symbol: 'T' },
    { factor: 1e9, symbol: 'G' },
    { factor: 1e6, symbol: 'M' },
    { factor: 1e3, symbol: 'k' },
    { factor: 1, symbol: '' },
    { factor: 1e-3, symbol: 'm' },
    { factor: 1e-6, symbol: 'µ' },
    { factor: 1e-9, symbol: 'n' },
    { factor: 1e-12, symbol: 'p' },
    { factor: 1e-15, symbol: 'f' }
  ];

  for (const p of prefixes) {
    if (absVal >= p.factor * 0.999) {
      const scaled = absVal / p.factor;
      return `${sign}${scaled.toFixed(precision).replace(/\.?0+$/, '')} ${p.symbol}${unit}`.trim();
    }
  }

  // Fallback to scientific notation
  return `${value.toExponential(precision)} ${unit}`.trim();
}

/**
 * Formats a number in HTML scientific notation (e.g. 1.23 × 10<sup>-6</sup>).
 * @param {number} value
 * @param {number} digits
 * @param {string} unit
 * @returns {string} HTML string
 */
export function formatScientificHTML(value, digits = 3, unit = '') {
  if (value === undefined || value === null || isNaN(value)) return '—';
  if (!isFinite(value)) return value > 0 ? '+∞' : '-∞';
  if (Math.abs(value) === 0) return `0 ${unit}`.trim();

  // If reasonably sized (0.01 to 9999), show standard decimal
  const abs = Math.abs(value);
  if (abs >= 0.01 && abs <= 9999) {
    return `${value.toFixed(digits).replace(/\.?0+$/, '')} ${unit}`.trim();
  }

  const expStr = value.toExponential(digits);
  const parts = expStr.split('e');
  const coeff = parts[0];
  const exponent = parseInt(parts[1], 10);

  return `${coeff} × 10<sup>${exponent}</sup> ${unit}`.trim();
}

/**
 * Converts radians to degrees with rounded display.
 * @param {number} rad
 * @param {number} decimals
 * @returns {string}
 */
export function formatDegrees(rad, decimals = 1) {
  if (isNaN(rad)) return '—';
  const deg = (rad * 180) / Math.PI;
  return `${deg.toFixed(decimals)}°`;
}

/**
 * Validates and clamps numerical user input.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
export function clamp(val, min, max, fallback = min) {
  if (isNaN(val) || val === null || val === undefined) return fallback;
  return Math.min(Math.max(val, min), max);
}
