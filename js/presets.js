/**
 * EM Boundary Lab - Simple Academic Presets
 * Focused on clear educational scenarios for classroom presentation.
 */

export const PRESETS = [
  {
    id: 'air_to_air',
    name: 'Air → Air',
    description: 'Same medium on both sides (εr1 = 1, εr2 = 1). The field travels straight through without any bending or magnitude change.',
    params: {
      er1: 1.0,
      ur1: 1.0,
      er2: 1.0,
      ur2: 1.0,
      E1_mag: 100,
      H1_mag: 1.0,
      theta_deg: 35
    }
  },
  {
    id: 'air_to_glass',
    name: 'Air → Glass (Dielectric)',
    description: 'Free space into glass (εr1 = 1, εr2 = 4). Electric field bends away from the normal due to D1n = D2n.',
    params: {
      er1: 1.0,
      ur1: 1.0,
      er2: 4.0,
      ur2: 1.0,
      E1_mag: 100,
      H1_mag: 1.0,
      theta_deg: 35
    }
  },
  {
    id: 'dielectric_to_dielectric',
    name: 'Dielectric → Dielectric',
    description: 'Interface between two distinct insulating media (εr1 = 2, εr2 = 6). Demonstrates field refraction: tan(θ1)/tan(θ2) = εr1/εr2.',
    params: {
      er1: 2.0,
      ur1: 1.0,
      er2: 6.0,
      ur2: 1.0,
      E1_mag: 100,
      H1_mag: 1.0,
      theta_deg: 45
    }
  }
];
