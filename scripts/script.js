const map = L.map('map').setView([52.546, 19.700], 12);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// === popupy i style tras ===
function onEachTrasa(feature, layer) {
  let popup = '';
  if (feature?.properties) {
    if (feature.properties.name) popup += '<b>'+feature.properties.name+'</b><br/>';
    for (let k in feature.properties) popup += '<i>'+k+':</i> '+feature.properties[k]+'<br/>';
  }
  if (popup) layer.bindPopup(popup);
}

function styleTrasa(feature) {
  const typ = (feature.properties?.typ || '').toLowerCase();
  if (typ.includes('ruch uspokojony')) return { color: '#1a9850', weight: 4 }; // rodzinne
  if (typ.includes('droga rowerowa')) return { color: '#2b83ba', weight: 4 }; // rowerowe
  return { color: '#d73027', weight: 4 }; // sportowe
}

// === warstwy mapy ===
let trasyLayer = L.geoJSON(null, { style: styleTrasa, onEachFeature: onEachTrasa }).addTo(map);
let poisLayer = L.geoJSON(null, {
  pointToLayer: (f, latlng)=>L.marker(latlng),
  onEachFeature: (f,l)=>{ if (f.properties?.name) l.bindPopup(f.properties.name); }
}).addTo(map);

// === rowerowe ikony skalujące się z zoomem ===
function createBikeIcon(size = 26) {
  return L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function getBikeIconForZoom(zoom) {
  if (zoom < 11) return createBikeIcon(50);
  if (zoom < 13) return createBikeIcon(50);
  if (zoom < 15) return createBikeIcon(55);
  if (zoom < 17) return createBikeIcon(55);
  return createBikeIcon(50);
}

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

// === filtrowanie tras ===
function applyFilters() {
  const family = document.getElementById('filter-family').checked;
  const sport = document.getElementById('filter-sport').checked;

  trasyLayer.clearLayers();

  fetch('trasy.geojson').then(r=>r.ok? r.json() : null).then(data=>{
    if (!data) return;

    const feats = data.features.filter(f=>{
      const typ = (f.properties?.typ || '').toLowerCase();

      // oba wyłączone → wszystkie
      if (!family && !sport) return true;

      // rodzinne = ruch uspokojony
      if (family && typ.includes('ruch uspokojony')) return true;

      // sportowe = inne niż ruch uspokojony i droga rowerowa
      if (sport && !typ.includes('ruch uspokojony') && !typ.includes('droga rowerowa')) return true;

      return false;
    });

    trasyLayer.addData({ type:'FeatureCollection', features:feats });
  });
}

// === ładowanie danych ===
fetch('trasy.geojson').then(r=>r.ok? r.json() : null).then(data=>{ if (data) trasyLayer.addData(data); });
fetch('pois.geojson').then(r=>r.ok? r.json() : null).then(data=>{ if (data) poisLayer.addData(data); });
fetch('stations_wgs84.geojson').then(r=>r.ok? r.json() : null).then(data=>{ if (data) stationsLayer.addData(data); });

// === eventy ===
['filter-family','filter-sport'].forEach(id=>{
  document.getElementById(id).addEventListener('change', applyFilters);
});
document.getElementById('show-pois').addEventListener('change', e=>{
  if (e.target.checked) poisLayer.addTo(map);
  else map.removeLayer(poisLayer);
});
document.getElementById('show-stations').addEventListener('change', e=>{
  if (e.target.checked) stationsLayer.addTo(map);
  else map.removeLayer(stationsLayer);
});

// === inicjalizacja ===
applyFilters();


const btn = document.querySelector("#colapse");
const panel = document.querySelector("#panel");
const clear = document.querySelector("#clear");
const h2 = document.querySelector("#h2");

let isOpen = true; // stan panelu: otwarty

btn.addEventListener("click", () => {
    if (isOpen) {
        panel.style.width = "3  %";
        clear.style.display = "none";
        h2.style.display = "none";
        btn.innerHTML = "+";
    } else {
        panel.style.width = "28%";
        clear.style.display = "block";
        h2.style.display = "block";
        btn.innerHTML = "—";
    }

    isOpen = !isOpen; // zmiana stanu
});