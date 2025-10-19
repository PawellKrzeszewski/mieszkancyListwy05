// === konfiguracja mapy ===
const map = L.map('map').setView([52.546, 19.700], 12);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// === popupy i style tras ===
function onEachTrasa(feature, layer) {
  let popup = '';
  if (feature?.properties) {
    if (feature.properties.name) popup += '<b>' + feature.properties.name + '</b><br/>';
    for (let k in feature.properties)
      popup += '<i>' + k + ':</i> ' + feature.properties[k] + '<br/>';
  }
  if (popup) layer.bindPopup(popup);
}

function styleTrasa(feature) {
  const rand = Math.random();
  if (rand < 0.05) return { color: '#d73027', weight: 4 };
  if (rand < 0.15) return { color: '#fdae61', weight: 4 };
  const greens = ['#006837', '#1a9850', '#31a354', '#66bd63', '#a6d96a'];
  const color = greens[Math.floor(Math.random() * greens.length)];
  return { color, weight: 4 };
}

// === ikony ===
function createBikeIcon(size = 30) {
  return L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function createBenchIcon(size = 30) {
  return L.icon({
    iconUrl: '../imgs/bench.png',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function getBikeIconForZoom(zoom) {
  if (zoom < 10) return createBikeIcon(25);
  if (zoom < 12) return createBikeIcon(35);
  if (zoom < 14) return createBikeIcon(45);
  if (zoom < 16) return createBikeIcon(55);
  return createBikeIcon(65);
}

// === warstwy mapy ===
let trasyLayer = L.geoJSON(null, { style: styleTrasa, onEachFeature: onEachTrasa }).addTo(map);
let poisLayer = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.marker(latlng, { icon: createBenchIcon() }),
  onEachFeature: (f, l) => {
    let popup = '';
    if (f.properties?.name) popup += '<b>' + f.properties.name + '</b><br/>';
    if (f.properties?.opis) popup += f.properties.opis + '<br/>';
    l.bindPopup(popup || 'Miejsce odpoczynku');
  }
}).addTo(map);

let bikeIcon = getBikeIconForZoom(map.getZoom());
let stationsLayer = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.marker(latlng, { icon: bikeIcon }),
  onEachFeature: (f, l) => {
    let popup = '';
    if (f.properties?.name) popup += '<b>' + f.properties.name + '</b><br/>';
    if (f.properties?.adres) popup += f.properties.adres + '<br/>';
    l.bindPopup(popup || 'Stacja roweru miejskiego');
  }
}).addTo(map);

// === aktualizacja rozmiaru rowerków ===
map.on('zoomend', () => {
  const newIcon = getBikeIconForZoom(map.getZoom());
  stationsLayer.eachLayer(layer => {
    if (layer.setIcon) layer.setIcon(newIcon);
  });
});

// === filtrowanie tras ===
let allTrasy = null;

function applyFilters() {
  if (!allTrasy) return;
  const family = document.getElementById('filter-family')?.checked;
  const sport = document.getElementById('filter-sport')?.checked;

  const feats = allTrasy.features.filter(f => {
    const typ = (f.properties?.typ || '').toLowerCase();
    if (!family && !sport) return true;
    if (family && typ.includes('ruch uspokojony')) return true;
    if (sport && !typ.includes('ruch uspokojony') && !typ.includes('droga rowerowa')) return true;
    return false;
  });

  trasyLayer.clearLayers().addData({ type: 'FeatureCollection', features: feats });
}

// === ładowanie danych ===
fetch('trasy.geojson').then(r => r.ok ? r.json() : null).then(data => {
  if (data) { allTrasy = data; applyFilters(); }
});
fetch('pois.geojson').then(r => r.ok ? r.json() : null).then(data => {
  if (data) poisLayer.addData(data);
});
fetch('stations_wgs84.geojson').then(r => r.ok ? r.json() : null).then(data => {
  if (data) stationsLayer.addData(data);
});

// === eventy ===
['filter-family', 'filter-sport'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', applyFilters);
});
document.getElementById('show-pois')?.addEventListener('change', e => {
  if (e.target.checked) poisLayer.addTo(map);
  else map.removeLayer(poisLayer);
});
document.getElementById('show-stations')?.addEventListener('change', e => {
  if (e.target.checked) stationsLayer.addTo(map);
  else map.removeLayer(stationsLayer);
});

// === panel boczny ===
const btn = document.querySelector("#colapse");
const panel = document.querySelector("#panel");
const clear = document.querySelector("#clear");
const h2 = document.querySelector("#h2");

if (btn && panel) {
  let isOpen = true;
  btn.addEventListener("click", () => {
    if (isOpen) {
      panel.style.width = "3%";
      if (clear) clear.style.display = "none";
      if (h2) h2.style.display = "none";
      btn.innerHTML = "+";
    } else {
      panel.style.width = "28%";
      if (clear) clear.style.display = "block";
      if (h2) h2.style.display = "block";
      btn.innerHTML = "—";
    }
    isOpen = !isOpen;
  });
}

// === legenda ===
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.style.backgroundColor = "rgba(0,0,0,0.85)";
  div.style.padding = "15px";
  div.style.borderRadius = "10px";
  div.style.fontSize = "16px";
  div.style.color = "white";
  div.innerHTML = `
        <h4 id="legenda"style="text-align:center">Legenda <span id="clearer">—</span></h4>
    <div id="warper">
      <div><span style="background:#1a9850"></span> Trasa rodzinna</div>
      <div><span style="background:#2b83ba"></span> Droga rowerowa</div>
      <div><span style="background:#d73027"></span> Trasa sportowa</div>
      <div><img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"> Stacja roweru</div>
      <div><img src="../imgs/bench.png" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"> Ławka / odpoczynek</div>
    </div
  `;
  return div;
};
legend.addTo(map);

// === DOKŁADNE ŚLEDZENIE GPS ===
let gpsWatchId = null;
let gpsMarker = null;
let gpsPath = [];
let gpsPolyline = null;

function startTracking() {
  if (!navigator.geolocation) {
    alert("Twoja przeglądarka nie obsługuje geolokalizacji.");
    return;
  }

  document.getElementById('startTracking').disabled = true;
  document.getElementById('stopTracking').disabled = false;

  gpsWatchId = navigator.geolocation.watchPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      if (!gpsMarker) {
        gpsMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);
      } else {
        gpsMarker.setLatLng([lat, lng]);
      }

      gpsPath.push([lat, lng]);
      if (gpsPolyline) {
        gpsPolyline.setLatLngs(gpsPath);
      } else {
        gpsPolyline = L.polyline(gpsPath, { color: "#179696", weight: 5 }).addTo(map);
      }

      if (gpsPath.length === 1) map.setView([lat, lng], 16);
      console.log(`GPS: ${lat}, ${lng} (dokładność: ${accuracy} m)`);
    },
    err => {
      console.error("Błąd geolokalizacji:", err);
      alert("Nie udało się pobrać lokalizacji.");
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
}

function stopTracking() {
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
  document.getElementById('startTracking').disabled = false;
  document.getElementById('stopTracking').disabled = true;
  alert("Śledzenie zatrzymane.");
}

function centerMap() {
  if (gpsMarker) {
    map.setView(gpsMarker.getLatLng(), 16);
  } else {
    // Jeśli nie ma markera — pobierz lokalizację jednorazowo
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // Dodaj marker tymczasowy
        if (!gpsMarker) {
          gpsMarker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          }).addTo(map);
        } else {
          gpsMarker.setLatLng([lat, lng]);
        }

        map.setView([lat, lng], 16);
        console.log(`📍 Pozycja użytkownika: ${lat}, ${lng} (dokładność: ${accuracy} m)`);
      },
      err => {
        console.error("Błąd pobierania pozycji:", err);
        alert("Nie udało się ustalić lokalizacji użytkownika.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
}


// === przyciski ===
document.getElementById('startTracking')?.addEventListener('click', startTracking);
document.getElementById('stopTracking')?.addEventListener('click', stopTracking);
document.getElementById('centerMap')?.addEventListener('click', centerMap);

console.log("✅ Skrypt mapy wczytany poprawnie");

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../scripts/sw.js');
}
