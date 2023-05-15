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
  let layer = e.layer
  let type = e.shape
  CreateEl(layer, type)
  
});

function createRectangle() {
  const length = parseFloat(document.getElementById('lengthInput').value);
  const width = parseFloat(document.getElementById('widthInput').value);

  if (isNaN(length) || isNaN(width)) {
    console.error('Некорректные значения для длины и/или ширины');
    return;
  }

  const center = map.getCenter();
  const centerPoint = turf.point([center.lng, center.lat]);

  // Переводим метры в градусы
  const metersPerDegree = 111300; // Приблизительное количество метров в градусе на экваторе
  const lengthDegrees = length / (metersPerDegree * Math.cos(center.lat * Math.PI / 180));
  const widthDegrees = width / metersPerDegree;

  const southWest = L.latLng(center.lat - widthDegrees / 2, center.lng - lengthDegrees / 2);
  const northWest = L.latLng(center.lat + widthDegrees / 2, center.lng - lengthDegrees / 2);
  const northEast = L.latLng(center.lat + widthDegrees / 2, center.lng + lengthDegrees / 2);
  const southEast = L.latLng(center.lat - widthDegrees / 2, center.lng + lengthDegrees / 2);

  const polygon = L.polygon([southWest, northWest, northEast, southEast]);
  map.fitBounds(polygon.getBounds());

  CreateEl(polygon, 'Rectangle')

  document.getElementById('lengthInput').value = '';
  document.getElementById('widthInput').value = '';
}

function CreateEl(layer, type) {
  if (type=='Circle') {
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

  if (type=='Circle' || type=='Polygon' || type=='Rectangle') {
    layer.on('contextmenu', function (e) {
      var contextMenu = L.popup({ closeButton: true })
        .setLatLng(e.latlng)
        .setContent('<div><button id="btnChangeColor">Изменить цвет</button></div>' +
                    '<div><button id="btnAddGrid">Добавить сетку</button></div>' +
                    `<div id="myDiv">\
                      <div class="pallete">\
                        <input type='button' class="color" style="background-color:#228B22;" id="color" value="#228B22"></input>\
                        <input type='button' class="color" style="background-color:#CC0000;" id="color" value="#CC0000"></input>\
                        <input type='button' class="color" style="background-color:#3388ff;" id="color" value="#3388ff"></input>\
                        <input type='button' class="color" style="background-color:#B8860B;" id="color" value="#B8860B"></input>\
                        <input type='button' class="color" style="background-color:#808000;" id="color" value="#808000"></input>\
                        <input type='button' class="color" style="background-color:#008080;" id="color" value="#008080"></input>\
                      </div>\
                      <div class='x-button' id='x-button'>X</div>
                    </div>`);
      contextMenu.openOn(map);
      document.getElementById('btnChangeColor').addEventListener('click', function() {
        const div = document.getElementById('myDiv')
        div.style.display = 'block'
        document.querySelectorAll('.color').forEach(function(el) {
          el.addEventListener('click', function() {
            var color = this.value;
            ChangeColor(layer, color)
          });
        });
      });
      document.getElementById('x-button').addEventListener('click', function() {
        const div = document.getElementById('myDiv')
        div.style.display = 'none'
        contextMenu.remove();
      })

      document.getElementById('btnAddGrid').addEventListener('click', function() {
        AddGrid(e.target)
        contextMenu.remove();
      });
    });
  }
  fg.addLayer(layer);
  createSidebarElements(layer, type);
}

function ChangeColor(layer, color) {
  layer.setStyle({color:color})
}

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

map.on('pm:cut', function (e) {
  AddGrid(e.layer, e.originalLayer)
});

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


function AddGrid(layer, originalLayer=null) {
  let feature = layer.toGeoJSON();
  let type = feature.geometry.type
  let color = layer.options.color
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

    const combined = turf.combine(clippedGridLayer.toGeoJSON(), feature);
    polygon.addData(combined)
    polygon.addTo(map)
    polygon.setStyle({color: color})
    let new_layer = polygon.getLayers()[0]
    if (originalLayer) {
      let id = originalLayer._leaflet_id;
      if (document.getElementById(id)) {
        document.getElementById(id).remove()
      }
      originalLayer.remove()
      layer.remove()
    }
    else {
    let id = layer._leaflet_id;
      if (document.getElementById(id)) {
        document.getElementById(id).remove()
      }
      layer.remove()
    }
    CreateEl(new_layer, type)
  }
}

window.onload = function() {
  let elements = document.getElementsByClassName('leaflet-control-attribution leaflet-control') 
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
}