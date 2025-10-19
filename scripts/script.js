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
  // losowanie koloru wg prawdopodobieństwa
  const rand = Math.random();

  // 5% szans – czerwony (duży ruch)
  if (rand < 0.05) {
    return { color: '#d73027', weight: 4 }; // czerwony
  }

  // 10% szans – pomarańczowy (umiarkowany ruch)
  if (rand < 0.15) {
    return { color: '#fdae61', weight: 4 }; // pomarańczowy
  }

  // reszta – odcienie zieleni
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

// 🪑 ikona ławki
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

// === warstwa ławek / POI ===
let poisLayer = L.geoJSON(null, {
  pointToLayer: (f, latlng) => {
    const typ = (f.properties?.typ || '').toLowerCase();
    // zawsze ławka — jeśli ma typ "ławka", "bench" lub brak typu (bo to i tak POI)
    if (typ.includes('ławka') || typ.includes('bench') || !typ) {
      return L.marker(latlng, { icon: createBenchIcon() });
    }
    // w przyszłości można dodać inne ikony dla różnych typów POI
    return L.marker(latlng, { icon: createBenchIcon() });
  },
  onEachFeature: (f, l) => {
    let popup = '';
    if (f.properties?.name) popup += '<b>' + f.properties.name + '</b><br/>';
    if (f.properties?.opis) popup += f.properties.opis + '<br/>';
    l.bindPopup(popup || 'Miejsce odpoczynku');
  }
}).addTo(map);

// === warstwa stacji rowerowych ===
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

// === aktualizacja rozmiaru rowerków przy zoomie ===
map.on('zoomend', () => {
  const newIcon = getBikeIconForZoom(map.getZoom());
  stationsLayer.eachLayer(layer => {
    if (layer.setIcon) layer.setIcon(newIcon);
  });
});

// === filtrowanie tras z buforowaniem ===
let allTrasy = null;

function applyFilters() {
  if (!allTrasy) return;
  const family = document.getElementById('filter-family').checked;
  const sport = document.getElementById('filter-sport').checked;

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
  document.getElementById(id).addEventListener('change', applyFilters);
});
document.getElementById('show-pois').addEventListener('change', e => {
  if (e.target.checked) poisLayer.addTo(map);
  else map.removeLayer(poisLayer);
});
document.getElementById('show-stations').addEventListener('change', e => {
  if (e.target.checked) stationsLayer.addTo(map);
  else map.removeLayer(stationsLayer);
});

// === panel boczny ===
const btn = document.querySelector("#colapse");
const panel = document.querySelector("#panel");
const clear = document.querySelector("#clear");
const h2 = document.querySelector("#h2");

const mapSite = document.querySelector('#map');

let isOpen = true;
btn.addEventListener("click", () => {
  if (isOpen) {
    panel.style.width = "4%";
    clear.style.display = "none";
    h2.style.display = "none";
    btn.innerHTML = "+";
    mapSite.style.width = "90%";
  } else {
    panel.style.width = "28%";
    clear.style.display = "block";
    h2.style.display = "block";
    btn.innerHTML = "—";
    mapSite.style.width = "80%";
  }
  isOpen = !isOpen;
});

// === legenda mapy ===
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.style.backgroundColor = "rgb(0,0,0,0.85)";
  div.style.padding = "15px";
  div.style.borderRadius = "10px";
  div.style.height = "200px";
  div.style.width = "250px";
  div.style.fontSize = "19px";
  div.style.color = "white";
  div.innerHTML = `
    <h4 style="text-align:center">Legenda</h4>
    <div><span style="background:#1a9850"></span> Trasa rodzinna</div>
    <div><span style="background:#2b83ba"></span> Droga rowerowa</div>
    <div><span style="background:#d73027"></span> Trasa sportowa</div>
    <div><img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"> Stacja roweru</div>
    <div><img src="../imgs/bench.png" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"> Ławka / odpoczynek</div>
  `;
  return div;
};
legend.addTo(map);

// === inicjalizacja ===
applyFilters();