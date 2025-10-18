const map = L.map('map').setView([52.546, 19.700], 12);
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // warstwy
    let trasyLayer = L.geoJSON(null, { style: styleTrasa, onEachFeature: onEachTrasa }).addTo(map);
    let poisLayer = L.geoJSON(null, {
      pointToLayer: (f,latlng)=>L.marker(latlng),
      onEachFeature: (f,l)=>{ if (f.properties?.name) l.bindPopup(f.properties.name); }
    }).addTo(map);
    let stationsLayer = L.geoJSON(null, {
      pointToLayer: (f,latlng)=>L.marker(latlng),
      onEachFeature: (f,l)=>{ if (f.properties?.name) l.bindPopup(f.properties.name); }
    }).addTo(map);

    // popupy tras
    function onEachTrasa(feature, layer) {
      let popup = '';
      if (feature?.properties) {
        if (feature.properties.name) popup += '<b>'+feature.properties.name+'</b><br/>';
        for (let k in feature.properties) popup += '<i>'+k+':</i> '+feature.properties[k]+'<br/>';
      }
      if (popup) layer.bindPopup(popup);
    }

    // style tras
    function styleTrasa(feature) {
      const typ = (feature.properties?.typ || '').toLowerCase();
      if (typ.includes('ruch uspokojony')) return { color: '#1a9850', weight: 4 };
      if (typ.includes('droga rowerowa')) return { color: '#2b83ba', weight: 4 };
      return { color: '#d73027', weight: 4 };
    }

    // filtrowanie tras
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

    // ładowanie danych
    fetch('trasy.geojson').then(r=>r.ok? r.json() : null).then(data=>{ if (data) trasyLayer.addData(data); });
    fetch('pois.geojson').then(r=>r.ok? r.json() : null).then(data=>{ if (data) poisLayer.addData(data); });
    fetch('stations_wgs84.geojson').then(r=>r.ok? r.json() : null).then(data=>{ if (data) stationsLayer.addData(data); });

    // eventy checkboxów
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

    applyFilters();