// --- Inicjalizacja mapy ---
const map = L.map('map', {
  center: [52.2297, 21.0122], // Domyślnie Warszawa
  zoom: 12
});

// --- Warstwa kafelkowa ---
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// --- LEGENDA ---
const legenda = L.control({ position: 'bottomright' });

legenda.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'legenda');
  div.innerHTML = `
    <h4>Legenda</h4>
    <p><img src="images/trasa.png" width="24"> Trasa rowerowa</p>
    <p><img src="images/pinezka.png" width="16"> Twoja pozycja</p>
    <p><span style="background:#3388ff; display:inline-block; width:20px; height:10px;"></span> Szlak główny</p>
  `;
  return div;
};

legenda.addTo(map);

// --- Pinezka UI (lew. dolny róg) ---
const pinezkaControl = L.control({ position: 'bottomleft' });

pinezkaControl.onAdd = function () {
  const div = L.DomUtil.create('div', 'pinezka-ui');
  div.innerHTML = `<img src="images/pinezka.png" width="40" title="Twoja pozycja">`;
  return div;
};

pinezkaControl.addTo(map);

// --- Marker Twojej pozycji ---
const ikonaPinezka = L.icon({
  iconUrl: 'images/pinezka.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const userLatLng = [latitude, longitude];

      if (window.userMarker) {
        window.userMarker.setLatLng(userLatLng);
      } else {
        window.userMarker = L.marker(userLatLng, { icon: ikonaPinezka }).addTo(map);
        map.setView(userLatLng, 13);
      }
    },
    (error) => {
      console.error('Błąd geolokalizacji:', error);
    },
    { enableHighAccuracy: true }
  );
} else {
  alert('Twoja przeglądarka nie obsługuje geolokalizacji.');
}
