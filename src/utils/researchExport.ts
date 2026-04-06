import type { ResearchEntry, ResearchLocation } from '../types/research';

const MAP_IMAGE_SIZE = { width: 900, height: 900 };
const EXPORT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'research-map';
}

function getRelatedLocations(
  research: ResearchEntry,
  currentLocation: ResearchLocation,
  locations: ResearchLocation[]
) {
  if (!research.locationIds?.length) {
    return [currentLocation];
  }

  const related = locations.filter((location) => research.locationIds?.includes(location.id));
  return related.length > 0 ? related : [currentLocation];
}

function getMapCenter(locations: ResearchLocation[]) {
  const total = locations.reduce(
    (accumulator, location) => ({
      latitude: accumulator.latitude + location.latitude,
      longitude: accumulator.longitude + location.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: total.latitude / locations.length,
    longitude: total.longitude / locations.length,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getExpandedSpan(span: number, minimumSpan: number) {
  if (span <= 0) {
    return minimumSpan;
  }

  return Math.max(span * 1.8, minimumSpan);
}

function getMapZoom(locations: ResearchLocation[]) {
  const latitudes = locations.map((location) => location.latitude);
  const longitudes = locations.map((location) => location.longitude);
  const latSpan = getExpandedSpan(Math.max(...latitudes) - Math.min(...latitudes), 0.02);
  const lngSpan = getExpandedSpan(Math.max(...longitudes) - Math.min(...longitudes), 0.02);

  const lngZoom = Math.log2((360 * MAP_IMAGE_SIZE.width) / (lngSpan * 256));
  const latZoom = Math.log2((170 * MAP_IMAGE_SIZE.height) / (latSpan * 256));

  return clamp(Math.min(lngZoom, latZoom), 8.5, 14);
}

function buildResearchersLabel(research: ResearchEntry) {
  return research.researchers.map((researcher) => researcher.name).join(', ');
}

function buildLocationsLabel(locations: ResearchLocation[]) {
  return locations.map((location) => location.name).join(', ');
}

function buildExportHtml(
  research: ResearchEntry,
  relatedLocations: ResearchLocation[],
  accessToken: string
) {
  const printTitle = `${research.title} Research Map`;
  const title = escapeHtml(research.title);
  const description = escapeHtml(research.description);
  const locationLabel = escapeHtml(buildLocationsLabel(relatedLocations));
  const researchersLabel = escapeHtml(buildResearchersLabel(research));
  const center = getMapCenter(relatedLocations);
  const zoom = getMapZoom(relatedLocations);
  const mapLocationsJson = JSON.stringify(
    relatedLocations.map((location) => ({
      id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    }))
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(printTitle)}</title>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Times New Roman", serif;
        color: #111;
        background: #fff;
      }
      .sheet {
        width: 1000px;
        margin: 0 auto;
        padding: 24px 24px 18px;
      }
      .map-title {
        font-size: 20px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin: 0 0 12px 0;
        font-weight: bold;
        color: #111;
        text-align: center;
      }
      .map-frame {
        border: 2px solid #222;
        height: 820px;
        overflow: hidden;
        background: #fafafa;
        position: relative;
      }
      #export-map {
        width: 100%;
        height: 100%;
      }
      .map-placeholder {
        position: absolute;
        inset: 0;
        padding: 32px;
        text-align: center;
        font-size: 18px;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.92);
      }
      .footer {
        margin-top: 18px;
        border: 2px solid #222;
        display: grid;
        grid-template-columns: 1.25fr 1.35fr 1fr 1.4fr;
      }
      .footer-cell {
        min-height: 120px;
        padding: 14px 16px;
        border-right: 2px solid #222;
      }
      .footer-cell:last-child {
        border-right: none;
      }
      .footer-title {
        margin: 0 0 10px;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .footer-text {
        margin: 0;
        font-size: 14px;
        line-height: 1.3;
      }
      .location-pin {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        line-height: 1.3;
      }
      .pin-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #8b0000;
        box-shadow: 0 0 0 4px rgba(139, 0, 0, 0.18);
        flex-shrink: 0;
      }
      .legend-list {
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 13px;
        line-height: 1.45;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .legend-line {
        width: 28px;
        height: 4px;
        border-radius: 999px;
      }
      .legend-line-road {
        background: #8b929a;
      }
      .legend-line-water {
        background: #79b7e3;
      }
      .legend-line-boundary {
        background: #2f3338;
      }
      .description {
        margin-top: 10px;
        font-size: 12px;
        color: #444;
        line-height: 1.35;
      }
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .sheet {
          width: auto;
          margin: 0;
          padding: 0;
        }
        .map-frame {
          height: 730px;
        }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h2 class="map-title">Research Locale</h2>
      <section class="map-frame">
        ${
          accessToken
            ? `<div id="export-map" aria-label="Map of research locations for ${title}"></div>
               <div id="export-map-error" class="map-placeholder">The map preview could not be loaded, but the research export details are still ready to print.</div>`
            : `<div class="map-placeholder" style="display:flex;">Map export needs a valid Mapbox token to generate the centered map image.</div>`
        }
      </section>

      <section class="footer">
        <div class="footer-cell">
          <h2 class="footer-title">Location Pin</h2>
          <p class="location-pin"><span class="pin-dot"></span><span>${locationLabel}</span></p>
        </div>
        <div class="footer-cell">
          <h2 class="footer-title">Title of Research</h2>
          <p class="footer-text">${title}</p>
          <p class="description">${description}</p>
        </div>
        <div class="footer-cell">
          <h2 class="footer-title">Legend</h2>
          <ul class="legend-list">
            <li class="legend-item"><span class="pin-dot"></span><span>Research location</span></li>
            <li class="legend-item"><span class="legend-line legend-line-road"></span><span>Road</span></li>
            <li class="legend-item"><span class="legend-line legend-line-water"></span><span>Water</span></li>
            <li class="legend-item"><span class="legend-line legend-line-boundary"></span><span>Boundary</span></li>
          </ul>
        </div>
        <div class="footer-cell">
          <h2 class="footer-title">Researchers Name</h2>
          <p class="footer-text">${researchersLabel}</p>
        </div>
      </section>
    </div>
    ${
      accessToken
        ? `<script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
           <script>
             (function () {
               var printed = false;
               var mapLoaded = false;
               var locations = ${mapLocationsJson};
               var errorNode = document.getElementById('export-map-error');

               function triggerPrint() {
                 if (printed) return;
                 printed = true;
                 window.focus();
                 window.print();
               }

               function showError() {
                 if (errorNode) {
                   errorNode.style.display = 'flex';
                 }
               }

               function shouldHideLayer(layer) {
                 var id = (layer && layer.id ? layer.id : '').toLowerCase();
                 var sourceLayer = (layer && layer['source-layer'] ? layer['source-layer'] : '').toLowerCase();
                 var combined = id + ' ' + sourceLayer;

                 if (
                   combined.includes('road-label') ||
                   combined.includes('place-label') ||
                   combined.includes('settlement') ||
                   combined.includes('natural-label') ||
                   combined.includes('water') ||
                   combined.includes('waterway') ||
                   combined.includes('admin')
                 ) {
                   return false;
                 }

                 return (
                   combined.includes('poi') ||
                   combined.includes('transit') ||
                   combined.includes('airport') ||
                   combined.includes('school') ||
                   combined.includes('hospital') ||
                   combined.includes('building-number') ||
                   combined.includes('park-label')
                 );
               }

               function setPaintIfPossible(layerId, property, value) {
                 try {
                   map.setPaintProperty(layerId, property, value);
                 } catch (error) {
                   // Ignore paint properties not supported by a given layer.
                 }
               }

               function restyleLayer(layer) {
                 var id = (layer && layer.id ? layer.id : '').toLowerCase();
                 var sourceLayer = (layer && layer['source-layer'] ? layer['source-layer'] : '').toLowerCase();
                 var combined = id + ' ' + sourceLayer;
                 var type = layer && layer.type ? layer.type : '';

                 if (combined.includes('background')) {
                   setPaintIfPossible(layer.id, 'background-color', '#f7f7f4');
                   return;
                 }

                 if (combined.includes('landuse') || combined.includes('park') || combined.includes('green')) {
                   if (type === 'fill') {
                     setPaintIfPossible(layer.id, 'fill-color', '#f7f7f4');
                     setPaintIfPossible(layer.id, 'fill-opacity', 1);
                   }
                   return;
                 }

                 if (combined.includes('water') || combined.includes('waterway')) {
                   if (type === 'fill') {
                     setPaintIfPossible(layer.id, 'fill-color', '#79b7e3');
                   }
                   if (type === 'line') {
                     setPaintIfPossible(layer.id, 'line-color', '#79b7e3');
                   }
                   return;
                 }

                 if (combined.includes('admin') || combined.includes('boundary')) {
                   if (type === 'line') {
                     setPaintIfPossible(layer.id, 'line-color', '#2f3338');
                   }
                   return;
                 }

                 if (combined.includes('road')) {
                   if (type === 'line') {
                     setPaintIfPossible(layer.id, 'line-color', '#8b929a');
                   }
                   if (type === 'fill') {
                     setPaintIfPossible(layer.id, 'fill-color', '#8b929a');
                   }
                 }
               }

               if (!window.mapboxgl) {
                 showError();
                 window.setTimeout(triggerPrint, 300);
                 return;
               }

               try {
                 mapboxgl.accessToken = ${JSON.stringify(accessToken)};
                 var map = new mapboxgl.Map({
                   container: 'export-map',
                   style: ${JSON.stringify(EXPORT_MAP_STYLE)},
                   center: [${center.longitude}, ${center.latitude}],
                   zoom: ${zoom},
                   interactive: false,
                   attributionControl: false,
                   preserveDrawingBuffer: true
                 });

                 map.on('load', function () {
                   mapLoaded = true;
                   var layers = map.getStyle().layers || [];
                   layers.forEach(function (layer) {
                     if (shouldHideLayer(layer)) {
                       try {
                         map.setLayoutProperty(layer.id, 'visibility', 'none');
                       } catch (error) {
                         // Ignore layers that cannot be hidden.
                       }
                     }
                     restyleLayer(layer);
                   });

                   locations.forEach(function (location) {
                     var markerWrapper = document.createElement('div');
                     markerWrapper.style.display = 'flex';
                     markerWrapper.style.alignItems = 'center';
                     markerWrapper.style.gap = '8px';

                     var markerNode = document.createElement('div');
                     markerNode.style.width = '18px';
                     markerNode.style.height = '18px';
                     markerNode.style.borderRadius = '999px';
                     markerNode.style.background = '#8b0000';
                     markerNode.style.border = '3px solid #ffffff';
                     markerNode.style.boxShadow = '0 0 0 4px rgba(139, 0, 0, 0.18)';

                     var labelNode = document.createElement('div');
                     labelNode.textContent = location.name;
                     labelNode.style.padding = '4px 8px';
                     labelNode.style.background = 'rgba(255, 255, 255, 0.92)';
                     labelNode.style.border = '1px solid rgba(47, 51, 56, 0.25)';
                     labelNode.style.borderRadius = '999px';
                     labelNode.style.color = '#1f2328';
                     labelNode.style.fontFamily = '"Times New Roman", serif';
                     labelNode.style.fontSize = '14px';
                     labelNode.style.fontWeight = '700';
                     labelNode.style.lineHeight = '1';
                     labelNode.style.whiteSpace = 'nowrap';
                     labelNode.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.12)';

                     markerWrapper.appendChild(markerNode);
                     markerWrapper.appendChild(labelNode);

                     new mapboxgl.Marker({ element: markerWrapper, anchor: 'left' })
                       .setLngLat([location.longitude, location.latitude])
                       .addTo(map);
                   });

                   window.setTimeout(triggerPrint, 1400);
                 });

                 map.on('error', function () {
                   showError();
                   window.setTimeout(triggerPrint, 300);
                 });

                 window.setTimeout(function () {
                   if (!mapLoaded) {
                     showError();
                     triggerPrint();
                   }
                 }, 5000);
               } catch (error) {
                 showError();
                 window.setTimeout(triggerPrint, 300);
               }
             })();
           </script>`
        : ''
    }
    <script>
      (function () {
        if (!document.getElementById('export-map')) {
          window.setTimeout(function () {
            window.focus();
            window.print();
          }, 250);
        }
      })();
    </script>
  </body>
</html>`;
}

export function exportResearchMap(
  research: ResearchEntry,
  currentLocation: ResearchLocation,
  locations: ResearchLocation[],
  accessToken: string
) {
  const relatedLocations = getRelatedLocations(research, currentLocation, locations);
  const exportHtml = buildExportHtml(research, relatedLocations, accessToken);
  const exportBlob = new Blob([exportHtml], { type: 'text/html' });
  const exportUrl = URL.createObjectURL(exportBlob);
  const exportWindow = window.open(exportUrl, '_blank');

  if (!exportWindow) {
    URL.revokeObjectURL(exportUrl);
    throw new Error('Please allow pop-ups so the export preview can open.');
  }

  const cleanup = () => URL.revokeObjectURL(exportUrl);
  exportWindow.addEventListener(
    'load',
    () => {
      try {
        exportWindow.document.title = `${sanitizeFilename(research.title)}.pdf`;
      } catch {
        // Ignore cross-document timing issues while the new window initializes.
      }
    },
    { once: true }
  );
  window.setTimeout(cleanup, 60000);
}
