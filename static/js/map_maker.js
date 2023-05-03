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
  minZoom: 7,
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
map.pm.disableDraw("Polygon");
map.pm.setLang('ru')
map.on('pm:create', function (e) {
  let layer = e.layer;
  makeContent(layer, e.shape);
  console.log(layer.toGeoJSON())
  layer.on('pm:update', function (e) {
    let center = layer.getCenter();
    let marker_id = layer._leaflet_id+2;
    let marker = fg.getLayer(marker_id);;
    marker.setLatLng(center);
  });
});

map.on('pm:remove', function(e) {
  let layer = e.layer;
  let id = layer._leaflet_id+2;
  document.getElementById(id).remove()
  console.log(e);
})

function makeContent(layer, type) {
  if (type=='Rectangle' || type=='Polygon' || type=='Circle') {
    let points = layer.getBounds().getCenter(); 
    AddToSideBar(points, type)
  }
  else if (type=='Marker' || type=='CircleMarker') {
    let points = layer.getLatLng();
    AddToSideBar(points, type)
  }
  else {
    let points = layer.getLatLngs();
    AddToSideBar(points[0], type)
  }
}

function createSidebarElements(layer, type) {
  const el = `<div class="sidebar-el" id='${layer._leaflet_id}' data-marker="${layer._leaflet_id}">${mapObjects[type]['title']} №${mapObjects[type]['number']}</div>`;
  mapObjects[type]['number'] += 1
  const temp = document.createElement("div");
  temp.innerHTML = el.trim();
  const htmlEl = temp.firstChild;

  L.DomEvent.on(htmlEl, "click", zoomToMarker);
  sidebar.insertAdjacentElement("beforeend", htmlEl);
}

function zoomToMarker(e) {
  const clickedEl = e.target;
  const markerId = clickedEl.getAttribute("data-marker");
  const marker = fg.getLayer(markerId);
  const getLatLong = marker.getLatLng();
  
  map.panTo(getLatLong);
}

function AddToSideBar(point, type) {
  const marker = L.marker(point, { clickable: false }).addTo(fg);
  marker.setOpacity(0);
  createSidebarElements(marker, type);
}

function drawPolygon(coords) {   
  let states = JSON.parse(coords)
  let polygon = L.geoJSON(states).addTo(map);
  let center = polygon.getBounds().getCenter()
  AddToSideBar(center, 'Polygon')
}


window.onload = function() {
  let elements = document.getElementsByClassName('leaflet-control-attribution leaflet-control') 
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
}