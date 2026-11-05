import type { ResearchEntry, ResearchLocation } from '../types/research';

const EXPORT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
// Keep each export close to the location whose Export button was clicked.
export type ExportMapView = '2d' | '3d';
const exportMapCamera = (view: ExportMapView) => ({
  zoom: 18,
  pitch: view === '3d' ? 70 : 0,
  bearing: view === '3d' ? 40 : 0,
});

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

function buildResearchersLabel(research: ResearchEntry) {
  return research.researchers.map((researcher) => researcher.name).join(', ');
}

function buildLocationsLabel(locations: ResearchLocation[]) {
  return locations.map((location) => location.name).join(', ');
}

function buildExportHtml(
  research: ResearchEntry,
  relatedLocations: ResearchLocation[],
  currentLocation: ResearchLocation,
  accessToken: string,
  view: ExportMapView
) {
  const camera = exportMapCamera(view);
  const printTitle = `${research.title} Research Map`;
  const title = escapeHtml(research.title);
  const locationLabel = escapeHtml(buildLocationsLabel(relatedLocations));
  const researchersLabel = escapeHtml(buildResearchersLabel(research));
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
        font-family: "Bookman Old Style", "Bookman", serif;
        color: #111;
        background: #fff;
      }
      .sheet {
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        padding: 1in 1in 1in 1.5in;
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
        height: 4.75in;
        break-inside: avoid;
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
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1.4fr);
        break-inside: avoid;
      }
      .footer-cell {
        min-height: 120px;
        min-width: 0;
        padding: 8px;
        overflow-wrap: anywhere;
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
        width: 20px;
        flex-shrink: 0;
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
      .legend-line-building {
        background: #c9a876;
      }
      .legend-line-park {
        background: #a6d96a;
      }
      @page {
        size: letter portrait;
        margin: 1in 1in 1in 1.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .sheet {
          width: 6in;
          min-height: 0;
          margin: 0;
          padding: 0;
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
        </div>
        <div class="footer-cell">
          <h2 class="footer-title">Legend</h2>
          <ul class="legend-list">
            <li class="legend-item"><span class="pin-dot"></span><span>Research location</span></li>
            <li class="legend-item"><span class="legend-line legend-line-building"></span><span>Building</span></li>
            <li class="legend-item"><span class="legend-line legend-line-road"></span><span>Road</span></li>
            <li class="legend-item"><span class="legend-line legend-line-water"></span><span>Water</span></li>
            <li class="legend-item"><span class="legend-line legend-line-park"></span><span>Open Space</span></li>
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
               var markers = [];
               var errorNode = document.getElementById('export-map-error');

               function triggerPrint() {
                 if (printed) return;
                 // Freeze the map and markers in one image before print layout changes.
                 if (mapLoaded) {
                   var source = map.getCanvas();
                   var snapshot = document.createElement('canvas');
                   snapshot.width = source.width;
                   snapshot.height = source.height;
                   var context = snapshot.getContext('2d');
                   var bounds = map.getContainer().getBoundingClientRect();
                   context.drawImage(source, 0, 0);
                   context.scale(source.width / bounds.width, source.height / bounds.height);
                   markers.forEach(function (entry) {
                     var rect = entry.element.getBoundingClientRect();
                     var x = rect.left - bounds.left + rect.width / 2;
                     var y = rect.top - bounds.top + rect.height / 2;
                     context.beginPath();
                     context.arc(x, y, 12, 0, Math.PI * 2);
                     context.fillStyle = '#8b0000';
                     context.fill();
                     context.strokeStyle = '#fff';
                     context.lineWidth = 4;
                     context.stroke();
                     context.font = 'bold 12px Georgia';
                     context.lineWidth = 4;
                     context.strokeText(entry.name, x + 20, y + 4);
                     context.fillText(entry.name, x + 20, y + 4);
                   });
                   var image = document.createElement('img');
                   image.src = snapshot.toDataURL('image/png');
                   image.style.cssText = 'display:block;width:100%;height:100%;';
                   map.getContainer().replaceWith(image);
                   map.remove();
                 }
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

                 // Keep these visible
                 if (
                   combined.includes('road-label') ||
                   combined.includes('street') ||
                   combined.includes('water') ||
                   combined.includes('waterway') ||
                   combined.includes('place-label') ||
                   combined.includes('settlement')
                 ) {
                   return false;
                 }

                 // Hide POIs and other labels
                 return (
                   combined.includes('poi') ||
                   combined.includes('airport') ||
                   combined.includes('school') ||
                   combined.includes('hospital') ||
                   combined.includes('mall') ||
                   combined.includes('store') ||
                   combined.includes('shop') ||
                   combined.includes('restaurant') ||
                   combined.includes('cafe') ||
                   combined.includes('bank') ||
                   combined.includes('transit') ||
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

                 // Apply legend colors
                 if (combined.includes('water') || combined.includes('waterway')) {
                   if (type === 'fill') {
                     setPaintIfPossible(layer.id, 'fill-color', '#79b7e3');
                   }
                   if (type === 'line') {
                     setPaintIfPossible(layer.id, 'line-color', '#79b7e3');
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
                   return;
                 }

                 if (combined.includes('admin') || combined.includes('boundary')) {
                   if (type === 'line') {
                     setPaintIfPossible(layer.id, 'line-color', '#2f3338');
                   }
                   return;
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
                   center: [${currentLocation.longitude}, ${currentLocation.latitude}],
                   zoom: ${camera.zoom},
                   pitch: ${camera.pitch},
                   bearing: ${camera.bearing},
                   interactive: false,
                   attributionControl: false,
                   preserveDrawingBuffer: true
                 });

                 map.on('load', function () {
                   mapLoaded = true;
                   
                   // Add 3D terrain
                   try {
                     map.addSource('mapbox-dem', {
                       type: 'raster-dem',
                       url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                       tileSize: 512,
                     });
                     map.setTerrain({
                       source: 'mapbox-dem',
                       exaggeration: 1.5,
                     });

                     map.addLayer({
                       id: 'sky',
                       type: 'sky',
                       paint: {
                         'sky-type': 'atmosphere',
                         'sky-atmosphere-sun-intensity': 0.3,
                       },
                     });
                   } catch (error) {
                     // Terrain or sky may not be supported
                   }

                   // Add 3D buildings
                   try {
                     var allLayers = map.getStyle().layers || [];
                     var labelLayerId = undefined;
                     
                     for (var i = allLayers.length - 1; i >= 0; i--) {
                       if (allLayers[i].type === 'symbol') {
                         labelLayerId = allLayers[i].id;
                         break;
                       }
                     }

                     map.addLayer({
                       id: '3d-buildings',
                       source: 'composite',
                       'source-layer': 'building',
                       filter: ['==', 'extrude', 'true'],
                       type: 'fill-extrusion',
                       minzoom: 0,
                       paint: {
                         'fill-extrusion-color': [
                           'interpolate',
                           ['linear'],
                           ['get', 'height'],
                           0, '#d4af85',
                           100, '#c9a876',
                           200, '#b89968'
                         ],
                         'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 0, 0, 15, ['*', ['get', 'height'], 1.3]],
                         'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 0, 0, 15, ['get', 'min_height']],
                         'fill-extrusion-opacity': 1,
                         'fill-extrusion-vertical-gradient': true,
                       },
                     }, labelLayerId);
                   } catch (error) {
                     // Building layer may not be supported
                   }
                   
                   // Hide unwanted POI labels and apply legend colors
                   var layers = map.getStyle().layers || [];
                   layers.forEach(function (layer) {
                     if (shouldHideLayer(layer)) {
                       try {
                         map.setLayoutProperty(layer.id, 'visibility', 'none');
                       } catch (error) {
                         // Ignore layers that cannot be modified
                       }
                     }
                     restyleLayer(layer);
                   });
                   
                   // Add location markers
                   locations.forEach(function (location) {
                     var markerWrapper = document.createElement('div');
                     markerWrapper.style.display = 'flex';
                     markerWrapper.style.alignItems = 'center';
                     markerWrapper.style.gap = '8px';
                     markerWrapper.style.zIndex = '9999';
                     markerWrapper.style.position = 'relative';
                     markerWrapper.style.width = '24px';
                     markerWrapper.style.height = '24px';

                     var markerNode = document.createElement('div');
                     markerNode.style.width = '24px';
                     markerNode.style.height = '24px';
                     markerNode.style.borderRadius = '999px';
                     markerNode.style.background = '#8b0000';
                     markerNode.style.border = '4px solid #ffffff';
                     markerNode.style.boxShadow = '0 0 0 6px rgba(139, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.3)';
                     markerNode.style.flexShrink = '0';

                     var labelNode = document.createElement('div');
                     labelNode.textContent = location.name;
                     labelNode.style.position = 'absolute';
                     labelNode.style.left = '32px';
                     labelNode.style.top = '50%';
                     labelNode.style.transform = 'translateY(-50%)';
                     labelNode.style.padding = '6px 12px';
                     labelNode.style.background = 'rgba(139, 0, 0, 0.95)';
                     labelNode.style.border = '2px solid #ffffff';
                     labelNode.style.borderRadius = '4px';
                     labelNode.style.color = '#ffffff';
                     labelNode.style.fontFamily = '"Bookman Old Style", "Bookman", serif';
                     labelNode.style.fontSize = '12px';
                     labelNode.style.fontWeight = '700';
                     labelNode.style.lineHeight = '1.2';
                     labelNode.style.whiteSpace = 'nowrap';
                     labelNode.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';

                     markerWrapper.appendChild(markerNode);
                     markerWrapper.appendChild(labelNode);
                     markers.push({ element: markerWrapper, name: location.name });

                     new mapboxgl.Marker({ element: markerWrapper, anchor: 'center' })
                       .setLngLat([location.longitude, location.latitude])
                       .addTo(map);
                   });

                   map.resize();
                   map.jumpTo({ center: [${currentLocation.longitude}, ${currentLocation.latitude}] });
                   map.once('idle', triggerPrint);
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

export async function exportResearchMapJpg(
  research: ResearchEntry,
  currentLocation: ResearchLocation,
  locations: ResearchLocation[],
  accessToken: string,
  view: ExportMapView = '2d'
) {
  if (!accessToken) throw new Error('A Mapbox token is required to export the map.');
  const { default: mapboxgl } = await import('mapbox-gl');
  const related = getRelatedLocations(research, currentLocation, locations);
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-10000px;top:0;width:2560px;height:1440px;pointer-events:none;';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);
  let map: InstanceType<typeof mapboxgl.Map> | undefined;
  try {
    map = new mapboxgl.Map({
      container,
      accessToken,
      style: EXPORT_MAP_STYLE,
      center: [currentLocation.longitude, currentLocation.latitude],
      ...exportMapCamera(view),
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });
    const exportMap = map;
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => finish(new Error('Map export timed out. Please try again.')), 45000);
      const onIdle = () => finish();
      const onError = () => finish(new Error('Could not load the map. Check your connection and Mapbox token.'));
      const onLoad = () => {
        try {
          exportMap.addSource('export-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
          });
          exportMap.setTerrain({ source: 'export-dem', exaggeration: 1.5 });
          exportMap.addLayer({
            id: 'export-sky',
            type: 'sky',
            paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun-intensity': 0.3 },
          });
          const labelLayer = exportMap.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;
          exportMap.addLayer({
            id: 'export-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            paint: {
              'fill-extrusion-color': '#c9a876',
              'fill-extrusion-height': ['*', ['coalesce', ['get', 'height'], 0], 1.3],
              'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
              'fill-extrusion-opacity': 1,
            },
          }, labelLayer);
        } catch {
          finish(new Error('Could not render the 3D map. Please try exporting again.'));
        }
      };
      function finish(error?: Error) {
        window.clearTimeout(timeout);
        exportMap.off('idle', onIdle);
        exportMap.off('error', onError);
        exportMap.off('load', onLoad);
        if (error) reject(error);
        else resolve();
      }
      exportMap.once('idle', onIdle);
      exportMap.once('error', onError);
      exportMap.once('load', onLoad);
    });
    const canvas = document.createElement('canvas');
    canvas.width = 2560;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not create the JPG image.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(exportMap.getCanvas(), 0, 0, canvas.width, canvas.height);
    // project() returns CSS pixels, independently of the WebGL pixel ratio.
    const mapBounds = container.getBoundingClientRect();
    const scaleX = canvas.width / mapBounds.width;
    const scaleY = canvas.height / mapBounds.height;
    related.forEach((location) => {
      // Native markers account for terrain elevation in tilted views.
      const element = document.createElement('div');
      element.style.cssText = 'width:2px;height:2px;';
      const marker = new mapboxgl.Marker({ element, anchor: 'center' })
        .setLngLat([location.longitude, location.latitude]).addTo(exportMap);
      const markerBounds = element.getBoundingClientRect();
      const projected = {
        x: markerBounds.left - mapBounds.left + markerBounds.width / 2,
        y: markerBounds.top - mapBounds.top + markerBounds.height / 2,
      };
      marker.remove();
      const point = { x: projected.x * scaleX, y: projected.y * scaleY };
      context.beginPath();
      context.arc(point.x, point.y, 12, 0, Math.PI * 2);
      context.fillStyle = '#8b0000';
      context.fill();
      context.strokeStyle = '#fff';
      context.lineWidth = 4;
      context.stroke();
      context.font = 'bold 22px Arial';
      context.lineWidth = 5;
      context.strokeText(location.name, point.x + 22, point.y + 7);
      context.fillText(location.name, point.x + 22, point.y + 7);
    });
    const attribution = '© Mapbox © OpenStreetMap';
    context.font = '20px Arial';
    const width = context.measureText(attribution).width;
    context.fillStyle = 'rgba(255,255,255,0.9)';
    context.fillRect(canvas.width - width - 24, canvas.height - 36, width + 24, 36);
    context.fillStyle = '#333';
    context.fillText(attribution, canvas.width - width - 12, canvas.height - 12);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (value) => value ? resolve(value) : reject(new Error('Could not encode the JPG image.')),
      'image/jpeg', 0.95
    ));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(research.title)}-map-${view}-hd.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } finally {
    map?.remove();
    container.remove();
  }
}

export function exportResearchMap(
  research: ResearchEntry,
  currentLocation: ResearchLocation,
  locations: ResearchLocation[],
  accessToken: string,
  view: ExportMapView = '2d'
) {
  const relatedLocations = getRelatedLocations(research, currentLocation, locations);
  const exportHtml = buildExportHtml(research, relatedLocations, currentLocation, accessToken, view);
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
        exportWindow.document.title = `${sanitizeFilename(research.title)}-${view}.pdf`;
      } catch {
        // Ignore cross-document timing issues while the new window initializes.
      }
    },
    { once: true }
  );
  window.setTimeout(cleanup, 60000);
}
