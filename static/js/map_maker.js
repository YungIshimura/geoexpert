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

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

L.control.zoom({position: "topright"}).addTo(map);

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
    let shape = ''
    layer.on('pm:cut', function(e) {
        shape=e.shape
        if (shape=='Cut') {
            let new_layer = e.layer
            let type = new_layer.feature.geometry.type
            let id = e.originalLayer._leaflet_id
            layer.remove()
            document.getElementById(id).remove()
            CreateEl(new_layer, 'Polygon')
        }
    })
    if (shape !== 'Cut') {
        layer.on('pm:edit', function (e) {
            let area = turf.area(layer.toGeoJSON()) / 10000;
            document.getElementById('square').innerHTML = `Площадь - ${area.toFixed(3)} га`
            console.log(shape)
        });
    }
    shape=''
});

map.on('pm:remove', function (e) {
    let layer = e.layer;
    let id = layer._leaflet_id;
    if (document.getElementById(id)) {
        document.getElementById(id).remove()
    } else {
        document.getElementById(id + 1).remove()
    }
    ;
})

map.on("click", function (e) {
    const markerPlace = document.querySelector(".marker-position");
    markerPlace.textContent = e.latlng;
});

const customControl = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-pm-custom-toolbar leaflet-bar leaflet-control');
        const addCadastralButton = L.DomUtil.create('a', 'leaflet-buttons-control-button', container);
        const createPolygonButton = L.DomUtil.create('a', 'leaflet-buttons-control-button', container);
        const iconCadastral = L.DomUtil.create('i', 'bi bi-pencil-square', addCadastralButton);
        const iconPolygon = L.DomUtil.create('i', 'bi bi-plus-square', createPolygonButton);

        addCadastralButton.setAttribute('title', 'Добавить кадастровый номер');
        createPolygonButton.setAttribute('title', 'Построить полигон');

        addCadastralButton.addEventListener('click', function () {
            $('#addCadastralModal').modal('show');
        });

        createPolygonButton.addEventListener('click', function () {
            $('#createPolygonModal').modal('show');
        });

        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});
map.addControl(new customControl());


const offCanvasControl = L.Control.extend({
    options: {
        position: 'topright'
    },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-pm-canvas-toolbar leaflet-bar leaflet-control');
        const showCanvasButton = L.DomUtil.create('a', 'leaflet-buttons-control-button', container);
        const iconCanvasButton = L.DomUtil.create('i', 'bi bi-list', showCanvasButton);

        showCanvasButton.setAttribute('title', 'Показать/скрыть боковую панель');
        showCanvasButton.setAttribute('id', 'offcanvasButton');

        // showCanvasButton.setAttribute('data-bs-toggle', 'offcanvas');
        // showCanvasButton.setAttribute('data-bs-target', '#offcanvasRight');
        // showCanvasButton.setAttribute('aria-controls', 'offcanvasRight');

        // showCanvasButton.addEventListener('click', shiftElements);
        showCanvasButton.addEventListener('click', toggleCanvas);

        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});

map.addControl(new offCanvasControl());

map.on("click", function (e) {
    const markerPlace = document.querySelector(".marker-position");
    markerPlace.textContent = e.latlng;
});

function createRectangle() {
    const length = parseFloat(document.getElementById('lengthInput').value);
    const width = parseFloat(document.getElementById('widthInput').value);

    if (isNaN(length) || isNaN(width)) {
        alert('Некорректные значения для длины и/или ширины');
        return;
    }

    const center = map.getCenter();

    // Переводим метры в градусы
    const metersPerDegree = 111300; // Приблизительное количество метров в градусе на экваторе
    const lengthDegrees = length / (metersPerDegree * Math.cos(center.lat * Math.PI / 180));
    const widthDegrees = width / metersPerDegree;

    const southWest = L.latLng(center.lat - widthDegrees / 2, center.lng - lengthDegrees / 2);
    const northWest = L.latLng(center.lat + widthDegrees / 2, center.lng - lengthDegrees / 2);
    const northEast = L.latLng(center.lat + widthDegrees / 2, center.lng + lengthDegrees / 2);
    const southEast = L.latLng(center.lat - widthDegrees / 2, center.lng + lengthDegrees / 2);

    const polygon = L.polygon([southWest, northWest, northEast, southEast]);
    polygon.on('pm:edit', function () {
        const area = turf.area(polygon.toGeoJSON()) / 10000;
        document.getElementById('square').innerHTML = `Площадь - ${area.toFixed(3)} га`
    });
    map.fitBounds(polygon.getBounds());

    CreateEl(polygon, 'Rectangle')

    document.getElementById('lengthInput').value = '';
    document.getElementById('widthInput').value = '';
}

function CreateEl(layer, type) {
    let flag = 1
    let el = '<div><button id="btnChangeColor">Изменить цвет</button></div>' +
    '<div><button id="btnAddArea">Добавить полигон вокруг</button></div>' +
    `<div id="colors">\
      <div class="pallete">\
        <input type='button' class="color" style="background-color:#228B22;" id="color" value="#228B22"></input>\
        <input type='button' class="color" style="background-color:#CC0000;" id="color" value="#CC0000"></input>\
        <input type='button' class="color" style="background-color:#3388ff;" id="color" value="#3388ff"></input>\
        <input type='button' class="color" style="background-color:#B8860B;" id="color" value="#B8860B"></input>\
        <input type='button' class="color" style="background-color:#808000;" id="color" value="#808000"></input>\
        <input type='button' class="color" style="background-color:#008080;" id="color" value="#008080"></input>\
      </div>\
      <div class='x-button' id='x-button'>X</div>
    </div>`+
    '<div id="areas">\
        <input type="text" id="AreaValue" placeholder="Ввведите">\
        <button type="button" id="btnSendArea">Отправить</button>\
        <div class="x-button-2" id="x-button-2">X</div>\
    </div>'
    if (type == 'Circle') {
        var center = layer.getLatLng();
        var radius = layer.getRadius();

        var options = {steps: 64, units: 'kilometers'};
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

    if (type == 'Circle' || type == 'Polygon' || type == 'Rectangle') {
        layer.on('contextmenu', function (e) {
            var contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(el + '<div><button id="btnAddGrid">Добавить сетку</button></div>');
            contextMenu.openOn(map);
            document.getElementById('btnChangeColor').addEventListener('click', function () {
                const div = document.getElementById('colors')
                div.style.display = 'block'
                document.querySelectorAll('.color').forEach(function (el) {
                    el.addEventListener('click', function () {
                        var color = this.value;
                        ChangeColor(layer, color)
                    });
                });
            });
            document.getElementById('x-button').addEventListener('click', function () {
                const div = document.getElementById('colors')
                div.style.display = 'none'
                contextMenu.remove();
            })

            document.getElementById('x-button-2').addEventListener('click', function () {
                const div = document.getElementById('areas')
                div.style.display = 'none'
                contextMenu.remove();
            })

            document.getElementById('btnAddGrid').addEventListener('click', function () {
                AddGrid(e.target)
                contextMenu.remove();
            });

            document.getElementById('btnAddArea').addEventListener('click', function() {
                const div = document.getElementById('areas')
                div.style.display = 'block'
            })

            document.getElementById('btnSendArea').addEventListener('click', function() {
                let value = document.getElementById('AreaValue').value
                AddArea(layer, value, contextMenu)
            })
        });
    }

    else if (type=='Line') {
        layer.on('contextmenu', function (e) {
            var contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(el + '<div><button id="btnAddMarkers">Добавить маркеры</button></div>');
            contextMenu.openOn(map);
            document.getElementById('btnChangeColor').addEventListener('click', function () {
                const div = document.getElementById('colors')
                div.style.display = 'block'
                document.querySelectorAll('.color').forEach(function (el) {
                    el.addEventListener('click', function () {
                        var color = this.value;
                        ChangeColor(layer, color)
                    });
                });
            });
            document.getElementById('x-button').addEventListener('click', function () {
                const div = document.getElementById('colors')
                div.style.display = 'none'
                contextMenu.remove();
            })
            document.getElementById('btnAddMarkers').addEventListener('click', function () {
                if (flag){
                    addMarkersToPolyline(layer)
                    flag--
                }
            })
            document.getElementById('btnAddArea').addEventListener('click', function() {
                const div = document.getElementById('areas')
                div.style.display = 'block'
            })

            document.getElementById('btnSendArea').addEventListener('click', function() {
                let value = document.getElementById('AreaValue').value
                AddArea(layer, value, contextMenu)
            })

            document.getElementById('x-button-2').addEventListener('click', function () {
                const div = document.getElementById('areas')
                div.style.display = 'none'
                contextMenu.remove();
            })
        });

    }

    else if (type=='CircleMarker') {
        layer.on('contextmenu', function (e) {
            var contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(el + '<div><button id="btnAddMarkers">Добавить маркеры</button></div>');
            contextMenu.openOn(map);
            document.getElementById('btnChangeColor').addEventListener('click', function () {
                const div = document.getElementById('colors')
                div.style.display = 'block'
                document.querySelectorAll('.color').forEach(function (el) {
                    el.addEventListener('click', function () {
                        var color = this.value;
                        ChangeColor(layer, color)
                    });
                });
            });
            document.getElementById('x-button').addEventListener('click', function () {
                const div = document.getElementById('colors')
                div.style.display = 'none'
                contextMenu.remove();
            })
            document.getElementById('btnAddMarkers').addEventListener('click', function () {
                if (flag){
                    addMarkersToPolyline(layer)
                    flag--
                }
            })
        });
    }

    fg.addLayer(layer);
    createSidebarElements(layer, type);
}

function AddArea(layer, value, contextMenu) {
    if (layer.toGeoJSON().geometry.type=='LineString') {
        var line = layer.toGeoJSON().geometry;
        var widthInMeters = value;

        var widthInDegrees = widthInMeters / 111300;
        var buffered = turf.buffer(line, widthInDegrees, { units: 'degrees' });

        var polygonLayer = L.geoJSON(buffered);
        polygonLayer.addTo(map);
    }
    else {
        var widthInDegrees = value / 111300;

        var buffered = turf.buffer(layer.toGeoJSON(), widthInDegrees, { units: 'degrees' });
        var polygonLayer = L.geoJSON(buffered);
        var difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, layer.toGeoJSON().geometry);

        var polygon1 = L.geoJSON(difference).getLayers()[0].getLatLngs();
        var polygon2 = L.geoJSON(layer.toGeoJSON()).getLayers()[0].getLatLngs();
        var combinedPolygon = L.polygon([...polygon1, ...polygon2]);
        combinedPolygon.addTo(map);
        
        document.getElementById(layer._leaflet_id).remove()
        layer.remove()
        CreateEl(combinedPolygon, 'Polygon')
    }
    const div = document.getElementById('areas')
    div.style.display = 'none'
    contextMenu.remove();
}

function addMarkersToPolyline(polyline) {
    var markers=[]

    polyline.getLatLngs().forEach(function(latLng) {
      var marker = L.marker(latLng).addTo(map);
      marker.pm.enable({
        draggable: false
      });
      markers.push(marker);
    });

    polyline.on('pm:dragend', function() {
        markers.forEach(function(marker) {
            marker.removeFrom(map);
        });
        addMarkersToPolyline(polyline)
    })

    polyline.on('pm:edit', function() {
        markers.forEach(function(marker) {
            marker.removeFrom(map);
        });
        addMarkersToPolyline(this)
    })
}

function ChangeColor(layer, color) {
    layer.setStyle({color: color})
}


let isFirstObjectAdded = false;

function createSidebarElements(layer, type, description = '') {
    const area = turf.area(layer.toGeoJSON()) / 10000;
    const layerId = layer._leaflet_id;
    const el = `
    <div class="card card-spacing" id="${layerId}" type="${type}">
    <div class="card-body">
        <div class="d-flex align-items-center justify-content-between">
            <h6 class="card-subtitle text-body-secondary">${mapObjects[type]['title']} №${mapObjects[type]['number']}
                ${description}</h6>
            <i class="bi bi-arrow-down-square arrow-icon"></i>
        </div>
        <div class="hidden-elements" id="hiddenElements_${layerId}" style="display: none">
            <div class="mb-3">
                <label class="form-check-label" for="buildingType_${layerId}">Тип полигона:</label>
                <br>
                <input class="form-check-input" type="radio" name="buildingType_${layerId}"
                       value="option1">Здание</input>
                <input class="form-check-input" type="radio" name="buildingType_${layerId}"
                       value="option2">Участок</input>
            </div>
            <div class="form-floating mb-3">
                <input type="text" class="form-control" name="buildingName_${layerId}" id="buildingName_${layerId}"
                       placeholder="Название полигона:">
                <label for="buildingName_${layerId}">Название полигона:</label>
            </div>
            <div class="form-floating">
                <textarea class="form-control" placeholder="Описание полигона:" name="buildingDescription_${layerId}"
                          id="buildingDescription_${layerId}" style="height: 100px"></textarea>
                <label for="buildingDescription_${layerId}">Описание полигона:</label>
            </div>
            <div>
                <span id='square'>Площадь - ${area.toFixed(3)} га</span>
            </div>
        </div>
    </div>
</div>
  `;
    mapObjects[type]['number'] += 1;
    const temp = document.createElement('div');
    temp.innerHTML = el.trim();
    const htmlEl = temp.firstChild;
    const cardSubtitle = htmlEl.querySelector('.card-subtitle');
    const arrowIcon = htmlEl.querySelector('.arrow-icon');

    cardSubtitle.addEventListener("click", function () {
        zoomToMarker(layerId, type);
    });

    arrowIcon.addEventListener('click', function () {
        toggleElements(layerId);
    });

    cardSubtitle.style.cursor = 'pointer';
    arrowIcon.style.cursor = 'pointer';

    const offcanvasRight = document.getElementById('offcanvasRight');
    const offcanvasBody = offcanvasRight.querySelector('.offcanvas-body');
    offcanvasBody.appendChild(htmlEl);

    if (!isFirstObjectAdded) {
        offcanvasRight.classList.add('show');
        shiftElements();
        isFirstObjectAdded = true;
    }
}

function toggleElements(layerId) {
    const hiddenElements = document.getElementById(`hiddenElements_${layerId}`);
    const card = document.getElementById(`${layerId}`);
    const icon = card.querySelector(`.arrow-icon`);

    if (hiddenElements.style.display === 'none') {
        hiddenElements.style.display = 'block';
        icon.className = 'bi bi-arrow-up-square arrow-icon';
    } else {
        hiddenElements.style.display = 'none';
        icon.className = 'bi bi-arrow-down-square arrow-icon';
    }
}

function zoomToMarker(id, type) {
    // const id = el.getAttribute("id");
    const layer = fg.getLayer(id);
    if (type == 'Rectangle' || type == 'Polygon' || type == 'Circle') {
        let center = layer.getBounds().getCenter()
        map.panTo(center);
    } else if (type == 'Marker' || type == 'CircleMarker') {
        let center = layer.getLatLng()
        map.panTo(center)
    } else {
        let center = layer.getBounds().getCenter()
        map.panTo(center)
    }
}

function DrawCadastralPolygon(coords) {
    states = JSON.parse(coords)
    let polygon = L.geoJSON(states).addTo(map);
    polygon.on('pm:edit', function () {
        const area = turf.area(polygon.toGeoJSON()) / 10000;
        document.getElementById('square').innerHTML = `Площадь - ${area.toFixed(3)} га`
    });
    const center = polygon.getBounds().getCenter()
    fg.addLayer(polygon);
    createSidebarElements(polygon, 'Polygon')
    map.flyTo(center, config.maxZoom)
}


function AddGrid(layer, originalLayer = null) {
    let feature = layer.toGeoJSON();
    let type = feature.geometry.type
    let color = layer.options.color
    if (type == 'Rectangle' || type == 'Polygon') {
        let cellWidth = 0.2;
        let bufferedBbox = turf.bbox(turf.buffer(feature, cellWidth, {units: 'kilometers'}));
        let options = {units: "kilometers", mask: feature};

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
        } else {
            let id = layer._leaflet_id;
            if (document.getElementById(id)) {
                document.getElementById(id).remove()
            }
            layer.remove()
        }
        CreateEl(new_layer, type)
    }
}

window.onload = function () {
    let elements = document.getElementsByClassName('leaflet-control-attribution leaflet-control')
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}


/* Маска на кадастровый номер */
$(document).ready(function () {
    const maskOptions = {
        placeholder: "__:__:_______:____"
    };

    $('#cadastral_number1').mask('99:99:9999999:9999', maskOptions);
});


/* Добавление и проверка на уникальность кадастровых номеров */
let uniqueCadastralValues = [];

const addButton = document.getElementById('add-cadastral');
const container = document.querySelector('#container .paragraph');
let idCounter = 2;

addButton.addEventListener('click', () => {
    const newField = document.createElement('div');
    const newId = `new-cadastral-${idCounter}`;
    newField.innerHTML = `
    <div id="${newId}" style="margin-bottom: 20px">
      <div class="input-group mb-3 custom-input-group">
        <input type="text" name="cadastral_numbers" id="cadastral_number${idCounter}" class="form-control custom-form-control" onchange="checkInputCadastral(this);" readonly style="background-color: lightgray">
        <div class="input-group-append custom-input-group-append" style="margin-left: 2px">
          <button name="edit_button" type='button' id='edit${idCounter}' class='btn btn-outline-secondary custom-button' style='margin-left: 10px; text-align: center; line-height: 10px;'><i class='bx bxs-edit'></i></button>
          <button name="delete_button" type='button' id='delete${idCounter}' class='btn btn-outline-secondary custom-button' style='margin-left: 10px; text-align: center; line-height: 10px;'><i class='bx bxs-x-circle'></i></button>
        </div>
      </div>
    </div>
  `;
    container.appendChild(newField);

    const inputFields = newField.querySelectorAll("input[name='cadastral_numbers']");
    const maskOptions = {
        placeholder: "__:__:_______:____"
    };

    $(inputFields).mask('99:99:9999999:9999', maskOptions);

    const editButton = document.getElementById(`edit${idCounter}`);
    editButton.addEventListener('click', () => {
        editCadastral(editButton);
    });

    const deleteButton = document.getElementById(`delete${idCounter}`);
    deleteButton.addEventListener('click', () => {
        const parentDiv = deleteButton.parentNode.parentNode;
        const inputElement = parentDiv.querySelector('input[name="cadastral_numbers"]');
        removeCadastralValue(inputElement.value);
        newField.remove();
    });

    idCounter++;
});

// Удаление кадастрового номера из массива uniqueCadastralValues
function removeCadastralValue(number) {
    const index = uniqueCadastralValues.indexOf(number);
    if (index !== -1) {
        uniqueCadastralValues.splice(index, 1);
    }
}

function deleteCadastral(deleteButton) {
    const parentDiv = deleteButton.parentNode.parentNode;
    const inputElement = parentDiv.querySelector('input[name="cadastral_numbers"]');
    removeCadastralValue(inputElement.value);
    inputElement.value = '';

}

function editCadastral(editButton) {
    const parentDiv = editButton.parentNode.parentNode;
    const inputElement = parentDiv.querySelector('input[name="cadastral_numbers"]');
    if (inputElement.readOnly) {
        editButton.innerHTML = "<i class='bx bxs-check-circle'></i>";
        inputElement.readOnly = false
        inputElement.style.cssText = 'background-color: white; transition: 0.15s linear;';
    } else {
        editButton.innerHTML = "<i class='bx bxs-edit'></i>";
        inputElement.readOnly = true;
        inputElement.style.cssText = 'background-color: lightgray; transition: 0.15s linear;';
    }


function checkInputCadastral(input) {
    const allInputs = document.querySelectorAll('input[name="cadastral_numbers"]');
    const values = Array.from(allInputs)
        .filter(input => input.value)
        .map(input => input.value);
    const parentDiv = input.parentNode;
    const editButton = parentDiv.querySelector('button[name="edit_button"]');

    const regex = new RegExp('[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}')
    if (!regex.test(input.value)) {
        showMessageModal("error", 'Неверный формат кадастрового номера');
        return;
    }

    const uniqueValues = [...new Set(values)];
    uniqueCadastralValues = uniqueValues;
    editButton.innerHTML = "<i class='bx bxs-edit'></i>";
    input.readOnly = true;
    input.style.cssText = 'background-color: lightgray !important; transition: 0.15s linear;';

    if (uniqueValues.length < values.length) {
        input.value = "";
        showMessageModal("error", "Данный кадастровый номер уже был добавлен");
    }
}


/* Сдвиг элементов управления картой при появлении канваса */
const elementsToShift = document.querySelectorAll('.leaflet-right');
const offcanvasRight = document.getElementById('offcanvasRight');

function toggleCanvas() {
    const isCanvasOpen = offcanvasRight.classList.contains('show');

    if (isCanvasOpen) {
        closeCanvas();
    } else {
        openCanvas();
    }
}

function openCanvas() {
    offcanvasRight.classList.add('show', 'showing');
    offcanvasRight.classList.remove('hide', 'hiding');
    shiftElements();
}

function closeCanvas() {
    offcanvasRight.classList.add('hide', 'hiding');
    offcanvasRight.classList.remove('show', 'showing');
    shiftElements();
}

function shiftElements() {
    const isShifted = elementsToShift[0].classList.contains('shifted');

    if (!isShifted) {
        elementsToShift.forEach(element => {
            element.style.transition = 'transform 0.3s ease-out';
            element.style.transform = `translateX(-${offcanvasRight.offsetWidth}px)`;
        });

        elementsToShift.forEach(element => {
            element.classList.add('shifted');
        });
    } else {
        elementsToShift.forEach(element => {
            element.style.transition = 'transform 0.3s ease-out';
            element.style.transform = 'translateX(0)';
        });

        elementsToShift.forEach(element => {
            element.classList.remove('shifted');
        });
    }
}