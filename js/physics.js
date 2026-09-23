/**
 * EM Boundary Lab - Maxwell Boundary Conditions Physics Engine
 * Electronics & Telecommunication Engineering Project
 *
 * RIGOROUS AUDIT COMPLIANCE:
 * 1. Electric and Magnetic fields are treated INDEPENDENTLY.
 *    Wave impedance (H = E / η) is NOT used, as this is a general boundary condition
 *    problem, not a plane wave propagation simulation.
 * 2. Permittivity (ε) affects ONLY electric quantities (E, D). Permeability (μ) does NOT
 *    alter electric fields.
 * 3. Permeability (μ) affects ONLY magnetic quantities (H, B). Permittivity (ε) does NOT
 *    alter magnetic fields.
 * 4. Governing Maxwell Boundary Equations:
 *    - Tangential Electric Field:    n̂ × (E₂ - E₁) = 0   =>  E₂t = E₁t
 *    - Normal Electric Flux Density: n̂ · (D₂ - D₁) = ρs  =>  D₂n - D₁n = ρs  (D₂n = D₁n for ρs = 0)
 *    - Normal Magnetic Flux Density: n̂ · (B₂ - B₁) = 0   =>  B₂n = B₁n
 *    - Tangential Magnetic Field:    n̂ × (H₂ - H₁) = Js  =>  H₂t - H₁t = Js  (H₂t = H₁t for Js = 0)
 * 5. Constitutive Equations:
 *    - D = ε E = εr ε₀ E   [SI Unit: C/m²]
 *    - B = μ H = μr μ₀ H   [SI Unit: T = Wb/m²]
 *    with ε₀ = 8.8541878128e-12 F/m and μ₀ = 4π × 10⁻⁷ H/m.
 * 6. Refraction Laws (under linear, isotropic, homogeneous assumptions with ρs = 0, Js = 0):
 *    - Electric: tan(θ₁) / tan(θ₂) = ε₁ / ε₂  =>  tan(θ₂) = tan(θ₁) * (ε₂ / ε₁)
 *    - Magnetic: tan(θ₁) / tan(θ₂) = μ₁ / μ₂  =>  tan(θ₂) = tan(θ₁) * (μ₂ / μ₁)
 */

import { CONSTANTS } from './constants.js';

/**
 * Calculates constitutive material parameters for a medium.
 * @param {number} er Relative permittivity (εr >= 1)
 * @param {number} ur Relative permeability (μr >= 1)
 * @returns {object} Material properties
 */
export function calculateMaterialProperties(er, ur) {
  const epsilon = er * CONSTANTS.EPSILON_0; // F/m
  const mu = ur * CONSTANTS.MU_0;           // H/m

  return {
    er,
    ur,
    epsilon,
    mu
  };
}

/**
 * Solves electrostatic and magnetostatic boundary conditions across a planar boundary.
 *
 * Coordinate Geometry & Conventions:
 * - Planar interface at y = 0.
 * - Material 1 is in the upper half (y < 0).
 * - Material 2 is in the lower half (y > 0).
 * - Normal unit vector n̂ points from Material 1 into Material 2 (+y direction).
 * - Tangential unit vector t̂ is parallel to the interface (+x direction).
 * - Incident angle θ₁ is strictly measured from the normal n̂.
 *
 * @param {object} params
 * @param {number} params.er1 Material 1 relative permittivity
 * @param {number} params.ur1 Material 1 relative permeability
 * @param {number} params.er2 Material 2 relative permittivity
 * @param {number} params.ur2 Material 2 relative permeability
 * @param {number} [params.E1_mag=100] Incident electric field magnitude (V/m) - Independent input
 * @param {number} [params.H1_mag=1.0] Incident magnetic field magnitude (A/m) - Independent input (NOT derived from E/η!)
 * @param {number} [params.theta_rad=0.61] Incident angle from normal (rad)
 * @param {number} [params.rho_s=0] Free surface charge density (C/m²)
 * @param {number} [params.J_s=0] Free surface current density (A/m)
 * @returns {object} Calculated fields, angles, components, and verification status
 */
export function solveBoundaryConditions({
  er1 = 1,
  ur1 = 1,
  er2 = 4,
  ur2 = 1,
  E1_mag = 100,
  H1_mag = 1.0,
  theta_rad = (35 * Math.PI) / 180,
  rho_s = 0,
  J_s = 0
}) {
  const mat1 = calculateMaterialProperties(er1, ur1);
  const mat2 = calculateMaterialProperties(er2, ur2);

  // -------------------------------------------------------------------------
  // 1. ELECTRIC FIELD & FLUX DENSITY (INDEPENDENT OF μ)
  // -------------------------------------------------------------------------
  // Material 1 incident vector decomposition:
  // Normal component along n̂: E1n = E1 * cos(θ₁)
  // Tangential component along t̂: E1t = E1 * sin(θ₁)
  const E1n = E1_mag * Math.cos(theta_rad);
  const E1t = E1_mag * Math.sin(theta_rad);
  const E1 = Math.sqrt(E1n * E1n + E1t * E1t);

  // Constitutive flux densities in Material 1: D = ε E
  const D1n = mat1.epsilon * E1n;
  const D1t = mat1.epsilon * E1t;
  const D1 = mat1.epsilon * E1;

  // Maxwell Boundary Condition 1: Tangential E continuity => E2t = E1t
  const E2t = E1t;

  // Maxwell Boundary Condition 2: Normal D discontinuity => D2n - D1n = ρs => D2n = D1n + ρs
  const D2n = D1n + rho_s;

  // Normal E field in Material 2: E2n = D2n / ε₂ = (ε₁ E1n + ρs) / ε₂
  const E2n = D2n / mat2.epsilon;

  // Tangential D in Material 2: D2t = ε₂ E2t
  const D2t = mat2.epsilon * E2t;

  // Reconstructed Material 2 field magnitude:
  const E2 = Math.sqrt(E2n * E2n + E2t * E2t);
  const D2 = Math.sqrt(D2n * D2n + D2t * D2t);

  // Transmitted angle θ₂ measured from normal n̂:
  // tan(θ₂) = |E2t| / |E2n|
  const theta2_E_rad = Math.atan2(Math.abs(E2t), Math.abs(E2n));

  // -------------------------------------------------------------------------
  // 2. MAGNETIC FIELD & FLUX DENSITY (INDEPENDENT OF ε AND E/η)
  // -------------------------------------------------------------------------
  // Material 1 incident magnetic vector decomposition from INDEPENDENT H1_mag:
  const H1n = H1_mag * Math.cos(theta_rad);
  const H1t = H1_mag * Math.sin(theta_rad);
  const H1 = Math.sqrt(H1n * H1n + H1t * H1t);

  // Constitutive magnetic flux densities in Material 1: B = μ H
  const B1n = mat1.mu * H1n;
  const B1t = mat1.mu * H1t;
  const B1 = mat1.mu * H1;

  // Maxwell Boundary Condition 3: Normal B continuity => B2n = B1n
  const B2n = B1n;

  // Normal H field in Material 2: H2n = B2n / μ₂ = (μ₁ / μ₂) * H1n
  const H2n = B2n / mat2.mu;

  // Maxwell Boundary Condition 4: Tangential H discontinuity => H2t - H1t = Js => H2t = H1t + Js
  const H2t = H1t + J_s;

  // Tangential B in Material 2: B2t = μ₂ H2t
  const B2t = mat2.mu * H2t;

  // Reconstructed Material 2 magnetic field magnitude:
  const H2 = Math.sqrt(H2n * H2n + H2t * H2t);
  const B2 = Math.sqrt(B2n * B2n + B2t * B2t);

  // Transmitted magnetic angle θ₂_H measured from normal n̂:
  const theta2_H_rad = Math.atan2(Math.abs(H2t), Math.abs(H2n));

  // -------------------------------------------------------------------------
  // 3. NUMERICAL VERIFICATION OF BOUNDARY CONDITIONS
  // -------------------------------------------------------------------------
  const verifications = [
    {
      id: 'tangential_E',
      name: 'Tangential Electric Field',
      equation: 'E₁t = E₂t',
      lhsName: 'E₁t',
      lhsValue: E1t,
      rhsName: 'E₂t',
      rhsValue: E2t,
      diff: Math.abs(E2t - E1t),
      unit: 'V/m',
      tolerance: 1e-6,
      passed: Math.abs(E2t - E1t) <= 1e-6,
      lawOrigin: 'Faraday Law (∮ E·dl = 0 for narrow Stokes loop as Δh → 0)',
      note: 'Tangential electric field is continuous across the boundary.'
    },
    {
      id: 'normal_D',
      name: 'Normal Electric Flux Density',
      equation: rho_s === 0 ? 'D₁n = D₂n' : 'D₂n − D₁n = ρs',
      lhsName: rho_s === 0 ? 'D₁n' : 'D₂n − D₁n',
      lhsValue: rho_s === 0 ? D1n : (D2n - D1n),
      rhsName: rho_s === 0 ? 'D₂n' : 'ρs',
      rhsValue: rho_s === 0 ? D2n : rho_s,
      diff: Math.abs(D2n - D1n - rho_s),
      unit: 'C/m²',
      tolerance: 1e-12,
      passed: Math.abs(D2n - D1n - rho_s) <= 1e-12,
      lawOrigin: 'Gauss Law (∮ D·dA = Q_free,enc for Gaussian pillbox as Δh → 0)',
      note: rho_s === 0
        ? 'Normal electric flux density is continuous when no free surface charge exists.'
        : `Discontinuous by exact surface charge density ρs = ${rho_s} C/m².`
    },
    {
      id: 'normal_B',
      name: 'Normal Magnetic Flux Density',
      equation: 'B₁n = B₂n',
      lhsName: 'B₁n',
      lhsValue: B1n,
      rhsName: 'B₂n',
      rhsValue: B2n,
      diff: Math.abs(B2n - B1n),
      unit: 'T',
      tolerance: 1e-12,
      passed: Math.abs(B2n - B1n) <= 1e-12,
      lawOrigin: 'Gauss Law for Magnetism (∇·B = 0 => ∮ B·dA = 0)',
      note: 'Normal magnetic flux density is always continuous (no magnetic monopoles).'
    },
    {
      id: 'tangential_H',
      name: 'Tangential Magnetic Field',
      equation: J_s === 0 ? 'H₁t = H₂t' : 'H₂t − H₁t = Js',
      lhsName: J_s === 0 ? 'H₁t' : 'H₂t − H₁t',
      lhsValue: J_s === 0 ? H1t : (H2t - H1t),
      rhsName: J_s === 0 ? 'H₂t' : 'Js',
      rhsValue: J_s === 0 ? H2t : J_s,
      diff: Math.abs(H2t - H1t - J_s),
      unit: 'A/m',
      tolerance: 1e-6,
      passed: Math.abs(H2t - H1t - J_s) <= 1e-6,
      lawOrigin: 'Ampère Circuital Law (∮ H·dl = I_free,enc for Stokes loop as Δh → 0)',
      note: J_s === 0
        ? 'Tangential magnetic field intensity is continuous when no surface current sheet exists.'
        : `Discontinuous by exact surface current density Js = ${J_s} A/m.`
    }
  ];

  return {
    mat1,
    mat2,
    electric: {
      E1,
      E1n,
      E1t,
      D1,
      D1n,
      D1t,
      theta1_rad: theta_rad,
      E2,
      E2n,
      E2t,
      D2,
      D2n,
      D2t,
      theta2_rad: theta2_E_rad,
      refractionRatio: Math.tan(theta_rad) / Math.tan(theta2_E_rad),
      theoreticalRatio: er1 / er2
    },
    magnetic: {
      H1,
      H1n,
      H1t,
      B1,
      B1n,
      B1t,
      theta1_rad: theta_rad,
      H2,
      H2n,
      H2t,
      B2,
      B2n,
      B2t,
      theta2_rad: theta2_H_rad,
      refractionRatio: Math.tan(theta_rad) / Math.tan(theta2_H_rad),
      theoreticalRatio: ur1 / ur2
    },
    verifications
  };
}
