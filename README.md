# Incursio 🌐⚡

[![Live Application](https://img.shields.io/badge/Live%20App-incursio.onrender.com-00d2ff?style=for-the-badge&logo=render&logoColor=white)](https://incursio.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE.md)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20Mobile-blueviolet?style=for-the-badge)](https://incursio.onrender.com)
[![Engine](https://img.shields.io/badge/Engine-WebGL%20%2F%20HTML5%20Canvas%20Dual--Layer-48bb78?style=for-the-badge)](#technical-architecture)
[![Data](https://img.shields.io/badge/Meteorological%20Data-NOAA%20GFS%20GRIB2-orange?style=for-the-badge)](#meteorological-data-pipeline)

> **Incursio** is an advanced, client-side meteorological dynamics visualization engine and weather threat intelligence platform. It renders high-resolution global atmospheric vector fields, scalar climate layers, and real-time forecast data at 60 FPS using GPU-accelerated HTML5 dual-canvas rendering and client-side numerical interpolation.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technical Architecture](#-technical-architecture)
- [Mathematical & Interpolation Engine](#-mathematical--interpolation-engine)
- [Cartographic Projections](#-cartographic-projections)
- [Meteorological Data Pipeline](#-meteorological-data-pipeline)
- [Progressive Web App (PWA) Architecture](#-progressive-web-app-pwa-architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Production Deployment](#-production-deployment)
- [Tech Stack](#-tech-stack)
- [Data Sources & Acknowledgements](#-data-sources--acknowledgements)
- [License](#-license)

---

## 🌍 Overview

**Incursio** bridges atmospheric science and high-performance web graphics. By transforming dense isobaric meteorological datasets (from NOAA's supercomputers) into mathematical continuous vector fields, Incursio simulates the movement of air parcels, temperature gradients, and pressure differentials across arbitrary cartographic projections directly inside modern web browsers.

In addition to the interactive 3D global particle globe, Incursio features an integrated weather intelligence suite:
- **Atmospheric Visualizer**: 3D orthographic globe and multi-projection vector particle engine.
- **Threat Intelligence**: Early warning detection for severe atmospheric anomalies, storm systems, and hazardous wind shear.
- **Micro-Forecast Dashboard**: Hourly and 5-day predictive meteorological metrics.
- **PWA Ready**: Offline caching, responsive touch interaction, and instant mobile installation.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **Real-Time Particle Advection** | Simulates tens of thousands of wind vector particles at 60 FPS with adaptive life cycles and velocity trails. |
| **Scalar Atmospheric Overlays** | High-fidelity heatmaps for Wind Velocity, Surface Temperature ($T$), Relative Humidity ($RH$), Mean Sea-Level Pressure ($MSLP$), and Wind Power Density ($WPD$). |
| **8+ Map Projections** | Real-time on-the-fly mathematical re-projection: Orthographic, Equirectangular, Mercator, Stereographic, Conic Conformal, Waterman Butterfly, and more. |
| **Temporal Scrubbing & IST Support** | Step forward and backward through forecast intervals ($-1\text{d}, -3\text{h}, \text{Now}, +3\text{h}, +1\text{d}$) with automatic local timezone / India Standard Time (IST) conversion. |
| **Dual-Canvas Spherical Masking** | Off-screen bounding-sphere rasterization resolving pixel-level limb occlusion on non-planar surfaces without heavy WebGL depth-buffer overhead. |
| **PWA Mobile-First Architecture** | Standalone web app capability with Service Worker caching (`v11`), custom manifest, and responsive collapsible HUD controls. |

---

## 🏗 Technical Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │  NOAA NCEP Global Forecast System (GFS)       │
                    │  Supercomputer Forecast Models (GRIB2)        │
                    └───────────────────────┬───────────────────────┘
                                            │ Filter & Extract (isobar / level)
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │  grib2json Conversion Pipeline                │
                    │  Transforms binary GRIB2 -> JSON grid arrays   │
                    └───────────────────────┬───────────────────────┘
                                            │ Static Asset Storage
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │  Incursio HTTP Engine (Node.js + Zlib Gzip)   │
                    │  Auto-serving public/ with low-latency caches  │
                    └───────────────────────┬───────────────────────┘
                                            │ HTTP / SW Cache v11
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT-SIDE ENGINE (BROWSER)                           │
│                                                                                        │
│   ┌────────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐  │
│   │  D3 Cartographic   │ ──> │ Bilinear Vector Grid │ ──> │ Finite-Difference      │  │
│   │  Projection Engine │     │ Interpolator         │     │ Distortion Corrections │  │
│   └────────────────────┘     └──────────────────────┘     └───────────┬────────────┘  │
│                                                                       │               │
│                                                                       ▼               │
│   ┌────────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐  │
│   │ Detached Canvas    │ ──> │ Dual-Layer Canvas    │ ──> │ Real-Time Particle     │  │
│   │ Spherical Masking  │     │ Color Map Overlay    │     │ Advection Simulator    │  │
│   └────────────────────┘     └──────────────────────┘     └────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rendering Pipeline:
1. **SVG & Basemap Layer**: Vector coastline and lake boundaries rendered via TopoJSON geometries using D3.js geographic path generators.
2. **Offscreen Spherical Mask**: The globe's horizon circle is rendered to a detached canvas buffer to compute an alpha mask identifying interior vs. exterior projected coordinates.
3. **Scalar Heatmap Canvas**: Interpolated scalar values ($T, RH, WPD$) are mapped to an HSL color spectrum and drawn to an intermediate canvas.
4. **Vector Particle Canvas**: Particle advection loop computes $(u, v)$ velocity vectors, applies project distortion tensors, advances particle positions by $(\Delta x, \Delta y)$, and renders decaying alpha trails.

---

## 🧮 Mathematical & Interpolation Engine

### 1. Bilinear Grid Interpolation
The raw GFS data provides wind vector components $(u, v)$ on a discrete $1.0^\circ \times 1.0^\circ$ latitude/longitude grid. For any continuous screen coordinate mapped back to spherical coordinates $(\lambda, \phi)$, four surrounding grid knots $(x_0, y_0), (x_1, y_0), (x_0, y_1), (x_1, y_1)$ are sampled:

$$f(x, y) \approx \frac{(x_1 - x)(y_1 - y)}{(x_1 - x_0)(y_1 - y_0)} f(Q_{11}) + \frac{(x - x_0)(y_1 - y)}{(x_1 - x_0)(y_1 - y_0)} f(Q_{21}) + \frac{(x_1 - x)(y - y_0)}{(x_1 - x_0)(y_1 - y_0)} f(Q_{12}) + \frac{(x - x_0)(y - y_0)}{(x_1 - x_0)(y_1 - y_0)} f(Q_{22})$$

This produces seamless velocity and pressure fields free of discrete stepped artifacts.

### 2. Distortion Tensor & Vector Field Mapping
Cartographic projections warp geometric space non-linearly. A vector $[u, v]$ defined on the sphere $(\lambda, \phi)$ cannot be rendered directly as screen velocity $[\Delta x, \Delta y]$. 

Incursio estimates the local transformation using **finite difference approximations**:
For a screen pixel $(x, y)$, nearby points $(x + \epsilon, y)$ and $(x, y + \epsilon)$ are unprojected back to spherical coordinates. The resulting Jacobian matrix is inverted to determine the local distortion tensor, ensuring wind particles curve accurately along lines of latitude and converge naturally at the poles.

### 3. Dual-Canvas Spherical Clipping
Instead of calculating complex spherical ray-intersections per particle:
1. An off-screen canvas renders the projected outline of the sphere.
2. Direct 32-bit pixel array access (`getImageData`) constructs an in-memory byte mask.
3. Particles crossing the mask boundary are culled and re-seeded uniformly over the visible hemisphere.

---

## 🗺 Cartographic Projections

Incursio supports dynamic switching across diverse mathematical projections:

- **Orthographic (`o`)**: Realistic 3D perspective globe with rotational drag and zoom.
- **Equirectangular (`e`)**: Standard cylindrical equidistant projection spanning $[-180^\circ, 180^\circ]$.
- **Mercator (`m`)**: Conformal cylindrical projection preserving local angles and trajectories.
- **Conic Conformal (`c`)**: Ideal for mid-latitude regional atmospheric analysis.
- **Stereographic (`s`)**: Conformal azimuthal projection highlighting polar vortex circulation.
- **Waterman Butterfly (`wb`)**: Polyhedral projection minimizing area, angular, and distance distortions globally.
- **Atlantis (`a`) & Winkel Tripel (`w`)**: Compromise projections balancing global distortion.

---

## 📡 Meteorological Data Pipeline

Atmospheric data is sourced from NOAA's **Global Forecast System (GFS)** running on high-performance weather clusters.

### Ingestion Flow:
1. **Acquisition**: Download binary GRIB2 forecast bulletins from NOAA NOMADS.
2. **Filtering**: Extract isobaric levels (Surface, 1000 hPa, 850 hPa, 500 hPa, 250 hPa jet stream) and variables (`UGRD`, `VGRD`, `TMP`, `RH`, `PRES`).
3. **JSON Serialization**: Use `grib2json` to decode binary floating-point records into compact JSON arrays.
4. **Static Compression**: Served with HTTP `gzip` compression via Node.js for sub-second page loads.

#### Example Data Query:
```bash
# Download 10m surface wind field for a specific date
curl "http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs.pl?file=gfs.t00z.pgrb2.1p00.f000&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.2026092700" \
     -o gfs.t00z.pgrb2.1p00.f000

# Convert to JSON for Incursio
grib2json -d -n -o current-wind-surface-level-gfs-1.0.json gfs.t00z.pgrb2.1p00.f000
```

---

## 📱 Progressive Web App (PWA) Architecture

Incursio is engineered as a modern, installable **Progressive Web App**:
- **Service Worker (`service-worker.js`)**: Implements a hybrid caching model:
  - **Network-First for HTML**: Guarantees users always receive the latest dashboard and visualizer versions.
  - **Cache-First for Static Assets**: Instant loads for scripts (`libs/earth/*.js`), stylesheets, and map geometries.
  - **Automated Cache Invalidation**: Automatic garbage collection of superseded cache versions on release.
- **Responsive Mobile HUD**:
  - Touch-optimized gesture controls (pan, pinch, tilt).
  - Compact collapsible timeline controller with vertical step buttons.
  - Automatic time translation to local user timezone (including India Standard Time).

---

## 📂 Project Directory Structure

```text
Incursio/
├── dev-server.js           # High-performance Node.js HTTP server (Gzip + CORS)
├── package.json            # Project manifest and scripts
├── Gruntfile.js            # Build automation & linting tasks
├── LICENSE.md              # Project licensing
├── README.md               # Technical project documentation
└── public/                 # Static web application root
    ├── index.html          # Main 3D Global Weather Visualization Engine
    ├── home.html           # Threat Intelligence & Weather Dashboard
    ├── forecast.html       # 5-Day & Hourly predictive metrics
    ├── alerts.html         # Extreme weather & anomaly warning hub
    ├── about.html          # Project background & documentation
    ├── profile.html        # User preferences & telemetry units
    ├── manifest.json       # Web App Manifest for PWA installation
    ├── service-worker.js   # Service Worker cache controller (v11)
    ├── app.css             # Glassmorphic UI design system
    ├── styles/             # Visualizer-specific styling and icon fonts
    ├── libs/               # Client-side core libraries
    │   ├── d3/             # Cartographic and data-visualization libraries
    │   └── earth/1.0.0/    # Core Incursio modules (globes, particles, grid)
    └── data/               # Vector basemaps (TopoJSON) and GFS data layers
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version 14.x or higher recommended)
- `npm` (bundled with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/ak4204/Incursio.git
cd Incursio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm start
# Alternatively, specify custom ports:
node dev-server.js 8080
```

### 4. Access the Application
Open your browser and navigate to:
```text
http://localhost:8080
```
- Root `/` automatically routes to the **Threat Intelligence Dashboard** (`home.html`).
- Navigate to the **Global Visualizer** via the in-app navigation or directly at `http://localhost:8080/index.html`.

---

## 🚢 Production Deployment

Incursio is container-ready and static-host compatible.

### Deploying to Render
1. Connect your GitHub repository `ak4204/Incursio`.
2. Set Environment to **Node**.
3. **Build Command**: `npm install`
4. **Start Command**: `node dev-server.js`
5. The server dynamically honors the `PORT` environment variable provided by Render.

---

## 🛠 Tech Stack

- **Rendering Engine**: HTML5 Canvas (Dual-Layer), SVG, WebGL
- **Data Visualization & Math**: D3.js (`d3.geo`, `d3.interpolate`), TopoJSON
- **State Management & Events**: Backbone.js Models & Event Bus, When.js Promises
- **PWA & Offline**: Service Worker API, Cache Storage API, Web App Manifest
- **Backend & Network**: Node.js `http`, native `zlib` compression streaming
- **Styling**: Vanilla CSS3, CSS Grid/Flexbox, Custom Glassmorphism

---

## 🌐 Data Sources & Acknowledgements

- **Atmospheric Data**: NOAA National Center for Environmental Prediction (NCEP) / National Weather Service (NWS) — [Global Forecast System (GFS)](https://www.emc.ncep.noaa.gov).
- **Geographic Vector Data**: [Natural Earth](https://www.naturalearthdata.com) public domain map dataset converted via TopoJSON.
- **Ocean Current Data**: OSCAR (Ocean Surface Current Analysis Real-time) via Earth & Space Research (ESR).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).

Designed and maintained by [ak4204](https://github.com/ak4204). Live at [incursio.onrender.com](https://incursio.onrender.com).
