let config = {
  minZoom: 7,
  maxZoom: 18,
  zoomControl: false,
};

const zoom = 12;
const lat = 55.749917;
const lng = 37.627487;
const map = L.map("map", config).setView([lat, lng], zoom);


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

map.on('pm:create', function (e) {
  var layer = e.layer;
  makeContent(layer, e.shape);
  layer.on('pm:update', function (e) {
    makeContent(e.layer, e.shape);
  });
});

function makeContent(layer, type) {
  let points = [];
  let feature = layer.toGeoJSON();
  let coords = feature.geometry.coordinates
  for (var i = 0; i < coords.length; i++) {
    points.push([coords[i], coords[i + 1]])
  }
  AddToSideBar(points, type)
}

function AddToSideBar(points, type) {
  let sidebar = document.getElementById('sidebar')
  let coords = points[0][0]
  sidebar.innerHTML+=`<p>${type}</p>`
  if (type=='Marker' || type=='CircleMarker' || type=='Circle') {
    sidebar.innerHTML+=`<div style='margin-top: -10px;'>${points[0]}</div> <hr>`
  }
  else {
    for (let i = 0; i<coords.length; i++) {
      sidebar.innerHTML+=`<div>${coords[i]}</div><hr>`
    }
  }
}
