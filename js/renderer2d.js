/**
 * EM Boundary Lab - Dynamic, Responsive 2D Canvas Visualizer
 *
 * Implements a truly responsive, high-DPI canvas simulation that:
 * - Dynamically tracks container dimensions via ResizeObserver
 * - Automatically scales vector lengths to fit any viewport without clipping
 * - Prevents label collisions with intelligent positioning
 * - Accurately visualizes Maxwell's field refraction:
 *     Electric: tan(θ₂) = tan(θ₁) * (εr2 / εr1)
 *     Magnetic: tan(θ₂) = tan(θ₁) * (μr2 / μr1)
 */

import { formatDegrees, formatSI } from './constants.js';

export class BoundaryRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} container
   */
  constructor(canvas, container) {
    this.canvas = canvas;
    this.container = container || canvas.parentElement;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    this.state = null;
    this.showComponents = true; // Show dashed normal & tangential components

    // Setup ResizeObserver for responsive layout adaptation
    this.resizeObserver = new ResizeObserver(() => this.resize());
    if (this.container) {
      this.resizeObserver.observe(this.container);
    }

    this.resize();
  }

  resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(340, Math.floor(rect.height || 480));

    this.width = width;
    this.height = height;

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);
    this.render();
  }

  setState(state) {
    this.state = state;
    this.render();
  }

  toggleComponents() {
    this.showComponents = !this.showComponents;
    this.render();
    return this.showComponents;
  }

  render() {
    if (!this.ctx || !this.state || !this.state.boundaryData) return;
    const { width, height, ctx } = this;
    const data = this.state.boundaryData;

    ctx.clearRect(0, 0, width, height);

    // Boundary sits horizontally at center
    const boundaryY = Math.round(height * 0.5);
    const centerX = Math.round(width * 0.5);

    // 1. Draw Media Backgrounds
    this.drawMediaBackgrounds(boundaryY, data.mat1, data.mat2);

    // 2. Draw Boundary Line
    this.drawBoundaryLine(boundaryY);

    // 3. Draw Normal Direction Dashed Line
    this.drawNormalLine(centerX);

    // 4. Draw Selected Field Vectors (Electric or Magnetic)
    const isElectric = (this.state.fieldType || 'electric') === 'electric';
    const fieldData = isElectric ? data.electric : data.magnetic;
    this.drawFieldVectors(centerX, boundaryY, fieldData, isElectric, data.mat1, data.mat2);

    // 5. Draw Clean Corner Badges
    this.drawCornerBadges(boundaryY, data.mat1, data.mat2, isElectric);
  }

  drawMediaBackgrounds(boundaryY, mat1, mat2) {
    const { width, height, ctx } = this;

    // Material 1 (Upper region, light cool blue tint)
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(0, 0, width, boundaryY);

    // Material 2 (Lower region, warm soft peach tint)
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, boundaryY, width, height - boundaryY);
  }

  drawBoundaryLine(boundaryY) {
    const { width, ctx } = this;
    ctx.save();

    // Subtle boundary accent glow
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, boundaryY);
    ctx.lineTo(width, boundaryY);
    ctx.stroke();

    // Solid boundary line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, boundaryY);
    ctx.lineTo(width, boundaryY);
    ctx.stroke();

    // Center boundary intersection dot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(width * 0.5, boundaryY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Boundary label badge at right edge
    ctx.font = '600 11px "Inter", -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('INTERFACE / BOUNDARY', width - 16, boundaryY - 6);

    ctx.restore();
  }

  drawNormalLine(centerX) {
    const { height, ctx } = this;
    ctx.save();

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX, height - 15);
    ctx.stroke();

    ctx.setLineDash([]);

    // Small normal arrow at bottom pointing downward (+y, 1 -> 2)
    this.drawArrowHead(centerX, height - 15, 0, 1, 7, '#94a3b8');

    // Normal labels
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Normal (n̂)', centerX + 8, 16);
    ctx.fillText('Normal (n̂)', centerX + 8, height - 30);

    ctx.restore();
  }

  drawFieldVectors(cx, cy, fData, isElectric, mat1, mat2) {
    const ctx = this.ctx;
    const { width, height } = this;

    const vectorColor = isElectric ? '#1d4ed8' : '#d97706'; // Royal Blue for E, Amber for H
    const compColor = isElectric ? '#60a5fa' : '#fbbf24';   // Light sky blue or light amber
    const fieldSymbol = isElectric ? 'E' : 'H';
    const fieldUnit = isElectric ? 'V/m' : 'A/m';

    // Calculate maximum available radius in each half to ensure NO CLIPPING
    const maxHalfHeight = cy - 40;
    const maxHalfWidth = (width * 0.5) - 30;
    const availableRadius = Math.min(maxHalfWidth, maxHalfHeight);

    // Scale vector lengths dynamically:
    const baseLength = Math.max(60, availableRadius * 0.72);

    const f1_mag = isElectric ? fData.E1 : fData.H1;
    const f2_mag = isElectric ? fData.E2 : fData.H2;
    const magRatio = f1_mag > 0 ? (f2_mag / f1_mag) : 1;
    const clampedRatio = Math.max(0.4, Math.min(1.6, magRatio));

    const len1 = baseLength;
    const len2 = baseLength * clampedRatio;

    // Vector 1: Incident Field in Material 1
    const dx1 = Math.sin(fData.theta1_rad) * len1;
    const dy1 = Math.cos(fData.theta1_rad) * len1;
    const startX1 = cx - dx1;
    const startY1 = cy - dy1;

    // Vector 2: Transmitted Field in Material 2
    const dx2 = Math.sin(fData.theta2_rad) * len2;
    const dy2 = Math.cos(fData.theta2_rad) * len2;
    const endX2 = cx + dx2;
    const endY2 = cy + dy2;

    // Draw Decomposed Components (Fn and Ft) if enabled
    if (this.showComponents) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = compColor;
      ctx.lineWidth = 1.5;

      // Material 1 Normal Component:
      this.drawVectorLine(cx, startY1, cx, cy, compColor, 1.5, `${fieldSymbol}₁n`, 'right');
      // Material 1 Tangential Component:
      this.drawVectorLine(startX1, cy, cx, cy, compColor, 1.5, `${fieldSymbol}₁t`, 'top');

      // Material 1 Component Box outline
      ctx.beginPath();
      ctx.moveTo(startX1, startY1);
      ctx.lineTo(startX1, cy);
      ctx.stroke();

      // Material 2 Normal Component:
      this.drawVectorLine(cx, cy, cx, cy + dy2, compColor, 1.5, `${fieldSymbol}₂n`, 'right');
      // Material 2 Tangential Component:
      this.drawVectorLine(cx, cy, endX2, cy, compColor, 1.5, `${fieldSymbol}₂t`, 'bottom');

      // Material 2 Component Box outline
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy2);
      ctx.lineTo(endX2, cy + dy2);
      ctx.lineTo(endX2, cy);
      ctx.stroke();

      ctx.restore();
    }

    // Format magnitude display
    const f1_disp = isElectric ? Math.round(f1_mag) : f1_mag.toFixed(2);
    const f2_disp = isElectric ? Math.round(f2_mag) : f2_mag.toFixed(2);

    // Draw Main Incident Vector
    this.drawVectorLine(
      startX1, startY1, cx, cy,
      vectorColor, 3,
      `${fieldSymbol}₁ = ${f1_disp} ${fieldUnit}`,
      'left',
      `Incident ${isElectric ? 'Electric' : 'Magnetic'} Field`
    );

    // Draw Main Transmitted Vector
    this.drawVectorLine(
      cx, cy, endX2, endY2,
      vectorColor, 3,
      `${fieldSymbol}₂ = ${f2_disp} ${fieldUnit}`,
      'right',
      `Transmitted ${isElectric ? 'Electric' : 'Magnetic'} Field`
    );

    // Draw Angle Arcs (θ₁ and θ₂)
    const arcRadius = Math.max(30, Math.min(50, availableRadius * 0.28));
    this.drawAngleArc(cx, cy, arcRadius, -Math.PI / 2, -Math.PI / 2 + fData.theta1_rad, `θ₁ = ${formatDegrees(fData.theta1_rad, 0)}`, vectorColor, 'top');
    this.drawAngleArc(cx, cy, arcRadius, Math.PI / 2 - fData.theta2_rad, Math.PI / 2, `θ₂ = ${formatDegrees(fData.theta2_rad, 1)}`, vectorColor, 'bottom');
  }

  drawVectorLine(x1, y1, x2, y2, color, lineWidth = 2, label = '', labelSide = 'right', subtitle = '') {
    const ctx = this.ctx;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 3) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead at (x2, y2)
    const headSize = Math.max(8, lineWidth * 3);
    this.drawArrowHead(x2, y2, dx / length, dy / length, headSize, color);

    // Text Label with clean pill background to prevent any visual overlap
    if (label) {
      const midX = (x1 + x2) * 0.5;
      const midY = (y1 + y2) * 0.5;

      let tx = midX;
      let ty = midY;
      ctx.textAlign = 'center';

      if (labelSide === 'left') {
        tx -= 14;
        ctx.textAlign = 'right';
      } else if (labelSide === 'right') {
        tx += 14;
        ctx.textAlign = 'left';
      } else if (labelSide === 'top') {
        ty -= 10;
        ctx.textBaseline = 'bottom';
      } else if (labelSide === 'bottom') {
        ty += 14;
        ctx.textBaseline = 'top';
      }

      ctx.font = '600 12px "Inter", sans-serif';
      const mainMetrics = ctx.measureText(label);
      let totalWidth = mainMetrics.width;

      if (subtitle) {
        ctx.font = '500 10px "Inter", sans-serif';
        const subMetrics = ctx.measureText(subtitle);
        totalWidth = Math.max(totalWidth, subMetrics.width);
      }

      // Draw rounded white badge background
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 1;

      const padX = 6;
      const padY = 4;
      const badgeH = subtitle ? 28 : 18;
      const badgeW = totalWidth + padX * 2;

      let badgeX = tx - padX;
      if (ctx.textAlign === 'center') badgeX = tx - badgeW * 0.5;
      else if (ctx.textAlign === 'right') badgeX = tx - badgeW + padX;

      const badgeY = ty - 10;
      this.drawRoundedRect(badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Render text
      if (subtitle) {
        ctx.font = '700 9px "Inter", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(subtitle.toUpperCase(), tx, ty - 1);

        ctx.font = '700 12px "Inter", sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, tx, ty + 12);
      } else {
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, tx, ty + 4);
      }
    }

    ctx.restore();
  }

  drawArrowHead(x, y, uX, uY, size, color) {
    const ctx = this.ctx;
    const normalX = -uY;
    const normalY = uX;
    const halfWidth = size * 0.45;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - uX * size + normalX * halfWidth, y - uY * size + normalY * halfWidth);
    ctx.lineTo(x - uX * size - normalX * halfWidth, y - uY * size - normalY * halfWidth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawAngleArc(cx, cy, radius, startAngle, endAngle, label, color, position = 'top') {
    const ctx = this.ctx;
    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([2, 2]);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    ctx.setLineDash([]);

    // Degree label at midpoint of arc
    const midAngle = (startAngle + endAngle) * 0.5;
    const textRadius = radius + 15;
    const lx = cx + Math.cos(midAngle) * textRadius;
    const ly = cy + Math.sin(midAngle) * textRadius;

    ctx.font = '600 11px "JetBrains Mono", monospace';
    const metrics = ctx.measureText(label);

    // Pill behind angle label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.lineWidth = 1;
    this.drawRoundedRect(lx - metrics.width * 0.5 - 4, ly - 8, metrics.width + 8, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly);

    ctx.restore();
  }

  drawCornerBadges(boundaryY, mat1, mat2, isElectric) {
    const ctx = this.ctx;
    ctx.save();

    // Material 1 Corner Tag (Top Left)
    ctx.font = '800 13px "Inter", sans-serif';
    ctx.fillStyle = '#1e40af';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('MATERIAL 1', 18, 16);

    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    if (isElectric) {
      ctx.fillText(`Relative Permittivity: εᵣ₁ = ${mat1.er.toFixed(1)}`, 18, 34);
    } else {
      ctx.fillText(`Relative Permeability: μᵣ₁ = ${mat1.ur.toFixed(1)}`, 18, 34);
    }

    // Material 2 Corner Tag (Bottom Left)
    ctx.font = '800 13px "Inter", sans-serif';
    ctx.fillStyle = '#9a3412';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('MATERIAL 2', 18, boundaryY + 16);

    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    if (isElectric) {
      ctx.fillText(`Relative Permittivity: εᵣ₂ = ${mat2.er.toFixed(1)}`, 18, boundaryY + 34);
    } else {
      ctx.fillText(`Relative Permeability: μᵣ₂ = ${mat2.ur.toFixed(1)}`, 18, boundaryY + 34);
    }

    ctx.restore();
  }

  drawRoundedRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
