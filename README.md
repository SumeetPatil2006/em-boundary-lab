# em-boundary-lab

An interactive educational simulation for studying the boundary conditions of electric and magnetic fields at the interface between two different materials.

## Academic Topic

**Study of Boundary Conditions for Electric and Magnetic Fields**

## Introduction

When an electromagnetic field travels from one material to another, its behavior at the boundary between the two materials is governed by specific physical rules known as electromagnetic boundary conditions.

These conditions describe how the electric field, electric flux density, magnetic field, and magnetic flux density behave at the interface.

The EM Boundary Lab provides an interactive way to visualize and understand these concepts.

## Objectives

- To understand the concept of electromagnetic boundary conditions.
- To study the behavior of electric and magnetic fields at material interfaces.
- To understand normal and tangential components of electromagnetic fields.
- To observe the effect of material properties on field behavior.
- To verify boundary-condition concepts using an interactive simulation.

## Theoretical Background

When two different materials meet, an interface is formed between them. The electromagnetic fields on both sides of this interface do not change arbitrarily. Their behavior is determined by Maxwell's equations and the properties of the materials.

### Electric Field

The tangential component of the electric field remains continuous across a boundary when no time-varying magnetic flux produces an abrupt discontinuity.

In simple terms:

**Tangential electric field in Material 1 = Tangential electric field in Material 2**

### Electric Flux Density

The normal component of electric flux density depends on the amount of free surface charge present at the boundary.

When there is no free surface charge:

**Normal electric flux density in Material 1 = Normal electric flux density in Material 2**

### Magnetic Flux Density

Magnetic flux density has continuous normal components across a boundary because isolated magnetic charges do not exist.

In simple terms:

**Normal magnetic flux density in Material 1 = Normal magnetic flux density in Material 2**

### Magnetic Field

The tangential component of the magnetic field is affected by surface current at the boundary.

When there is no surface current:

**Tangential magnetic field in Material 1 = Tangential magnetic field in Material 2**

## Important Electromagnetic Quantities

The project demonstrates the relationship between the following quantities:

- **E** – Electric Field Intensity
- **D** – Electric Flux Density
- **H** – Magnetic Field Intensity
- **B** – Magnetic Flux Density

The behavior of these quantities depends on the properties of the materials, mainly:

- Permittivity
- Permeability

## Normal and Tangential Components

An electromagnetic field at a boundary can be divided into two components:

### Normal Component

The component perpendicular to the boundary surface.

### Tangential Component

The component parallel to the boundary surface.

The boundary conditions determine how these components behave when the field crosses from one material into another.

## Simulation Features

The EM Boundary Lab allows the user to:

- Select different materials.
- Change material properties.
- Adjust field magnitude.
- Adjust the field angle.
- Visualize electric and magnetic fields.
- Observe normal and tangential components.
- Compare field behavior on both sides of the boundary.
- Check whether the boundary conditions are satisfied.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Canvas API

## Project Structure

```text
em-boundary-lab/
│
├── index.html
│
├── css/
│   └── styles.css
│
├── js/
│   ├── app.js
│   ├── constants.js
│   ├── physics.js
│   ├── presets.js
│   └── renderer2d.js
│
└── .gitignore
