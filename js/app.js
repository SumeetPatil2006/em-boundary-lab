/**
 * EM Boundary Lab - Application Controller
 * Connects controls, presets, and the 2D boundary renderer
 */

import { formatSI } from './constants.js';
import { solveBoundaryConditions } from './physics.js';
import { BoundaryRenderer } from './renderer2d.js';
import { PRESETS } from './presets.js';

class App {
  constructor() {
    this.state = {
      fieldType: 'electric', // 'electric' | 'magnetic'
      er1: 1.0,
      ur1: 1.0,
      er2: 4.0,
      ur2: 1.0,
      E1_mag: 100, // Independent electric field input (V/m)
      H1_mag: 1.0, // Independent magnetic field input (A/m) - NEVER derived from E/η!
      theta_deg: 35,
      boundaryData: null
    };

    this.renderer = null;
    this.elements = {};
  }

  init() {
    this.cacheDOMElements();
    this.initRenderer();
    this.bindEvents();
    this.recalculate();
  }

  cacheDOMElements() {
    // Material 1 & 2 Sliders
    this.elements.sliderEr1 = document.getElementById('slider-er1');
    this.elements.badgeEr1 = document.getElementById('badge-er1');

    this.elements.sliderUr1 = document.getElementById('slider-ur1');
    this.elements.badgeUr1 = document.getElementById('badge-ur1');

    this.elements.sliderEr2 = document.getElementById('slider-er2');
    this.elements.badgeEr2 = document.getElementById('badge-er2');

    this.elements.sliderUr2 = document.getElementById('slider-ur2');
    this.elements.badgeUr2 = document.getElementById('badge-ur2');

    // Field Type Selector Buttons & Badges
    this.elements.badgeFieldType = document.getElementById('badge-field-type');
    this.elements.btnFieldElectric = document.getElementById('btn-field-electric');
    this.elements.btnFieldMagnetic = document.getElementById('btn-field-magnetic');

    // Field Magnitude & Angle Sliders
    this.elements.labelFieldMag = document.getElementById('label-field-mag');
    this.elements.sliderF1 = document.getElementById('slider-f1');
    this.elements.badgeF1 = document.getElementById('badge-f1');

    this.elements.sliderTheta1 = document.getElementById('slider-theta1');
    this.elements.badgeTheta1 = document.getElementById('badge-theta1');

    // Presets
    this.elements.presetBtns = document.querySelectorAll('.preset-btn');

    // Canvas container and toggle
    this.elements.canvas = document.getElementById('boundary-canvas');
    this.elements.canvasContainer = document.getElementById('vis-canvas-container');
    this.elements.btnToggleComponents = document.getElementById('btn-toggle-components');
    this.elements.visHintText = document.getElementById('vis-hint-text');

    // Results elements & cards
    this.elements.cardTangentialE = document.getElementById('card-tangential-e');
    this.elements.cardNormalD = document.getElementById('card-normal-d');
    this.elements.cardNormalB = document.getElementById('card-normal-b');
    this.elements.cardTangentialH = document.getElementById('card-tangential-h');

    this.elements.valTangentialE = document.getElementById('val-tangential-e');
    this.elements.valNormalD = document.getElementById('val-normal-d');
    this.elements.valNormalB = document.getElementById('val-normal-b');
    this.elements.valTangentialH = document.getElementById('val-tangential-h');

    this.elements.refractionFormulaText = document.getElementById('refraction-formula-text');
    this.elements.valRefractionCheck = document.getElementById('val-refraction-check');
  }

  initRenderer() {
    this.renderer = new BoundaryRenderer(this.elements.canvas, this.elements.canvasContainer);
  }

  bindEvents() {
    // Material 1 & 2 Sliders
    const wireSlider = (slider, badge, stateKey, formatter) => {
      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        this.state[stateKey] = val;
        badge.textContent = formatter(val);
        this.clearActivePresetHighlight();
        this.recalculate();
      });
    };

    wireSlider(this.elements.sliderEr1, this.elements.badgeEr1, 'er1', (v) => v.toFixed(1));
    wireSlider(this.elements.sliderUr1, this.elements.badgeUr1, 'ur1', (v) => v.toFixed(1));
    wireSlider(this.elements.sliderEr2, this.elements.badgeEr2, 'er2', (v) => v.toFixed(1));
    wireSlider(this.elements.sliderUr2, this.elements.badgeUr2, 'ur2', (v) => v.toFixed(1));

    // Field Magnitude Slider (controls E1 or H1 depending on fieldType)
    this.elements.sliderF1.addEventListener('input', () => {
      const val = parseFloat(this.elements.sliderF1.value);
      if (this.state.fieldType === 'electric') {
        this.state.E1_mag = val;
        this.elements.badgeF1.textContent = `${Math.round(val)} V/m`;
      } else {
        this.state.H1_mag = val;
        this.elements.badgeF1.textContent = `${val.toFixed(2)} A/m`;
      }
      this.clearActivePresetHighlight();
      this.recalculate();
    });

    // Angle Slider (strictly measured from the normal n̂)
    this.elements.sliderTheta1.addEventListener('input', () => {
      const val = parseFloat(this.elements.sliderTheta1.value);
      this.state.theta_deg = val;
      this.elements.badgeTheta1.textContent = `${Math.round(val)}°`;
      this.clearActivePresetHighlight();
      this.recalculate();
    });

    // Field Type Switcher
    this.elements.btnFieldElectric.addEventListener('click', () => {
      this.setFieldType('electric');
    });

    this.elements.btnFieldMagnetic.addEventListener('click', () => {
      this.setFieldType('magnetic');
    });

    // Presets
    this.elements.presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetId = btn.dataset.preset;
        const preset = PRESETS.find((p) => p.id === presetId);
        if (preset) {
          this.applyPreset(preset);
          this.elements.presetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // Toggle Components button
    this.elements.btnToggleComponents.addEventListener('click', () => {
      const active = this.renderer.toggleComponents();
      this.elements.btnToggleComponents.classList.toggle('active', active);
    });
  }

  setFieldType(type) {
    this.state.fieldType = type;

    const isElectric = type === 'electric';
    this.elements.btnFieldElectric.classList.toggle('active', isElectric);
    this.elements.btnFieldMagnetic.classList.toggle('magnetic-active', !isElectric);
    this.elements.btnFieldMagnetic.classList.toggle('active', !isElectric);

    if (isElectric) {
      this.elements.badgeFieldType.textContent = 'Electric (E)';
      this.elements.badgeFieldType.className = 'pill-tag blue';
      this.elements.labelFieldMag.textContent = 'Magnitude (E₁)';
      this.elements.sliderF1.min = '20';
      this.elements.sliderF1.max = '250';
      this.elements.sliderF1.step = '5';
      this.elements.sliderF1.value = this.state.E1_mag;
      this.elements.badgeF1.textContent = `${Math.round(this.state.E1_mag)} V/m`;

      this.elements.visHintText.innerHTML = `<strong>Try it yourself:</strong> Drag the <strong>Permittivity of Material 2 (εᵣ₂)</strong> slider on the left to watch the electric field vector bend away from the normal.`;
      this.elements.refractionFormulaText.textContent = 'tan(θ₁) / tan(θ₂) = εᵣ₁ / εᵣ₂';

      this.elements.cardTangentialE.classList.add('active-card');
      this.elements.cardNormalD.classList.add('active-card');
      this.elements.cardNormalB.classList.remove('active-card');
      this.elements.cardTangentialH.classList.remove('active-card');
    } else {
      this.elements.badgeFieldType.textContent = 'Magnetic (H)';
      this.elements.badgeFieldType.className = 'pill-tag orange';
      this.elements.labelFieldMag.textContent = 'Magnitude (H₁)';
      this.elements.sliderF1.min = '0.2';
      this.elements.sliderF1.max = '5.0';
      this.elements.sliderF1.step = '0.1';
      this.elements.sliderF1.value = this.state.H1_mag;
      this.elements.badgeF1.textContent = `${this.state.H1_mag.toFixed(2)} A/m`;

      this.elements.visHintText.innerHTML = `<strong>Try it yourself:</strong> Drag the <strong>Permeability of Material 2 (μᵣ₂)</strong> slider on the left to watch the magnetic field vector bend away from the normal.`;
      this.elements.refractionFormulaText.textContent = 'tan(θ₁) / tan(θ₂) = μᵣ₁ / μᵣ₂';

      this.elements.cardTangentialE.classList.remove('active-card');
      this.elements.cardNormalD.classList.remove('active-card');
      this.elements.cardNormalB.classList.add('active-card');
      this.elements.cardTangentialH.classList.add('active-card');
    }

    this.recalculate();
  }

  clearActivePresetHighlight() {
    this.elements.presetBtns.forEach((b) => b.classList.remove('active'));
  }

  applyPreset(preset) {
    Object.assign(this.state, preset.params);

    this.elements.sliderEr1.value = this.state.er1;
    this.elements.badgeEr1.textContent = this.state.er1.toFixed(1);

    this.elements.sliderUr1.value = this.state.ur1;
    this.elements.badgeUr1.textContent = this.state.ur1.toFixed(1);

    this.elements.sliderEr2.value = this.state.er2;
    this.elements.badgeEr2.textContent = this.state.er2.toFixed(1);

    this.elements.sliderUr2.value = this.state.ur2;
    this.elements.badgeUr2.textContent = this.state.ur2.toFixed(1);

    if (this.state.fieldType === 'electric') {
      this.elements.sliderF1.value = this.state.E1_mag;
      this.elements.badgeF1.textContent = `${Math.round(this.state.E1_mag)} V/m`;
    } else {
      this.elements.sliderF1.value = this.state.H1_mag;
      this.elements.badgeF1.textContent = `${this.state.H1_mag.toFixed(2)} A/m`;
    }

    this.elements.sliderTheta1.value = this.state.theta_deg;
    this.elements.badgeTheta1.textContent = `${Math.round(this.state.theta_deg)}°`;

    this.recalculate();
  }

  recalculate() {
    const theta_rad = (this.state.theta_deg * Math.PI) / 180;

    // Numerically solve Maxwell boundary conditions with independent E and H
    const data = solveBoundaryConditions({
      er1: this.state.er1,
      ur1: this.state.ur1,
      er2: this.state.er2,
      ur2: this.state.ur2,
      E1_mag: this.state.E1_mag,
      H1_mag: this.state.H1_mag,
      theta_rad: theta_rad
    });

    this.state.boundaryData = data;

    // Update Right Panel Verification Cards
    const e = data.electric;
    const h = data.magnetic;

    // 1. Tangential Electric Field: E1t = E2t
    this.elements.valTangentialE.innerHTML = `E₁ₜ = <strong>${formatSI(e.E1t, 'V/m')}</strong> &nbsp;|&nbsp; E₂ₜ = <strong>${formatSI(e.E2t, 'V/m')}</strong>`;

    // 2. Normal Electric Flux Density: D1n = D2n
    this.elements.valNormalD.innerHTML = `D₁ₙ = <strong>${formatSI(e.D1n, 'C/m²', 3)}</strong> &nbsp;|&nbsp; D₂ₙ = <strong>${formatSI(e.D2n, 'C/m²', 3)}</strong>`;

    // 3. Normal Magnetic Flux Density: B1n = B2n
    this.elements.valNormalB.innerHTML = `B₁ₙ = <strong>${formatSI(h.B1n, 'T', 3)}</strong> &nbsp;|&nbsp; B₂ₙ = <strong>${formatSI(h.B2n, 'T', 3)}</strong>`;

    // 4. Tangential Magnetic Field: H1t = H2t
    this.elements.valTangentialH.innerHTML = `H₁ₜ = <strong>${formatSI(h.H1t, 'A/m')}</strong> &nbsp;|&nbsp; H₂ₜ = <strong>${formatSI(h.H2t, 'A/m')}</strong>`;

    // 5. Refraction Law Verification Check
    if (this.state.fieldType === 'electric') {
      const tanRatio = e.refractionRatio.toFixed(4);
      const matRatio = e.theoreticalRatio.toFixed(4);
      this.elements.valRefractionCheck.innerHTML = `tan(θ₁)/tan(θ₂) = <strong>${tanRatio}</strong> &nbsp;|&nbsp; εᵣ₁/εᵣ₂ = <strong>${matRatio}</strong>`;
    } else {
      const tanRatio = h.refractionRatio.toFixed(4);
      const matRatio = h.theoreticalRatio.toFixed(4);
      this.elements.valRefractionCheck.innerHTML = `tan(θ₁)/tan(θ₂) = <strong>${tanRatio}</strong> &nbsp;|&nbsp; μᵣ₁/μᵣ₂ = <strong>${matRatio}</strong>`;
    }

    // Update 2D Canvas immediately
    this.renderer.setState(this.state);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
