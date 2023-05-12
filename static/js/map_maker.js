let mapObjects = {
  'Polygon': {
    'title': 'Полигон',
    'number': 1
  },
  'Rectangle': {
    'title': 'Квадрат',
    'number': 1
  },
  'Circle': {
    'title': 'Круг',
    'number': 1
  },
  'Marker': {
    'title': 'Маркер',
    'number': 1
  },
  'CircleMarker': {
    'title': 'Круговой Маркер',
    'number': 1
  },
  'Line': {
    'title': 'Линия',
    'number': 1
  },
}

let config = {
  minZoom: 4,
  maxZoom: 18,
  zoomControl: false,
};

const zoom = 12;
const lat = 55.749917;
const lng = 37.627487;
const map = L.map("map", config).setView([lat, lng], zoom);
const fg = L.featureGroup().addTo(map);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

L.control.zoom({ position: "topright" }).addTo(map);

const options = {
  position: "topleft",
  drawMarker: true,
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  editPolygon: true,
  deleteLayer: true,
};

map.pm.addControls(options);
map.pm.Draw.getShapes();

map.pm.setLang('ru')

map.on('pm:create', function (e) {
  let layer = e.layer;
  if (e.shape=='Circle') {
    var center = layer.getLatLng();
    var radius = layer.getRadius();

    var options = { steps: 64, units: 'kilometers' };
    var circlePolygon = turf.circle(
      [center.lng, center.lat],
      radius / 1000,
      options
    );
    var polygonLayer = L.geoJSON(circlePolygon).getLayers()[0];
    layer.remove();
    polygonLayer.addTo(map);

    layer = polygonLayer
  }
  if (e.shape=='Circle' || e.shape=='Polygon' || e.shape=='Rectangle') {
    layer.on('contextmenu', function (e) {
      // Создайте контекстное меню
      var contextMenu = L.popup({ closeButton: true })
        .setLatLng(e.latlng)
        .setContent('<div><button id="btnChangeColor">Изменить цвет</button></div>' +
                    '<div><button id="btnAddGrid">Добавить сетку</button></div>');

      // Добавьте контекстное меню на карту
      contextMenu.openOn(map);

      // Обработчик клика на кнопке "Изменить цвет"
      document.getElementById('btnChangeColor').addEventListener('click', function() {
        
      });

      document.getElementById('btnAddGrid').addEventListener('click', function() {
        AddGrid(e)
      });
    });
  }
  fg.addLayer(layer);
  createSidebarElements(layer, e.shape);
});


map.on('pm:remove', function(e) {
  let layer = e.layer;
  let id = layer._leaflet_id;
  if (document.getElementById(id)) {
    document.getElementById(id).remove()
  }
  else {
    document.getElementById(id+1).remove()
  };
})

// Обработчик события для инструмента Circle в Geoman
// map.on('pm:drawend', function (e) {
//   // Если инструмент - Circle
//   if (e.source == 'Draw' && e.shape == 'Circle') {
//       console.log(e)
//     }
// });

map.on("click", function (e) {
  const markerPlace = document.querySelector(".marker-position");
  markerPlace.textContent = e.latlng;
});

function createSidebarElements(layer, type, description='') {
  const el = `<div class="sidebar-el" id='${layer._leaflet_id}' type='${type}'>${mapObjects[type]['title']} №${mapObjects[type]['number']} ${description}</div>`;
  mapObjects[type]['number'] += 1
  const temp = document.createElement("div");
  temp.innerHTML = el.trim();
  const htmlEl = temp.firstChild;
  L.DomEvent.on(htmlEl, "click", zoomToMarker);
  sidebar.insertAdjacentElement("beforeend", htmlEl);
}

function zoomToMarker(e) {
  const clickedEl = e.target;
  const id = clickedEl.getAttribute("id");
  const type = clickedEl.getAttribute("type");
  const layer = fg.getLayer(id);
  if (type=='Rectangle' || type=='Polygon' || type=='Circle') {
    let center = layer.getBounds().getCenter()
    map.panTo(center);
  }
  else if (type=='Marker' || type=='CircleMarker') {
    let center = layer.getLatLng()
    map.panTo(center)
  }
    else {
    let center = layer.getLatLngs();
    map.panTo(center[0])
  }
}

function DrawCadastralPolygon(coords) {   
  states = JSON.parse(coords)
  let polygon = L.geoJSON(states).addTo(map);
  const center = polygon.getBounds().getCenter()
  fg.addLayer(polygon);
  createSidebarElements(polygon, 'Polygon')
  map.flyTo(center, config.maxZoom)
}


function AddGrid(e) {
  const layer = e.target;
  let feature = layer.toGeoJSON();
  let type = feature.geometry.type

  if (type=='Rectangle' || type=='Polygon') {
    let cellWidth = 0.2;
    let bufferedBbox = turf.bbox(turf.buffer(feature, cellWidth, {units: 'kilometers'}));
    let options = { units: "kilometers", mask: feature};

    let squareGrid = turf.squareGrid(
      bufferedBbox,
      cellWidth,
      options
    );
    
    let clippedGridLayer = L.geoJSON();
    let polygon = L.geoJSON()
    turf.featureEach(squareGrid, function (currentFeature, featureIndex) {
      let intersected = turf.intersect(feature, currentFeature);
      clippedGridLayer.addData(intersected);
    });

    const combined = turf.combine(clippedGridLayer.toGeoJSON());
    polygon.addData(combined)
    polygon.addTo(map)
    let new_layer = polygon.getLayers()[0]

    let id = layer._leaflet_id;
    if (document.getElementById(id)) {
      document.getElementById(id).remove()
    }
    else {
      document.getElementById(id+1).remove()
    };
    layer.remove()

    fg.addLayer(new_layer);
    createSidebarElements(new_layer, 'Polygon', 'С сеткой')
  }
  // console.log(type)
  // console.log(feature)
  // console.log(feature.geometry.coordinates)
}


window.onload = function() {
  let elements = document.getElementsByClassName('leaflet-control-attribution leaflet-control') 
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
}