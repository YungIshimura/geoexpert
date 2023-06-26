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

const config = {
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
    drawRectangle: false,
    drawCircle: true,
    drawCircleMarker: true,
    editPolygon: true,
    deleteLayer: true,
};
map.pm.addControls(options);
map.pm.Draw.getShapes();
map.pm.setLang('ru');

map.on('pm:create', function (e) {
    let layer = e.layer;
    let type = e.shape;
    if (type === 'Circle') {
        const center = layer.getLatLng();
        const radius = layer.getRadius();

        const options = {steps: 64, units: 'kilometers'};
        const circlePolygon = turf.circle(
            [center.lng, center.lat],
            radius / 1000,
            options
        );
        const polygonLayer = L.geoJSON(circlePolygon).getLayers()[0];
        layer.remove();
        polygonLayer.addTo(map);

        layer = polygonLayer;
    }
    CreateEl(layer, type);
});

map.on('pm:cut', function (e) {
    const layer = e.layer;
    const value = layer.options.value;
    const originalLayer = e.originalLayer;
    const polygon = L.geoJSON(layer.toGeoJSON());
    e.originalLayer.cutted = true;

    if (e.layer.options.isGrid) {
        AddGrid(polygon, value, originalLayer)
        layer.remove();
    } else {
        document.getElementById(originalLayer._leaflet_id).remove();
        CreateEl(layer, 'Polygon')
    }
})


function AddEditArea(layer) {
    layer.on('pm:edit', (e) => {

        if (!e.layer.cutted &&
            (e.shape === 'Polygon' ||
                e.shape === 'Rectangle' ||
                e.shape === 'Circle')
        ) {
            var coordinates = layer.toGeoJSON().features[0].geometry.coordinates[1]
            var cutPolygonGeometry = turf.polygon([coordinates]);
            var newCutArea = (turf.area(cutPolygonGeometry) / 10000);
            let area = turf.area(layer.toGeoJSON()) / 10000;
            layer.options.source_area = area;
            layer.options.cutArea = newCutArea
            const squareElement = document.getElementById(`square${layer._leaflet_id}`);
            const cutsquareElement = document.getElementById(`cutSquare${layer._leaflet_id}`);
            squareElement.innerHTML = `Площадь - ${area.toFixed(3)}`;
            cutsquareElement.innerHTML = `Площадь вырезанного - ${newCutArea.toFixed(3)}`;

            if (layer.options.added_external_polygon_id) {
                let totalArea = calculateTotalArea(layer)
                layer.options.total_area = totalArea;

                const totalSquareElement = document.getElementById(`totalSquare${layer._leaflet_id}`);
                totalSquareElement.innerHTML = `Общая площадь - ${totalArea}`;
            }
        }
    });
}


var uniqueCadastralValues = [];
const addButton = document.getElementById('add-cadastral');
const container = document.querySelector('#container .paragraph');
var idCounter = 2;


map.on('pm:remove', (e) => {
    let layer = e.layer;
    let id = layer._leaflet_id;
    let element = document.getElementById(id);
    if (element) {
        element.remove();
    } else {
        const card = document.getElementById(id + 1);
        const element = card.querySelector(`[name="cadastralNumber"]`) ?? null;
        const number = element?.textContent.split(" ").pop();
        let index = uniqueCadastralValues.indexOf(number);
        if (index !== -1) {
            uniqueCadastralValues.splice(index, 1);
        }
        card.remove();
    }
});

var cross = null;
//
// map.on("click", function (e) {
//     const markerPlace = document.querySelector(".marker-position");
//
//     markerPlace.textContent = e.latlng;
//     if (cross) {
//         cross.remove();
//     }
//     var crossIcon = L.divIcon({
//         className: 'cross-icon',
//         iconSize: [32, 32],
//         iconAnchor: [16, 16],
//         html: '<div class="cross-icon" id="cross-iconId"></div>'
//     });
//     cross = L.marker(e.latlng, {icon: crossIcon}).addTo(map);
// });


map.on('dblclick', function (e) {
    const contextMenu = L.popup({closeButton: true})
        .setLatLng(e.latlng)
        .setContent(`<div><a type="button" id="btnAddPoly">Вставить полигон</a></div>`);
    contextMenu.openOn(map);

    document.getElementById(`btnAddPoly`).addEventListener('click', function () {
        navigator.clipboard.readText()
            .then(jsonString => {
                const [geoJSON, optionsSoucePolygon] = JSON.parse(jsonString);
                const polygon = L.geoJSON(geoJSON);
                let coords = geoJSON.geometry ? [geoJSON.geometry.coordinates] : geoJSON.features[0].geometry.coordinates;
                const countArrayLevels = countNestedLevels(coords);

                if (countArrayLevels === 5) {
                    coords = fixedCoordsArray(coords);
                }

                const center = polygon.getBounds().getCenter();
                const newCenter = e.latlng;
                const differenceLat = newCenter.lat - center.lat;
                const differenceLng = newCenter.lng - center.lng;
                const newPolygonsGeometry = [];

                if (coords.length > 1) {
                    coords.forEach(function (innerCoordArray) {
                        const newCoords = innerCoordArray.flatMap(subCoordArray =>
                            subCoordArray.map(coord => [coord[1] + differenceLat, coord[0] + differenceLng])
                        );

                        const newPolyGeometry = L.polygon(newCoords).toGeoJSON().geometry;
                        newPolygonsGeometry.push(newPolyGeometry);
                    });

                    const mergedGeometry = newPolygonsGeometry.reduce((merged, polyGeometry) =>
                        turf.union(merged, polyGeometry)
                    );
                    const mergedPolygons = L.geoJSON(mergedGeometry).addTo(map);
                    mergedPolygons.setStyle({
                        fillColor: optionsSoucePolygon.fillColor,
                        color: optionsSoucePolygon.color,
                        fillOpacity: optionsSoucePolygon.fillOpacity,
                        weight: optionsSoucePolygon.weight
                    });
                    CreateEl(mergedPolygons, 'Polygon');
                    mergedPolygons.options.is_copy_polygons = true;

                    if (optionsSoucePolygon && !optionsSoucePolygon.isGrid && optionsSoucePolygon.width) {
                        const value = optionsSoucePolygon.width;
                        AddArea(mergedPolygons, value, null);
                    }

                    if (optionsSoucePolygon && optionsSoucePolygon.isGrid && !optionsSoucePolygon.width) {
                        const value = optionsSoucePolygon.value;
                        AddGrid(mergedPolygons, value);
                    }

                    if (optionsSoucePolygon && optionsSoucePolygon.isGrid && optionsSoucePolygon.width) {
                        const options = {
                            isGrid: optionsSoucePolygon.isGrid,
                            originalGeometry: mergedPolygons.toGeoJSON().features[0],
                            value: optionsSoucePolygon.value,
                            width: optionsSoucePolygon.width,
                        };
                        Object.assign(mergedPolygons.options, options);
                        const value = optionsSoucePolygon.width;
                        AddArea(mergedPolygons, value, null);
                    }

                } else {
                    const newCoords = coords[0][0].map(coord =>
                        [coord[1] + differenceLat, coord[0] + differenceLng]
                    );
                    const newPoly = L.polygon(newCoords).addTo(map);
                    newPoly.setStyle({
                        fillColor: optionsSoucePolygon.fillColor,
                        color: optionsSoucePolygon.color,
                        fillOpacity: optionsSoucePolygon.fillOpacity,
                        weight: optionsSoucePolygon.weight
                    });
                    CreateEl(newPoly, 'Polygon');

                    if (optionsSoucePolygon && optionsSoucePolygon.width) {
                        const value = optionsSoucePolygon.width;
                        AddArea(newPoly, value, null);
                    }
                }
            })
            .catch(err => {
                console.log('Something went wrong', err);
            });
        contextMenu.remove();
    });
});


function fixedCoordsArray(coordinates) {
    if (coordinates.length !== 1) {
        return coordinates;
    }

    let fixedCoords = coordinates[0];
    while (Array.isArray(fixedCoords) && fixedCoords.length === 1) {
        fixedCoords = fixedCoords[0];
    }

    return fixedCoords;
}

function countNestedLevels(arr) {
    let maxDepth = 0;

    function calculateDepth(array, depth) {
        if (!Array.isArray(array) || array.length === 0) {
            maxDepth = Math.max(maxDepth, depth);
            return;
        }

        for (let i = 0; i < array.length; i++) {
            calculateDepth(array[i], depth + 1);
        }
    }

    calculateDepth(arr, 0);

    return maxDepth;
}


const customControl = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-pm-custom-toolbar leaflet-bar leaflet-control');

        const buttons = [
            {title: 'Включить линейку', iconClass: 'bi bi-rulers', id: 'btnTurnRuler'},
            {title: 'Добавить кадастровый номер', iconClass: 'bi bi-pencil-square', modalId: '#addCadastralModal'},
            {title: 'Построить полигон', iconClass: 'bi bi-plus-square', modalId: '#createPolygonModal'},
            {title: 'Выгрузить данные в заявку', iconClass: 'bi bi-upload', modalId: '#uploadDataModal'}
        ];

        buttons.forEach(button => {
            const buttonContainer = L.DomUtil.create('div', 'button-container', container);
            const buttonElement = L.DomUtil.create('a', 'leaflet-buttons-control-button', buttonContainer);
            const iconElement = L.DomUtil.create('i', button.iconClass, buttonElement);

            buttonElement.setAttribute('title', button.title);
            if (button.id === 'btnTurnRuler') {
                const divElement = L.DomUtil.create('div', 'leaflet-pm-actions-container', buttonContainer);
                divElement.style.display = 'none';
                const linkElement = L.DomUtil.create('a', 'leaflet-pm-action action-finishMode', divElement);
                linkElement.setAttribute('role', 'button');
                linkElement.setAttribute('tabindex', '0');
                linkElement.setAttribute('href', '#');
                linkElement.innerText = 'Завершить';

                buttonElement.addEventListener('click', function () {
                    if (divElement.style.display === 'none') {
                        divElement.style.display = 'block';
                        turnRuler();
                    } else {
                        divElement.style.display = 'none'
                    }
                });
            } else {
                buttonElement.addEventListener('click', function () {
                    $(button.modalId).modal('show');
                });
            }
        });

        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});

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
        showCanvasButton.addEventListener('click', toggleCanvas);

        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});

map.addControl(new customControl());
map.addControl(new offCanvasControl());


function turnRuler() {
    const createdLayers = getCreatedLayers();
    const coords = [];

    createdLayers.forEach(layer => {
        const layerGeometry = getLayerGeometry(layer).coordinates;
        const targetDegree = 3;
        const nestedLevel = countNestedLevels(layerGeometry);
        let normalizedCoordinates;

        if (nestedLevel > targetDegree) {
            normalizedCoordinates = layerGeometry.flat();
        } else if (nestedLevel === targetDegree) {
            normalizedCoordinates = layerGeometry;
        } else {
            normalizedCoordinates = [layerGeometry];
        }

        normalizedCoordinates.forEach(coordinate => {
            coordinate.forEach(points => {
                coords.push(points);
            });
        });
    });

    const createMarker = (latlng) => {
        return L.circleMarker(latlng, {
            color: '#3388ff',
            fillColor: 'white',
            fillOpacity: 1,
            radius: 5
        }).addTo(map);
    };

    let marker = null;
    let line = null;
    let popup = null;
    let textMarker = null;
    const markers = [];

    const handleMouseMove = (e) => {
        if (marker) {
            line.setLatLngs([marker.getLatLng(), e.latlng]);
            popup.setLatLng(e.latlng);
            const lineLength = line.getLatLngs()[1].distanceTo(marker.getLatLng());
            popup.setContent('Длина линии: ' + lineLength.toFixed(2) + ' м');

            const textMarkerLatLng = L.latLng(
                (line.getLatLngs()[0].lat + line.getLatLngs()[1].lat) / 2,
                (line.getLatLngs()[0].lng + line.getLatLngs()[1].lng) / 2
            );
            textMarker.setLatLng(textMarkerLatLng);
            textMarker.getElement().innerHTML = '<span class="line-length">' + lineLength.toFixed(2) + '</span> <span class="unit">м</span>';
        }

        let closestCoord = null;
        let minDistance = Infinity;

        coords.forEach(coord => {
            const coordLatLng = L.latLng(coord[1], coord[0]);
            const distance = coordLatLng.distanceTo(e.latlng);
            if (distance < minDistance && distance < 5) {
                minDistance = distance;
                closestCoord = coordLatLng;
            }
        });

        if (closestCoord) {
            console.log('Приближение к координате:', closestCoord);
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = 'pointer';
        }
    };

    const handleClick = (e) => {
        const existingMarker = markers.find((m) => m.getLatLng().equals(e.latlng));
        if (existingMarker) {
            map.off('click', handleClick);
            map.off('mousemove', handleMouseMove);
            textMarker.remove();
            return;
        }

        let closestCoord = null;
        let minDistance = Infinity;

        coords.forEach(coord => {
            const coordLatLng = L.latLng(coord[1], coord[0]);
            const distance = coordLatLng.distanceTo(e.latlng);
            if (distance < minDistance && distance < 5) {
                minDistance = distance;
                closestCoord = coordLatLng;
            }
        });

        if (closestCoord) {
            marker = createMarker(closestCoord);
        } else {
            marker = createMarker(e.latlng);
        }

        markers.push(marker);

        line = L.polyline([marker.getLatLng(), e.latlng], {
            color: '#3388ff'
        }).addTo(map);

        const lineLength = line.getLatLngs()[1].distanceTo(marker.getLatLng());
        popup = L.popup({
            closeButton: false,
            autoPan: false
        }).setContent('Длина линии: ' + lineLength.toFixed(2) + ' м');

        const textIcon = L.divIcon({
            className: 'text-icon',
            html: '<span class="line-length">0.00</span> <span class="unit">м</span>'
        });

        const textMarkerLatLng = L.latLng(
            (line.getLatLngs()[0].lat + line.getLatLngs()[1].lat) / 2,
            (line.getLatLngs()[0].lng + line.getLatLngs()[1].lng) / 2
        );
        textMarker = L.marker(textMarkerLatLng, {icon: textIcon})
            .addTo(map);
        textMarker.getElement().style.fontSize = '14px';

        marker.bindPopup(popup).openPopup();

        const markerCoords = [e.latlng.lng, e.latlng.lat];
        coords.push(markerCoords);
    };

    const handleButtonClick = () => {
        map.off('mousemove', handleMouseMove);
        map.off('click', handleClick);
        if (line) line.remove();
        if (textMarker) textMarker.remove();
        if (textMarker) popup.remove();
        divContainer.style.display = 'none';
    };

    const divWithButton = document.querySelector('a.leaflet-buttons-control-button[title="Включить линейку"]').parentElement;
    const divContainer = divWithButton.querySelector('div.leaflet-pm-actions-container');
    const button = divContainer.querySelector('a.leaflet-pm-action.action-finishMode');
    button.addEventListener('click', handleButtonClick);

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);

    function getLayerGeometry(layer) {
        const layerGeoJSON = layer.toGeoJSON();
        return layerGeoJSON.features ? layerGeoJSON.features[0].geometry : layerGeoJSON.geometry;
    }

    function getCreatedLayers() {
        const createdLayers = [];
        map.eachLayer(function (layer) {
            if (layer.options && layer.options.is_user_create === true) {
                createdLayers.push(layer);
            }
        });
        return createdLayers;
    }
}

function createRectangle() {
    const lengthInput = document.getElementById('lengthInput');
    const widthInput = document.getElementById('widthInput');

    const length = parseFloat(lengthInput.value);
    const width = parseFloat(widthInput.value);

    if (isNaN(length) || isNaN(width)) {
        alert('Некорректные значения для длины и/или ширины');
        return;
    }

    const center = map.getCenter();
    const metersPerDegree = 111300;
    const {lat, lng} = center;
    const lengthDegrees = length / (metersPerDegree * Math.cos(lat * Math.PI / 180));
    const widthDegrees = width / metersPerDegree;

    const southWest = L.latLng(lat - widthDegrees / 2, lng - lengthDegrees / 2);
    const northWest = L.latLng(lat + widthDegrees / 2, lng - lengthDegrees / 2);
    const northEast = L.latLng(lat + widthDegrees / 2, lng + lengthDegrees / 2);
    const southEast = L.latLng(lat - widthDegrees / 2, lng + lengthDegrees / 2);

    var polygon = L.polygon([southWest, northWest, northEast, southEast]);
    polygon.addTo(map);

    map.fitBounds(polygon.getBounds());

    polygon.options.isRectangle = true;

    CreateEl(polygon, 'Polygon');

    lengthInput.value = '';
    widthInput.value = '';
}

var stepValue;

function CreateEl(layer, type) {
    const layerId = layer._leaflet_id;
    let flag = 1;
    let el = `<div><a type="button" id="copyGEOJSON_${layerId}">Копировать элемент</a></div>`;
    var cutArea = 0;
    var newPoly;

    if (type === 'Circle' || type === 'Polygon' || type === 'Rectangle') {
        layer.on('contextmenu', function (e) {
            const myLat = e.latlng['lat']
            const myLng = e.latlng['lng']
            const content = `${el} 
            <div><a type="button" id="btnAddGrid_${layerId}"${layer.options.isGrid ? ' style="display: none"' : ''}>Добавить сетку</a></div>
            <div class="mb-3" id="addGrid_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="gridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title=" " placeholder="Шаг сетки в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendGridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title=" " style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>

            <div><a type="button" id="btnChangeGrid_${layerId}"${!layer.options.isGrid ? ' style="display: none"' : ''}>Изменить сетку</a></div>
            <div class="mb-3" id="сhangeGrid_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="сhangeGridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" placeholder="Шаг сетки в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnChangeGridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>

            <div class="mb"><a type="button" id="btnAddArea_${layerId}">Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnCutArea_${layerId}">Вырезать часть полигона</a></div>
            <div class="mb-3" id="CutArea_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="AreaWidth_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                <input type="text" class="form-control form-control-sm" id="AreaLenght_${layerId}" placeholder="Высота полигона" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendCutArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnChangeSize_${layerId}" style="${layer.options.isRectangle ? '' : 'display: none'}">Изменить размер полигона</a></div>
            <div class="mb-3" id="ChangeSize_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="PolygonWidth_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                <input type="text" class="form-control form-control-sm" id="PolygonHeight_${layerId}" placeholder="Высота полигона" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeSize_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>
          
            <div><a type="button" id="btnUnionPolygons_${layerId}">Объединить полигоны</a></div>        
            <div id="unionPolygons_${layerId}" style="display: none">
                <div><a type="button" id="btnUnionPolygons1_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" style="margin: 10px 0 0 10px;">Объеднить в блок</a></div>
                <div><a type="button" id="btnUnionPolygons2_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" style="margin: 10px 0 0 10px;">Метод выпуклой оболочки</a></div>
                <div><a type="button" id="btnUnionPolygons3_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" style="margin: 10px 0 0 10px;">Объединить по вершинам</a></div>
            </div>        
            <div><a type="button" id="" onclick="changePolygonColor(${layerId}, '${type}')">Изменить цвет</a></div>
            
            <div><a type="button" id="btnPolygonCalculations_${layerId}" style="${type === 'Circle' ? 'display: none' : ''}">Вычисления</a></div>        
            <div id="polygonCalculations_${layerId}" style="display: none">
                <div><a type="button" id="btnFindLengthSide_${layerId}" style="margin: 10px 0 0 10px;">Найти длину стороны</a></div>
            </div>

            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`
            const contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddAreaFunc(layer, layerId, contextMenu)
            AddGridFunc(layer, layerId, contextMenu, e);
            AddChangeGridFunc(layer, layerId, contextMenu, e);
            AddCopyGeoJSONFunc(layer, layerId, contextMenu);
            AddUnionPolygonFunc(layer, layerId, contextMenu);
            AddChangePolygonSizeFunc(layer, layerId, contextMenu);

            document.getElementById(`btnCutArea_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`CutArea_${layerId}`);
                div.style.display = 'block';
            });

            document.getElementById(`btnSendCutArea_${layerId}`).addEventListener('click', function () {
                const length = document.getElementById(`AreaWidth_${layerId}`).value;
                const width = document.getElementById(`AreaLenght_${layerId}`).value;

                if (isNaN(length) || isNaN(width)) {
                    alert('Некорректные значения для длины и/или ширины');
                    return;
                }
                const metersPerDegree = 111300;
                const {lat, lng} = contextMenu._latlng;
                ;
                const lengthDegrees = length / (metersPerDegree * Math.cos(lat * Math.PI / 180));
                const widthDegrees = width / metersPerDegree;

                const southWest = L.latLng(lat - widthDegrees / 2, lng - lengthDegrees / 2);
                const northWest = L.latLng(lat + widthDegrees / 2, lng - lengthDegrees / 2);
                const northEast = L.latLng(lat + widthDegrees / 2, lng + lengthDegrees / 2);
                const southEast = L.latLng(lat - widthDegrees / 2, lng + lengthDegrees / 2);

                const polygon = L.polygon([southWest, northWest, northEast, southEast]);
                try {
                    newPoly = L.geoJSON(turf.difference(layer.toGeoJSON().geometry, polygon.toGeoJSON().geometry))
                } catch {
                    newPoly = L.geoJSON(turf.difference(layer.toGeoJSON().features[0].geometry, polygon.toGeoJSON().geometry))
                }
                newPoly.addTo(map)

                var coords = newPoly.toGeoJSON().features[0].geometry.coordinates
                for (i = 1; i < coords.length; i++) {
                    var poly = L.polygon(coords[i])
                    cutArea += Number((turf.area(poly.toGeoJSON()) / 10000).toFixed(3))
                }
                newPoly.options.cutArea = cutArea;

                if (layer.options.isGrid) {
                    AddGrid(newPoly, layer.options.value);
                    newPoly.remove()
                } else {
                    CreateEl(newPoly, 'Polygon');
                }
                document.getElementById(layer._leaflet_id).remove()
                layer.remove();
                contextMenu.remove();
            });

            document.getElementById(`btnPolygonCalculations_${layerId}`).addEventListener('click', () => {
                const div = document.getElementById(`polygonCalculations_${layerId}`);
                if (div.style.display === 'none') {
                    div.style.display = 'block';
                } else {
                    div.style.display = 'none';
                }
            });

            document.getElementById(`btnFindLengthSide_${layerId}`).addEventListener('click', function () {
                findPolygonLengthSide(layerId);
                contextMenu.remove();
            });
        });
    } else if (type === 'Line') {
        layer.on('contextmenu', function (e) {
            if (cross) {
                cross.remove();
            }
            const myLat = e.latlng['lat']
            const myLng = e.latlng['lng']
            const content = `${el}
            <div><a type="button" id="btnAddStep_${layerId}">Добавить маркеры</a></div>
            <div id="addStep_${layerId}" style="display: none;">
                <input type="text" class="form-control form-control-sm" id="StepValue_${layerId}" placeholder="Добавить шаг" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnAddMarkers_${layerId}" style="margin: 5px 0 0 10px; height: 20px; display: flex; align-items: center;">Добавить</button>
            </div>
            <div><a type="button" id="btnAddArea_${layerId}">Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                        <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                        <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
                    </div>
            <div><a type="button" id="" onclick="changePolygonColor(${layerId}, '${type}')">Изменить цвет</a></div>
            <div><a type="button" id="btnContinueLine_${layerId}">Продолжить линию</a></div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`;
            const contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddAreaFunc(layer, layerId, contextMenu);

            document.getElementById(`btnAddMarkers_${layerId}`).addEventListener('click', function () {
                if (flag) {
                    stepValue = document.getElementById(`StepValue_${layerId}`).value;
                    addMarkersToPolyline(layer, stepValue);
                    flag--;
                }
            });

            document.getElementById(`btnAddStep_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`addStep_${layerId}`);
                div.style.display = div.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`btnContinueLine_${layerId}`).addEventListener('click', function () {
                continueLine(layer, contextMenu);
            });
        });
    } else if (type === 'CircleMarker') {
        layer.on('contextmenu', function (e) {
            if (cross) {
                cross.remove();
            }
            const myLat = e.latlng['lat']
            const myLng = e.latlng['lng']
            const content = `${el}
            <div><a type="button" id="" onclick="changePolygonColor(${layerId}, '${type}')">Изменить цвет</a></div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>
            <div><a type="button" id="addNameInfo_${layerId}">Добавить название и описание</a></div>

            <div class="mb-3" id="addInfo${layerId}" style="display: none">
            <input type="text" class="form-control form-control-sm" id="NameObject_${layerId}" placeholder="Название объекта" style="margin-left: 10px;">
            <input type="text" class="form-control form-control-sm" id="InfoObject_${layerId}" placeholder="Описание объекта" style="margin-left: 10px;">
            <button type="button" class="btn btn-light btn-sm" id="btnNameInfoObject_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
        </div>`;
            const contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            document.getElementById(`addNameInfo_${layerId}`).addEventListener('click', function () {
                const divInfo = document.getElementById(`addInfo${layerId}`);
                divInfo.style.display = divInfo.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`btnNameInfoObject_${layerId}`).addEventListener('click', function () {
                const nameObject = document.getElementById(`NameObject_${layerId}`).value;
                const infoObject = document.getElementById(`InfoObject_${layerId}`).value;
                document.getElementById(`buildingName_${layerId}`).value = nameObject;
                document.getElementById(`buildingDescription_${layerId}`).value = infoObject;
                const center = layer.getLatLng();
                contextMenu.remove()
                const contextInfoMenu = L.popup({closeButton: true, offset: L.point(0, -10)})
                    .setLatLng(center)
                    .setContent(`№: ${mapObjects[type]['number'] - 1}</b><br>Название объекта: ${nameObject}<br>Описание объекта: ${infoObject}`);
                contextInfoMenu.openOn(map);
            });
        });
    } else if (type == 'Marker') {
        layer.on('contextmenu', function (e) {
            if (cross) {
                cross.remove();
            }
            const myLat = e.latlng['lat']
            const myLng = e.latlng['lng']
            const content = `${el} 
            <div><a type="button" id="btnAddArea_${layerId}">Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                        <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                        <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
                    </div>
            <div><a type="button" id="btnAddCircle_${layerId}">Добавить окружность</a></div>
            <div class="mb-3" id="addACircle_${layerId}" style="display: none">
                        <input type="text" class="form-control form-control-sm" id="CircleAreaValue_${layerId}" placeholder="Ширина окружности" style="margin-left: 10px;">
                        <button type="button" class="btn btn-light btn-sm" id="btnSendCircleArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
                    </div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>

            <div><a type="button" id="addNameInfo_${layerId}">Добавить название и описание</a></div>

            <div class="mb-3" id="addInfo${layerId}" style="display: none">
            <input type="text" class="form-control form-control-sm" id="NameObject_${layerId}" placeholder="Название объекта" style="margin-left: 10px;">
            <input type="text" class="form-control form-control-sm" id="InfoObject_${layerId}" placeholder="Описание объекта" style="margin-left: 10px;">
            <button type="button" class="btn btn-light btn-sm" id="btnNameInfoObject_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
        </div>`;
            const contextMenu = L.popup({closeButton: true})
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);
            AddAreaFunc(layer, layerId, contextMenu)

            document.getElementById(`btnAddCircle_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`addACircle_${layerId}`);
                div.style.display = div.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`addNameInfo_${layerId}`).addEventListener('click', function () {
                const divInfo = document.getElementById(`addInfo${layerId}`);
                divInfo.style.display = divInfo.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`btnNameInfoObject_${layerId}`).addEventListener('click', function () {
                const nameObject = document.getElementById(`NameObject_${layerId}`).value;
                const infoObject = document.getElementById(`InfoObject_${layerId}`).value;
                document.getElementById(`buildingName_${layerId}`).value = nameObject;
                document.getElementById(`buildingDescription_${layerId}`).value = infoObject;
                const center = layer.getLatLng();
                contextMenu.remove()
                const contextInfoMenu = L.popup({closeButton: true, offset: L.point(0, -20)})
                    .setLatLng(center)
                    .setContent(`№: ${mapObjects[type]['number'] - 1}</b><br>Название объекта: ${nameObject}<br>Описание объекта: ${infoObject}`);
                contextInfoMenu.openOn(map);
            });

            document.getElementById(`btnSendCircleArea_${layerId}`).addEventListener('click', function () {
                const value = document.getElementById(`CircleAreaValue_${layerId}`).value;
                const center = layer.getLatLng();
                L.circle(center, {radius: value}).addTo(map)
                contextMenu.remove()
            });
        });
    }
    if (newPoly) {
        layer = newPoly
        layer.options.cutArea = cutArea;
    }
    fg.addLayer(layer);
    layer.options.is_user_create = true;
    writeAreaOrLengthInOption(layer, type);
    createSidebarElements(layer, type);
    AddEditArea(layer)
}

function findPolygonLengthSide(layerId) {
    const layer = map._layers[layerId];
    const lines = [];

    const layerGeometry = getLayerGeometry(layer).coordinates;
    const targetDegree = 3;

    const normalizedCoordinates = countNestedLevels(layerGeometry) > targetDegree
        ? layerGeometry.flat()
        : layerGeometry;

    normalizedCoordinates.forEach(subArray => {
        for (let i = 0; i < subArray.length; i++) {
            const vertex = subArray[i];
            const [lng, lat] = vertex;
            subArray[i] = [lat, lng];
        }

        for (let i = 0; i < subArray.length - 1; i++) {
            const currentVertex = subArray[i];
            const nextVertex = subArray[i + 1];
            const line = L.polyline([currentVertex, nextVertex], {color: 'red'}).addTo(map);
            lines.push(line);

            line.on('click', function (e) {
                L.DomEvent.stopPropagation(e);
                line.setStyle({color: 'green'});
                const length = turf.length(line.toGeoJSON(), {units: 'meters'}).toFixed(2);
                line.bindPopup(`${length} м`).openPopup();
            });

            line.on('mouseover', function (e) {
                this.getElement().classList.add('line-cursor');
            });

            line.on('mouseout', function (e) {
                this.getElement().classList.remove('line-cursor');
            });
        }
    });

    map.on('click', function (e) {
        lines.forEach(line => {
            map.removeLayer(line);
        });
        lines.length = 0;
    });

    function getLayerGeometry(layer) {
        const layerGeoJSON = layer.toGeoJSON();

        return layerGeoJSON.features ? layerGeoJSON.features[0].geometry : layerGeoJSON.geometry;
    }
}


function changePolygonColor(layerId, type) {
    const layer = map._layers[layerId];
    const currentOpacity = (layer.pm._layers && layer.pm._layers[0] ? layer.pm._layers[0].options.fillOpacity : layer.options.fillOpacity) * 100;
    const currentWeight = layer.pm._layers && layer.pm._layers[0] ? layer.pm._layers[0].options.weight : layer.options.weight;

    const el = `
    ${
        type !== 'Line'
            ? `
        <div class="mb-3" id="slider-container">
          <label for="fill-opacity-slider" class="form-label">Прозрачность заливки полигона</label>
          <div class="fill-slider-input-wrapper">
            <input type="range" class="form-range" id="fill-opacity-slider" min="0" max="100" value="${currentOpacity}">
            <input type="text" class="form-control" id="fill-opacity-input" value="${currentOpacity}" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
            <span class="percent-symbol" style="margin-right: 5px;">%</span>
            <div class="color-button" id="fill-color-button"></div>
          </div>
        </div>
        `
            : ``
    }
    <div class="mb-3" id="border-weight-container">
      <label for="border-weight-slider" class="form-label">Толщина границы полигона</label>
      <div class="border-slider-input-wrapper">
        <input type="range" class="form-range" id="border-weight-slider" min="1" max="10" value="${currentWeight}">
        <input type="text" class="form-control" id="border-weight-input" value="${currentWeight}" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
        <span class="weight-symbol" style="margin-right: 5px;">px</span>
        <div class="color-button" id="border-color-button"></div>
      </div>
    </div>`;

    // Создание всплывающего окна
    const popup = L.popup({
        closeButton: true,
        className: 'custom-popup'
    })
        .setLatLng(map.getCenter())
        .setContent(el)
        .openOn(map);

    const fillOpacitySlider = document.getElementById('fill-opacity-slider');
    const fillOpacityInput = document.getElementById('fill-opacity-input');
    const borderWeightSlider = document.getElementById('border-weight-slider');
    const borderWeightInput = document.getElementById('border-weight-input');
    const fillColorButton = document.getElementById('fill-color-button');
    const borderColorButton = document.getElementById('border-color-button');

    let fillPickr;
    if (type !== 'Line') {
        fillPickr = createPalette(fillColorButton, layer, 'fill');
    }
    const borderPickr = createPalette(borderColorButton, layer, 'border');

    // Обновление значения ползунка и поля с процентами для прозрачности заливки
    function updateFillOpacity(value) {
        fillOpacitySlider.value = value;
        fillOpacityInput.value = value;
        const opacity = value / 100; // Преобразование значения в прозрачность
        layer.setStyle({fillOpacity: opacity}); // Обновление стиля слоя
    }

    // Обновление значения ползунка и поля с толщиной для границы полигона
    function updateBorderWeight(value) {
        borderWeightSlider.value = value;
        borderWeightInput.value = value;
        layer.setStyle({weight: value}); // Обновление стиля слоя
    }

    if (type !== 'Line') {
        // Обновление значений при изменении положения ползунка для прозрачности заливки
        fillOpacitySlider.addEventListener('input', function () {
            const value = parseInt(fillOpacitySlider.value);
            updateFillOpacity(value);
        });

        // Обновление значений при изменении в поле для прозрачности заливки
        fillOpacityInput.addEventListener('input', function () {
            const value = parseInt(fillOpacityInput.value);
            if (!isNaN(value) && value >= 0 && value <= 100) {
                updateFillOpacity(value);
            }
        });

        // Остановка распространения события mousedown на ползунке прозрачности заливки
        fillOpacitySlider.addEventListener('mousedown', function (event) {
            event.stopPropagation();
        });
    }

    // Обновление значений при изменении положения ползунка для толщины границы
    borderWeightSlider.addEventListener('input', function () {
        const value = parseInt(borderWeightSlider.value);
        updateBorderWeight(value);
    });

    // Обновление значений при изменении в поле для толщины границы
    borderWeightInput.addEventListener('input', function () {
        const value = parseInt(borderWeightInput.value);
        if (!isNaN(value) && value >= 1 && value <= 10) {
            updateBorderWeight(value);
        }
    });

    // Остановка распространения события mousedown на ползунке толщины границы
    borderWeightSlider.addEventListener('mousedown', function (event) {
        event.stopPropagation();
    });

    // Включение перетаскивания для всплывающего окна
    L.DomUtil.addClass(popup._container, 'leaflet-draggable');
    L.DomEvent.on(popup._container, 'mousedown', function (e) {
        popup._dragStart = map.mouseEventToLatLng(e);
        L.DomEvent.on(document, 'mousemove', popup._drag, popup);
        L.DomEvent.on(document, 'mouseup', popup._dragEnd, popup);
    }, popup);
    popup.on('remove', function () {
        L.DomEvent.off(document, 'mouseup', popup._dragEnd, popup);
    });
    popup._drag = function (e) {
        const newPos = map.mouseEventToLatLng(e);
        const latlng = {
            lat: this._latlng.lat + newPos.lat - this._dragStart.lat,
            lng: this._latlng.lng + newPos.lng - this._dragStart.lng
        };
        this.setLatLng(latlng);
        this._dragStart = newPos;
    };
    popup._dragEnd = function () {
        L.DomEvent.off(document, 'mousemove', this._drag, this);
    };
}

function AddChangePolygonSizeFunc(layer, layerId, contextMenu) {
    const btnChangeSize = document.getElementById(`btnChangeSize_${layerId}`);
    btnChangeSize.addEventListener('click', () => {
        const div = document.getElementById(`ChangeSize_${layerId}`);
        if (div.style.display === 'none') {
            div.style.display = 'block';

            $(`#PolygonWidth_${layerId}`).mask("9999.99", {placeholder: "Ширина полигона"});
            $(`#PolygonHeight_${layerId}`).mask("9999.99", {placeholder: "Высота полигона"});

            const widthInput = document.getElementById(`PolygonWidth_${layerId}`);
            const heightInput = document.getElementById(`PolygonHeight_${layerId}`);
            const button = document.getElementById(`btnSendChangeSize_${layerId}`);

            widthInput.addEventListener("input", enableButton);
            heightInput.addEventListener("input", enableButton);

            function enableButton() {
                const widthValue = widthInput.value.trim();
                const heightValue = heightInput.value.trim();

                button.disabled = !(widthValue && heightValue && widthValue !== "." && heightValue !== ".");
            }
        } else {
            div.style.display = 'none';
        }
    });

    const btnSendChangeSize = document.getElementById(`btnSendChangeSize_${layerId}`);
    btnSendChangeSize.addEventListener('click', function () {
        const widthInput = document.getElementById(`PolygonWidth_${layerId}`);
        const heightInput = document.getElementById(`PolygonHeight_${layerId}`);
        const widthValue = widthInput.value.trim();
        const heightValue = heightInput.value.trim();
        changePolygonSize(layer, widthValue, heightValue);
        contextMenu.remove();
    });
}

function AddGridFunc(layer, layerId, contextMenu, e) {
    let recommendedGridStep;
    const inputGrid = document.getElementById(`gridValue_${layerId}`);
    const btnSendGridValue = document.getElementById(`btnSendGridValue_${layerId}`);

    document.getElementById(`btnAddGrid_${layerId}`).addEventListener('click', function () {
        const div = document.getElementById(`addGrid_${layerId}`);
        const inputElement = document.getElementById("gridValue_" + layerId);

        if (div.style.display === 'none') {
            recommendedGridStep = calculateRecommendedGridStep(layer);
            inputElement.dataset.bsTitle = `Рекомендованный минимальный шаг сетки ${recommendedGridStep} м`;
            div.style.display = 'block';

            new bootstrap.Tooltip(inputElement);

            $(`#gridValue_${layerId}`).mask("9999.99", {placeholder: "Шаг сетки в метрах"});
        } else {
            div.style.display = 'none';
        }
    });

    inputGrid.addEventListener('input', function () {
        const inputElementValue = inputGrid.value.trim();
        const isNumeric = /^-?\d*\.?\d*$/.test(inputElementValue);

        if (inputElementValue && isNumeric && inputElementValue !== ".") {
            btnSendGridValue.disabled = false;
            if (parseFloat(inputElementValue) < parseFloat(recommendedGridStep)) {
                btnSendGridValue.setAttribute('data-bs-title', `Обратите внимание, что возможна задержка при отрисовке полигона. Чтобы снизить нагрузку на сервер, советуем использовать шаг сетки не менее рекомендованного.`);
                new bootstrap.Tooltip(btnSendGridValue);
            } else {
                btnSendGridValue.removeAttribute('data-bs-title');
                const btnSendGridValueTooltip = bootstrap.Tooltip.getInstance(btnSendGridValue);
                if (btnSendGridValueTooltip) {
                    btnSendGridValueTooltip.dispose();
                }
            }
        } else {
            btnSendGridValue.disabled = true;
        }
    });

    document.getElementById(`btnSendGridValue_${layerId}`).addEventListener('click', function () {
        const value = document.getElementById(`gridValue_${layerId}`).value;
        AddGrid(e.target, value, layer);
        contextMenu.remove();
    });
}

function AddChangeGridFunc(layer, layerId, contextMenu, e) {
    let recommendedGridStep;
    const inputChangeGrid = document.getElementById(`сhangeGridValue_${layerId}`);
    const btnChangeGridValue = document.getElementById(`btnChangeGridValue_${layerId}`);

    document.getElementById(`btnChangeGrid_${layerId}`).addEventListener('click', function () {
        const div = document.getElementById(`сhangeGrid_${layerId}`);
        const inputElement = document.getElementById("сhangeGridValue_" + layerId);

        if (div.style.display === 'none') {
            recommendedGridStep = calculateRecommendedGridStep(layer);
            inputElement.dataset.bsTitle = `Рекомендованный минимальный шаг сетки ${recommendedGridStep} м`;
            div.style.display = 'block';

            new bootstrap.Tooltip(inputElement);

            $(`#сhangeGridValue_${layerId}`).mask("9999.99", {placeholder: "Шаг сетки в метрах"});
        } else {
            div.style.display = 'none';
        }
    });

    inputChangeGrid.addEventListener('input', function () {
        const inputElementValue = inputChangeGrid.value.trim();
        const isNumeric = /^-?\d*\.?\d*$/.test(inputElementValue);

        if (inputElementValue && isNumeric && inputElementValue !== ".") {
            btnChangeGridValue.disabled = false;
            if (parseFloat(inputElementValue) < parseFloat(recommendedGridStep)) {
                btnChangeGridValue.setAttribute('data-bs-title', `Обратите внимание, что возможна задержка при отрисовке полигона. Чтобы снизить нагрузку на сервер, советуем использовать шаг сетки не менее рекомендованного.`);
                new bootstrap.Tooltip(btnChangeGridValue);
            } else {
                btnChangeGridValue.removeAttribute('data-bs-title');
                const btnChangeGridValueTooltip = bootstrap.Tooltip.getInstance(btnChangeGridValue);
                if (btnChangeGridValueTooltip) {
                    btnChangeGridValueTooltip.dispose();
                }
            }
        } else {
            btnChangeGridValue.disabled = true;
        }
    });

    document.getElementById(`btnChangeGridValue_${layerId}`).addEventListener('click', function () {
        const value = document.getElementById(`сhangeGridValue_${layerId}`).value;
        AddGrid(e.target, value, layer);
        contextMenu.remove();
    });
}

function AddCopyGeoJSONFunc(layer, layerId, contextMenu) {
    document.getElementById(`copyGEOJSON_${layerId}`).addEventListener('click', function () {
        const options = {};
        if (layer.options.added_external_polygon_width) {
            options.width = layer.options.added_external_polygon_width;
        }
        if (layer.options.isGrid) {
            options.isGrid = layer.options.isGrid;
            options.value = layer.options.value;
        }

        const pmLayer = layer.pm._layers && layer.pm._layers[0];
        const color = pmLayer ? pmLayer.options.color : layer.options.color;
        let fillColor = pmLayer ? pmLayer.options.fillColor : layer.options.fillColor;
        const fillOpacity = pmLayer ? pmLayer.options.fillOpacity : layer.options.fillOpacity;
        const weight = pmLayer ? pmLayer.options.weight : layer.options.weight;

        if (fillColor === null) {
            fillColor = color;
        }

        options.color = color;
        options.fillColor = fillColor;
        options.fillOpacity = fillOpacity;
        options.weight = weight;

        const polygon = [layer.toGeoJSON(), options];
        const stringGeoJson = JSON.stringify(polygon);
        navigator.clipboard.writeText(stringGeoJson)
            .then(() => {
                console.log('Copy')
            })
            .catch(err => {
                console.log('Something went wrong', err);
            });
        contextMenu.remove()
    });
}

function AddUnionPolygonFunc(layer, layerId, contextMenu) {
    const btnUnionPolygons1 = document.getElementById(`btnUnionPolygons1_${layerId}`);
    const btnUnionPolygons2 = document.getElementById(`btnUnionPolygons2_${layerId}`);
    const btnUnionPolygons3 = document.getElementById(`btnUnionPolygons3_${layerId}`);

    document.getElementById(`btnUnionPolygons_${layerId}`).addEventListener('click', function () {
        const div = document.getElementById(`unionPolygons_${layerId}`);
        div.style.display = div.style.display === 'none' ? 'block' : 'none';
        if (div.style.display === 'block') {
            btnUnionPolygons1.setAttribute('data-bs-title', `Подходит для сложных геометрических объектов. Объединяет полигоны в блок, сохраняя их геометрию.`);
            btnUnionPolygons2.setAttribute('data-bs-title', `Подходит для простых геометрических объектов. Использует алгоритм выпуклой оболочки, чтобы объединить полигоны вместе, исходя из формы и расположения их угловых точек.`);
            btnUnionPolygons3.setAttribute('data-bs-title', `Подходит для сложных геометрических объектов. Для объединения последовательно кликните на 4 вершины полигонов.`);
            new bootstrap.Tooltip(btnUnionPolygons1);
            new bootstrap.Tooltip(btnUnionPolygons2);
            new bootstrap.Tooltip(btnUnionPolygons3);
        }
    });

    btnUnionPolygons1.addEventListener('click', function () {
        showMessageModal('info', 'Выберите полигон для объединения');
        mergedPolygons(layer, contextMenu, "simple");
    });

    btnUnionPolygons2.addEventListener('click', function () {
        showMessageModal('info', 'Выберите полигон для объединения');
        mergedPolygons(layer, contextMenu, "convex");
    });

    btnUnionPolygons3.addEventListener('click', function () {
        showMessageModal('info', 'Выберите полигон для объединения');
        mergedPolygons(layer, contextMenu, "manual");
    });
}

function AddAreaFunc(layer, layerId, contextMenu) {
    const btnAddArea = document.getElementById(`btnAddArea_${layerId}`);
    const btnSendArea = document.getElementById(`btnSendArea_${layerId}`);
    const inputArea = document.getElementById(`AreaValue_${layerId}`);

    $(`#AreaValue_${layerId}`).mask("9999.99", {placeholder: "Ширина полигона в метрах"});

    btnAddArea.addEventListener('click', function () {
        const div = document.getElementById(`addAreas_${layerId}`);
        div.style.display = div.style.display === 'none' ? 'block' : 'none';
    });

    inputArea.addEventListener('input', function () {
        const inputElementValue = inputArea.value.trim();
        const isNumeric = /^-?\d*\.?\d*$/.test(inputElementValue);

        if (inputElementValue && isNumeric && inputElementValue !== ".") {
            btnSendArea.disabled = false;
        } else {
            btnSendArea.disabled = true;
        }
    });

    btnSendArea.addEventListener('click', function () {
        const value = document.getElementById(`AreaValue_${layerId}`).value;
        AddArea(layer, value, contextMenu);
    });
}

function changePolygonSize(layer, newWidth, newHeight) {
    const layerId = layer._leaflet_id;
    const width = parseFloat(newWidth);
    const height = parseFloat(newHeight);

    const center = layer.getCenter();
    const metersPerDegree = 111300;
    const {lat, lng} = center;
    const widthDegrees = width / (metersPerDegree * Math.cos(lat * Math.PI / 180));
    const heightDegrees = height / metersPerDegree;

    const southWest = L.latLng(lat - heightDegrees / 2, lng - widthDegrees / 2);
    const northWest = L.latLng(lat + heightDegrees / 2, lng - widthDegrees / 2);
    const northEast = L.latLng(lat + heightDegrees / 2, lng + widthDegrees / 2);
    const southEast = L.latLng(lat - heightDegrees / 2, lng + widthDegrees / 2);

    let polygon = L.polygon([southWest, northWest, northEast, southEast]);

    const newLatLngs = [
        northWest,
        L.latLng(southEast.lat, northWest.lng),
        southEast,
        L.latLng(northWest.lat, southEast.lng)
    ];

    layer.setLatLngs(newLatLngs);

    let newArea = (turf.area(layer.toGeoJSON()) / 10000).toFixed(3);
    layer.options.source_area = newArea;
    sourceArea = newArea;

    const squareElement = document.getElementById(`square${layerId}`);
    squareElement.textContent = `Площадь - ${newArea}`;

    const squareTypeSelect = document.getElementById(`squareType_${layerId}`);
    squareTypeSelect.value = "hectares";
}


function calculateRecommendedGridStep(layer) {
    const area = parseFloat(layer.options.total_area ? layer.options.total_area : layer.options.source_area);
    const areaToMeters = area * 10000;
    let minStepValue = Math.sqrt(areaToMeters / 500).toFixed(2);

    if (minStepValue < 1) {
        minStepValue = 1;
    }

    return minStepValue;
}

function mergedPolygons(layer, contextMenu, method) {
    const userCreatedLayers = Object.values(map._layers)
        .filter(l => l.options && l.options.is_user_create);

    function mergedPolygonslEventHandler(e) {
        const clickedLatLng = e.latlng;
        let polygonWithPoint = findPolygonWithPoint(clickedLatLng);

        if (polygonWithPoint !== null) {
            if (layer._leaflet_id === polygonWithPoint._leaflet_id) {
                showMessageModal("error", "Вы не можете объединить один полигон");
            } else {
                const layerGeometry = getLayerGeometry(layer);
                const clickedLayerGeometry = getLayerGeometry(polygonWithPoint);
                const mergedGeometry = turf.union(layerGeometry, clickedLayerGeometry);
                let mergedLayer;
                let allVertices;

                switch (method) {
                    case "simple":
                        removeExternalPolygon(layer);
                        removeExternalPolygon(polygonWithPoint);
                        removeLayerAndElement(layer);
                        removeLayerAndElement(polygonWithPoint);

                        createMergedPolygonLayer(mergedGeometry);

                        break;
                    case "convex":
                        allVertices = getAllVertices(mergedGeometry);

                        const convexHull = getConvexHull(allVertices);
                        const polygon = turf.polygon(convexHull.geometry.coordinates);

                        removeExternalPolygon(layer);
                        removeExternalPolygon(polygonWithPoint);
                        removeLayerAndElement(layer);
                        removeLayerAndElement(polygonWithPoint);

                        createMergedPolygonLayer(polygon);

                        break;
                    case "manual":
                        allVertices = getAllVertices(mergedGeometry);

                        const markersLayer = createMarkersLayer(allVertices);
                        markersLayer.addTo(map);

                        const clickedPoints = []

                    function getPointsCoords(e) {

                        const latlng = e.latlng;

                        let nearestVertex = getNearestVertex(latlng, allVertices);
                        clickedPoints.push(nearestVertex);

                        if (clickedPoints.length === 4) {
                            const correctedPoints = clickedPoints.map(point => [point[1], point[0]]);
                            const polygonOfClickedPoints = L.polygon(correctedPoints);

                            const polygon1Geometry = getLayerGeometry(polygonOfClickedPoints);
                            const polygon2Geometry = getLayerGeometry(L.geoJSON(mergedGeometry));

                            const mergedPolygons = turf.union(polygon1Geometry, polygon2Geometry);

                            removeExternalPolygon(layer);
                            removeExternalPolygon(polygonWithPoint);
                            removeLayerAndElement(layer);
                            removeLayerAndElement(polygonWithPoint);
                            markersLayer.remove();

                            createMergedPolygonLayer(mergedPolygons);

                            map.on('click', getPointsCoords);
                        }
                    }

                        map.on('click', getPointsCoords);

                        break;
                }

            }
        } else {
            showMessageModal("error", "Нужно выбрать полигон");
        }
        map.off('click', mergedPolygonslEventHandler);
    }

    function findPolygonWithPoint(clickedLatLng) {
        for (const userLayer of userCreatedLayers) {
            const layerGeoJSON = userLayer.toGeoJSON();
            const feature = layerGeoJSON.features ? layerGeoJSON.features[0] : layerGeoJSON;
            const type = feature.geometry.type;

            if (type === 'Polygon' || type === 'MultiPolygon') {
                const layerGeoJSONGeometry = feature.geometry;
                const isPointInPolygon = turf.booleanPointInPolygon(
                    [clickedLatLng.lng, clickedLatLng.lat],
                    layerGeoJSONGeometry
                );

                if (isPointInPolygon) {
                    return userLayer;
                }
            }
        }

        return null;
    }

    function getLayerGeometry(layer) {
        const layerGeoJSON = layer.toGeoJSON();

        return layerGeoJSON.features ? layerGeoJSON.features[0].geometry : layerGeoJSON.geometry;
    }

    function removeExternalPolygon(layer) {
        const externalPolygonId = layer.options.added_external_polygon_id;
        const targetLayer = map._layers[externalPolygonId] || null;

        if (targetLayer) {
            targetLayer.remove();
        }
    }

    function getAllVertices(mergedGeometry) {
        const coordinates = mergedGeometry.geometry.coordinates;
        const allVertices = [];

        for (let i = 0; i < coordinates.length; i++) {
            const polygonCoordinates = coordinates[i][0];
            for (let j = 0; j < polygonCoordinates.length; j++) {
                const vertex = polygonCoordinates[j];
                allVertices.push(vertex);
            }
        }

        return allVertices;
    }

    function createMarkersLayer(allVertices) {
        const markersLayer = L.layerGroup();

        allVertices.forEach(function (vertex) {
            L.circleMarker([vertex[1], vertex[0]], {
                color: '#3388ff',
                fillColor: 'white',
                fillOpacity: 1,
                radius: 6
            }).addTo(markersLayer);
        });

        return markersLayer;
    }

    function getConvexHull(allVertices) {
        const points = turf.featureCollection(allVertices.map(vertex => turf.point(vertex)));
        return turf.convex(points);
    }

    function getNearestVertex(cursorCoords, polygonCoords) {
        let nearestVertex = null;
        let minDistance = Infinity;

        for (let i = 0; i < polygonCoords.length; i++) {
            const vertex = polygonCoords[i];
            const distance = cursorCoords.distanceTo(L.latLng(vertex[1], vertex[0]));

            if (distance < minDistance) {
                nearestVertex = vertex;
                minDistance = distance;
            }
        }

        return nearestVertex;
    }

    function createMergedPolygonLayer(mergedGeometry) {
        const mergedLayer = L.geoJSON(mergedGeometry, {
            merged_polygon: true
        });

        mergedLayer.addTo(map);
        CreateEl(mergedLayer, 'Polygon');
    }

    map.on('click', mergedPolygonslEventHandler);
    contextMenu.remove();
}


function writeAreaOrLengthInOption(layer, type) {
    if (type === 'Line') {
        layer.options.length = turf.length(layer.toGeoJSON(), {units: 'meters'}).toFixed(2);
    } else {
        let area = (turf.area(layer.toGeoJSON()) / 10000).toFixed(3);
        layer.options.source_area = area;
        if (layer.options.added_external_polygon_id) {
            let totalArea = calculateTotalArea(layer);
            layer.options.total_area = totalArea;
        }
    }
}


function calculateTotalArea(layer) {
    const externalPolygonId = layer.options.added_external_polygon_id;
    const externalPolygon = map._layers[externalPolygonId];
    const area = turf.area(layer.toGeoJSON()) / 10000;
    const externalPolygonArea = (turf.area(externalPolygon.toGeoJSON()) / 10000).toFixed(3);
    const totalArea = (parseFloat(externalPolygonArea) + parseFloat(area)).toFixed(3);

    return totalArea;
}


function addObjectsAround(objectLat, objectLng, objectLayerId) {
    const radius = 300;
    const selectType = document.getElementById(`typeObjectsAround_${objectLayerId}`);
    const apartamentsObjects = document.getElementById(`apartamentsObjects_${objectLayerId}`);
    const parksObjects = document.getElementById(`parksObjects_${objectLayerId}`);
    const waterObjects = document.getElementById(`waterObjects_${objectLayerId}`);
    const natureObjects = document.getElementById(`natureObjects_${objectLayerId}`);
    selectType.style.display = "block"
    const apartContainerPoligons = document.getElementById(`apartamentsPoligonsId_${objectLayerId}`);
    const parkContainerPoligons = document.getElementById(`parksPoligonsId_${objectLayerId}`);
    const waterContainerPoligons = document.getElementById(`waterPoligonsId_${objectLayerId}`);
    const natureContainerPoligons = document.getElementById(`naturePoligonsId_${objectLayerId}`);
    const apartCheckPoligon = document.getElementById(`apartamentsPoligon${objectLayerId}`);
    const parkCheckPoligon = document.getElementById(`parksPoligon${objectLayerId}`);
    const waterCheckPoligon = document.getElementById(`waterPoligon${objectLayerId}`);
    const natureCheckPoligon = document.getElementById(`naturePoligon${objectLayerId}`);
    const query = `[out:json];
    (
    way(around:${radius}, ${objectLat}, ${objectLng})["natural"];
    way(around:${radius}, ${objectLat}, ${objectLng})["building"];
    way(around:${radius}, ${objectLat}, ${objectLng})["amenity" ];
    way(around:${radius}, ${objectLat}, ${objectLng})["leisure"];
    way(around:${radius}, ${objectLat}, ${objectLng})["waterway"];
    way(around:${radius}, ${objectLat}, ${objectLng})["water"];
    way(around:${radius}, ${objectLat}, ${objectLng})["tourism"];
    way(around:${radius}, ${objectLat}, ${objectLng})["shop"];
    );
    out qt center geom;`

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)

        .then(response => response.json())
        .then(data => {
            const allObjectsData = data.elements;
            allObjectsData.forEach(objectsData => {
                const building = objectsData.tags.building
                const amenity = objectsData.tags.amenity
                const leisure = objectsData.tags.leisure
                const water = objectsData.tags.water
                const waterway = objectsData.tags.waterway
                const natural = objectsData.tags.natural

                const minLon = objectsData.bounds.minlon;
                const minLat = objectsData.bounds.minlat;
                const maxLon = objectsData.bounds.maxlon;
                const maxLat = objectsData.bounds.maxlat;
                const centerLat = (minLat + maxLat) / 2;
                const centerLon = (minLon + maxLon) / 2;

                const markerGroupBuilding = L.layerGroup().addTo(map);
                const markerGroupLeisure = L.layerGroup().addTo(map);
                const markerGroupWater = L.layerGroup().addTo(map);
                const markerGroupNature = L.layerGroup().addTo(map);
                const polygonsGroupBuilding = L.layerGroup().addTo(map);
                const polygonsGroupLeisure = L.layerGroup().addTo(map);
                const polygonsGroupWater = L.layerGroup().addTo(map);
                const polygonsGroupNature = L.layerGroup().addTo(map);

                fetch('/static/translate_data.json')
                    .then(response => response.json())
                    .then(jsonData => {
                        apartamentsObjects.addEventListener('change', function () {
                            if (apartamentsObjects.checked) {
                                apartContainerPoligons.style.display = "block";
                                if (building || amenity) {
                                    var greenIcon = new L.Icon({
                                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                        iconSize: [25, 41],
                                        iconAnchor: [12, 41],
                                        popupAnchor: [1, -34],
                                        shadowSize: [41, 41]
                                    });
                                    readJSONFile(amenity, building)
                                    L.marker([centerLat, centerLon], {icon: greenIcon})
                                        .addTo(markerGroupBuilding)
                                        .bindPopup(objectsData.tags.name || jsonData[building] || jsonData[amenity] || objectsData.tags["addr:housenumber"])
                                        .openPopup();
                                    objectsPoligonstFunc(objectsData);
                                }
                            } else {
                                markerGroupBuilding.clearLayers();
                                apartContainerPoligons.style.display = "none";
                            }
                        })
                    });

                function objectsPoligonstFunc(poligonsObjData) {
                    apartCheckPoligon.addEventListener('change', function () {
                        if (apartCheckPoligon.checked) {
                            const polygonCoordinates = poligonsObjData.geometry.map(coord => [coord.lat, coord.lon]);
                            const polygon = L.polygon(polygonCoordinates, {color: 'red'});
                            polygon.addTo(polygonsGroupBuilding);
                        } else {
                            polygonsGroupBuilding.clearLayers();
                        }
                    });
                }

                fetch('/static/translate_data.json')
                    .then(response => response.json())
                    .then(jsonData => {
                        parksObjects.addEventListener('change', function () {
                            if (parksObjects.checked) {
                                parkContainerPoligons.style.display = "block"
                                if (leisure) {
                                    var greenIcon = new L.Icon({
                                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                        iconSize: [25, 41],
                                        iconAnchor: [12, 41],
                                        popupAnchor: [1, -34],
                                        shadowSize: [41, 41]
                                    });
                                    readJSONFile(leisure, natural)
                                    L.marker([centerLat, centerLon], {icon: greenIcon}).addTo(markerGroupLeisure)
                                        .bindPopup(objectsData.tags.name || jsonData[leisure] || jsonData[natural])
                                        .openPopup();
                                    parksPoligonstFunc(objectsData)
                                }
                            } else {
                                markerGroupLeisure.clearLayers();
                                parkContainerPoligons.style.display = "none"
                            }
                        })
                    });

                function parksPoligonstFunc(poligonsParksData) {
                    parkCheckPoligon.addEventListener('change', function () {
                        if (parkCheckPoligon.checked) {
                            const polygonCoordinates = poligonsParksData.geometry.map(coord => [coord.lat, coord.lon]);
                            const polygon = L.polygon(polygonCoordinates, {color: 'red'});
                            polygon.addTo(polygonsGroupLeisure);
                        } else {
                            polygonsGroupLeisure.clearLayers();
                        }
                    });
                }

                fetch('/static/translate_data.json')
                    .then(response => response.json())
                    .then(jsonData => {
                        waterObjects.addEventListener('change', function () {
                            if (waterObjects.checked) {
                                waterContainerPoligons.style.display = "block"
                                if (water || waterway || natural === "water") {
                                    var greenIcon = new L.Icon({
                                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                        iconSize: [25, 41],
                                        iconAnchor: [12, 41],
                                        popupAnchor: [1, -34],
                                        shadowSize: [41, 41]
                                    });
                                    readJSONFile(water, waterway)
                                    L.marker([centerLat, centerLon], {icon: greenIcon}).addTo(markerGroupWater)
                                        .bindPopup(objectsData.tags.name || jsonData[water] || jsonData[waterway])
                                        .openPopup();
                                    waterPoligonstFunc(objectsData)
                                }
                            } else {
                                markerGroupWater.clearLayers();
                                waterContainerPoligons.style.display = "none"
                            }
                        })
                    });

                function waterPoligonstFunc(poligonsWaterData) {
                    waterCheckPoligon.addEventListener('change', function () {
                        if (waterCheckPoligon.checked) {
                            if (waterway === "river" || waterway === "stream" || waterway === "canal") {
                                const polygonCoordinates = poligonsWaterData.geometry.map(coord => [coord.lat, coord.lon]);
                                var riverPolyline = L.polyline(polygonCoordinates, {color: 'red'}).addTo(map);
                                riverPolyline.addTo(polygonsGroupWater);
                            } else {
                                const polygonCoordinates = poligonsWaterData.geometry.map(coord => [coord.lat, coord.lon]);
                                const polygon = L.polygon(polygonCoordinates, {color: 'red'});
                                polygon.addTo(polygonsGroupWater);
                            }
                        } else {
                            polygonsGroupWater.clearLayers();
                        }
                    });
                }

                fetch('/static/translate_data.json')
                    .then(response => response.json())
                    .then(jsonData => {
                        natureObjects.addEventListener('change', function () {
                            if (natureObjects.checked) {
                                natureContainerPoligons.style.display = "block"
                                if (natural) {
                                    var greenIcon = new L.Icon({
                                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                        iconSize: [25, 41],
                                        iconAnchor: [12, 41],
                                        popupAnchor: [1, -34],
                                        shadowSize: [41, 41]
                                    });
                                    readJSONFile(natural)
                                    L.marker([centerLat, centerLon], {icon: greenIcon}).addTo(markerGroupNature)
                                        .bindPopup(objectsData.tags.name || jsonData[natural])
                                        .openPopup();
                                    naturePoligonstFunc(objectsData)
                                }
                            } else {
                                markerGroupNature.clearLayers();
                                natureContainerPoligons.style.display = "none"
                            }
                        })
                    });

                function naturePoligonstFunc(poligonsNatureData) {
                    natureCheckPoligon.addEventListener('change', function () {
                        if (natureCheckPoligon.checked) {
                            const polygonCoordinates = poligonsNatureData.geometry.map(coord => [coord.lat, coord.lon]);
                            const polygon = L.polygon(polygonCoordinates, {color: 'red'});
                            polygon.addTo(polygonsGroupNature);
                        } else {
                            polygonsGroupNature.clearLayers();
                        }
                    });
                }
            });
        })
        .catch(error => {
            console.log(error)
        });
}

function translateText(text) {
    const apiUrl = 'https://api.mymemory.translated.net/get';
    const data = {
        q: text,
        langpair: `${'en'}|${'ru'}`
    };
    const params = new URLSearchParams(data);
    return fetch(`${apiUrl}?${params}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            return data.responseData.translatedText;
        })
        .catch(error => {
            console.error(error);
        });
}

function readJSONFile(...args) {
    var newjsonData = {}
    var csrftoken = getCSRFToken();
    for (var i = 0; i < args.length; i++) {
        if (args[i] !== undefined && args[i] !== "yes") {
            var object = args[i]
            fetch('/static/translate_data.json')
                .then(response => response.json())
                .then(jsonData => {
                    if (!(object in jsonData)) {
                        translateText(object)
                            .then(data => {
                                var key = object;
                                var value = data;
                                newjsonData[key] = value;
                                $.ajax({
                                    url: "/save_translate_data/",
                                    type: "POST",
                                    dataType: "json",
                                    data: JSON.stringify(newjsonData),
                                    contentType: "application/json",
                                    beforeSend: function (xhr, settings) {
                                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                                    },
                                });
                            })
                    }
                });
        }
    }
}

function continueLine(layer, contextMenu) {
    const points = layer.getLatLngs();
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    let layerPoints = [firstPoint, lastPoint];
    map.pm.enableGlobalEditMode();
    map.pm.enableDraw('Line');

    function continueLineEventHandler(e) {
        if (e.shape === 'Line') {
            const newLineLayer = e.layer;
            const newLinePoints = newLineLayer.getLatLngs();
            const newLineStartPoint = newLinePoints[0];

            const isIncluded = layerPoints.some(
                point =>
                    point.lat === newLineStartPoint.lat && point.lng === newLineStartPoint.lng
            );

            if (isIncluded) {
                removeLayerAndElement(layer);
                removeLayerAndElement(newLineLayer);

                const finalLinePoints = newLineStartPoint.lat === firstPoint.lat &&
                newLineStartPoint.lng === firstPoint.lng
                    ? [...newLinePoints.slice(1).reverse(), ...points]
                    : [...points, ...newLinePoints.slice(1)];

                const mergedPolyline = L.polyline(finalLinePoints);
                if (layer.options.withArea) {
                    const area = layer.options.area;
                    area.remove();
                    AddArea(mergedPolyline, layer.options.value, contextMenu);
                }
                mergedPolyline.addTo(map);
                CreateEl(mergedPolyline, 'Line');
                disableMapEditMode('Line');
                if (stepValue) {
                    addMarkersToPolyline(mergedPolyline, stepValue)
                }
            } else {
                removeLayerAndElement(newLineLayer);
                disableMapEditMode('Line');
            }

            map.off('pm:create', continueLineEventHandler);
        }
    }

    map.on('pm:create', continueLineEventHandler);

    contextMenu.remove();
}


function removeLayerAndElement(layer) {
    document.getElementById(layer._leaflet_id).remove();
    layer.remove();
}


function disableMapEditMode(shape) {
    map.pm.disableDraw(shape);
    map.pm.disableGlobalEditMode();
}


function AddArea(layer, value, contextMenu = null) {
    let layerJSON = layer.toGeoJSON().geometry;

    const pmLayer = layer.pm._layers && layer.pm._layers[0];
    const color = pmLayer ? pmLayer.options.color : layer.options.color;
    let fillColor = pmLayer ? pmLayer.options.fillColor : layer.options.fillColor;
    const fillOpacity = pmLayer ? pmLayer.options.fillOpacity : layer.options.fillOpacity;
    const weight = pmLayer ? pmLayer.options.weight : layer.options.weight;

    if (fillColor === null) {
        fillColor = color;
    }

    if (layerJSON) {
        const layerType = layerJSON.type;

        if (layerType === 'LineString') {
            const line = layerJSON;

            const buffered = turf.buffer(line, value, {units: 'meters'});
            const polygonLayer = L.geoJSON(buffered);
            polygonLayer.addTo(map);
            polygonLayer.bringToBack();

        } else if (layerType === 'Point') {
            const buffer = turf.buffer(layer.toGeoJSON(), value, {units: 'meters'})
            L.geoJSON(buffer).addTo(map)

        } else {
            const sourceLayerOptions = layer.options;

            layerJSON = sourceLayerOptions.originalGeometry ? sourceLayerOptions.originalGeometry : layerJSON;

            const buffered = turf.buffer(layerJSON, value, {units: 'meters'});
            const polygonLayer = L.geoJSON(buffered);
            const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, layerJSON);

            const polygon1 = L.geoJSON(difference).getLayers()[0].getLatLngs();
            const polygon2 = L.geoJSON(layerJSON).getLayers()[0].getLatLngs();

            let externalPolygon = L.polygon([...polygon1]);
            const sourcePolygon = L.polygon([...polygon2]);

            removeOldExternalPolygon(layer);

            externalPolygon.addTo(map);
            sourcePolygon.addTo(map);

            sourcePolygon.setStyle({
                fillColor: fillColor,
                color: color,
                fillOpacity: fillOpacity,
                weight: weight
            });

            removeLayerAndElement(layer);

            bindPolygons(sourcePolygon, externalPolygon, value);

            sourcePolygon.options.added_external_polygon_id = externalPolygon._leaflet_id;
            sourcePolygon.options.added_external_polygon_width = value;

            if (sourceLayerOptions.is_cadastral) {
                sourcePolygon.options.is_cadastral = sourceLayerOptions.is_cadastral;
                sourcePolygon.options.cadastral_number = sourceLayerOptions.cadastral_number;
            }

            CreateEl(sourcePolygon, 'Polygon');

            if (sourceLayerOptions && sourceLayerOptions.isGrid && sourceLayerOptions.originalGeometry) {
                const value = sourceLayerOptions.value;
                AddGrid(sourcePolygon, value);
            }
        }
    } else {
        const sourceLayerOptions = layer.options
        const layerJSON = sourceLayerOptions.originalGeometry ? sourceLayerOptions.originalGeometry : layer.toGeoJSON().features[0].geometry;
        ;

        const buffered = turf.buffer(layerJSON, value, {units: 'meters'});
        const polygonLayer = L.geoJSON(buffered);
        const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, layerJSON);
        const polygon1 = L.geoJSON(difference).getLayers()[0].getLatLngs();
        const polygon2 = L.geoJSON(layerJSON).getLayers()[0].getLatLngs();

        let externalPolygon = L.polygon([...polygon1]);
        const sourcePolygon = L.polygon([...polygon2]);

        removeOldExternalPolygon(layer);

        externalPolygon.addTo(map)
        sourcePolygon.addTo(map);

        sourcePolygon.setStyle({
            fillColor: fillColor,
            color: color,
            fillOpacity: fillOpacity,
            weight: weight
        });

        removeLayerAndElement(layer);

        bindPolygons(sourcePolygon, externalPolygon, value);

        sourcePolygon.options.added_external_polygon_id = externalPolygon._leaflet_id;
        sourcePolygon.options.added_external_polygon_width = value;

        if (sourceLayerOptions.is_cadastral) {
            sourcePolygon.options.is_cadastral = sourceLayerOptions.is_cadastral;
            sourcePolygon.options.cadastral_number = sourceLayerOptions.cadastral_number;
        }

        CreateEl(sourcePolygon, 'Polygon');

        if (sourceLayerOptions && sourceLayerOptions.isGrid && sourceLayerOptions.originalGeometry) {
            const value = sourceLayerOptions.value;
            AddGrid(sourcePolygon, value);
        }
    }
    if (contextMenu !== null) {
        contextMenu.remove();
    }
}


function bindPolygons(sourcePolygon, externalPolygon, value, isGrid = null) {

    externalPolygon.on('pm:dragenable', function (e) {
        e.layer.pm.disableLayerDrag();
    });

    function updateExternalPolygon() {
        const sourceGeoJSON = sourcePolygon.options.originalGeometry ? sourcePolygon.options.originalGeometry : sourcePolygon.toGeoJSON();
        const combinedSource = turf.combine(sourceGeoJSON);
        const buffered = turf.buffer(combinedSource, value, {units: 'meters', steps: 4});
        const polygonLayer = L.geoJSON(buffered);
        const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, sourceGeoJSON);
        const polygon = L.geoJSON(difference).getLayers()[0].getLatLngs();
        const newExternalPolygon = L.polygon([...polygon]);
        newExternalPolygon.addTo(map);
        newExternalPolygon.bringToBack();

        newExternalPolygon.pm.disableLayerDrag();

        externalPolygon.remove();
        externalPolygon = newExternalPolygon;

        sourcePolygon.options.added_external_polygon_id = newExternalPolygon._leaflet_id;
    }

    sourcePolygon.on('pm:dragend', updateExternalPolygon);
}


function removeOldExternalPolygon(layer) {
    if (layer.options.added_external_polygon_id) {
        const externalPolygonId = layer.options.added_external_polygon_id;
        map._layers[externalPolygonId].remove();
        delete layer.options.added_external_polygon_id;
        delete layer.options.added_external_polygon_width;
    }
}


function addMarkersToPolyline(polyline, stepMeters) {
    var markers = L.markerClusterGroup({
        disableClusteringAtZoom: 17
    });
    var lineLatLngs = polyline.getLatLngs();
    var currentDistance = 0;
    var currentZoom = map.getZoom();

    if (currentZoom > 16) {
        stepMeters = 20;
    }

    for (var i = 1; i < lineLatLngs.length; i++) {
        var startPoint = lineLatLngs[i - 1];
        var endPoint = lineLatLngs[i];
        var segmentDistance = startPoint.distanceTo(endPoint);
        var stepCount = Math.floor(segmentDistance / stepMeters);

        if (stepCount > 0) {
            for (var j = 0; j < stepCount; j++) {
                var ratio = j / stepCount;
                var markerLatLng = L.latLng(
                    startPoint.lat + ratio * (endPoint.lat - startPoint.lat),
                    startPoint.lng + ratio * (endPoint.lng - startPoint.lng)
                );
                var marker = L.marker(markerLatLng);
                marker.pm.enable({
                    draggable: false
                });
                markers.addLayer(marker);
            }
        }

        currentDistance += segmentDistance;
    }

    var lastMarkerLatLng = lineLatLngs[lineLatLngs.length - 1];
    var lastMarker = L.marker(lastMarkerLatLng);
    markers.addLayer(lastMarker);

    map.addLayer(markers);

    polyline.on('pm:remove', function () {
        markers.clearLayers();
    });

    polyline.on('pm:dragend', function () {
        markers.clearLayers();
    });

    polyline.on('pm:edit', function () {
        markers.clearLayers();
        addMarkersToPolyline(this, stepMeters);
    });
}


let isFirstObjectAdded = false;
let sourceArea;

function createSidebarElements(layer, type, description = '') {
    if (cross) {
        cross.remove();
    }
    sourceArea = layer.options.source_area
    const cutArea = layer.options.cutArea
    const lengthLine = layer.options.length
    const totalArea = layer.options.total_area
    const cadastralNumber = layer.options.cadastral_number
    const isPlotChecked = cadastralNumber ? 'checked' : '';
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
                ${type === 'Line' ? `
                <div class="mb-3">
                    <input class="form-check-input" type="checkbox" name="isStructure_${layerId}">
                    <label class="form-check-label" for="flexCheckChecked">
                        Является сооружением
                    </label>
                </div>
                <div class="mb-3" id="typeStructure_${layerId}" style="display: none">
                    <select class="form-select" aria-label="Выберите тип сооружения">
                        <option selected>Выберите тип сооружения</option>
                        <option value="1">Газопровод</option>
                        <option value="2">ВЛ</option>
                        <option value="3">автодорога</option>
                    </select>
                </div>
                ` : type === 'Marker' ? `
                ` : `
                <div class="mb-3">
                    <label class="form-check-label" for="buildingType_${layerId}">Тип объекта:</label>
                    <br>
                    <input class="form-check-input" type="checkbox" name="buildingType_${layerId}" id="buildingType_${layerId}"
                        value="option1"> Здание</input>
                    <input class="form-check-input" type="checkbox" name="PlotType_${layerId}"
                        value="option2" ${isPlotChecked}> Участок</input>
                </div>
                <div id="buildingInfo_${layerId}" style="display: none">
                    <div class="mb-3" id="typeBuilding_${layerId}">
                        <select class="form-select" aria-label="Выберите тип здания">
                            <option selected>Выберите тип здания</option>
                            <option value="1">Школа</option>
                            <option value="2">Жилой многоэтажный дом</option>
                            <option value="3">Жилое здание</option>
                        </select>
                    </div>
                    <div class="mb-3" id="numberOfFloors_${layerId}">
                        <input class="form-control" type="text" placeholder="Количество этажей" aria-label="default input example" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>
                    <div class="mb-3" id="numberOfOndergroundLevels_${layerId}"">
                        <input class="form-control" type="text" placeholder="Число подземных уровней" aria-label="default input example" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>
                    <div class="mb-3" id="typeOfFoundation${layerId}">
                        <select class="form-select" aria-label="Выберите тип фундамента">
                            <option selected>Выберите тип фундамента</option>
                            <option value="1">Ленточный</option>
                            <option value="2">Ленточно-свайный</option>
                            <option value="3">Свайный</option>
                            <option value="4">Плитный</option>
                            <option value="5">Столбчатый</option>
                            <option value="6">Блочный</option>
                        </select>
                    </div>
                    <div class="mb-3" id="foundationSize_${layerId}"">
                        <input class="form-control" type="text" placeholder="Размер фундамента" aria-label="default input example" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>
                </div>
                <div class="mb-3" id="cadastralNumber_${layerId}" style="${cadastralNumber ? '' : 'display: none'}">
                    <label for="cadastral_number_${layerId}" class="form-label">Кадастровый номер:</label>
                    <input class="form-control" type="text" id="cadastral_number_${layerId}" value="${cadastralNumber ? cadastralNumber : ''}">
                </div>`}
                <div class="form-floating mb-3">
                    <input type="text" class="form-control" name="buildingName_${layerId}" id="buildingName_${layerId}"
                        placeholder="Название объекта:">
                    <label for="buildingName_${layerId}">Название объекта:</label>
                </div>
                <div class="form-floating mb-3">
                    <textarea class="form-control" placeholder="Описание объекта:" name="buildingDescription_${layerId}"
                            id="buildingDescription_${layerId}" style="height: 100px"></textarea>
                    <label for="buildingDescription_${layerId}">Описание объекта:</label>
                </div>
                ${type === 'Marker' ? `
                <div class="col ms-2">
                <span id='square${layerId}'>Координаты -  ${parseFloat(layer._latlng["lat"]).toFixed(6)}, ${parseFloat(layer._latlng["lng"]).toFixed(6)}</span>     
            </div>
            ` : ''}
                <div>
                    ${type === 'Line' ? `
                    <div class="row" style="display: flex; align-items: center;">
                        <div class="col">
                            <span id='length'>Длина - ${lengthLine}</span>          
                        </div>
                        <div class="col">
                            <select class="form-select" id="lengthType_${layerId}" style="width: 80px;">
                                <option value="meters">м</option>
                                <option value="kilometers">км</option>
                            </select>
                        </div>
                    </div>
                    ` : `
                        ${sourceArea && parseFloat(sourceArea) !== 0 ? `
                        <div class="row" style="display: flex; align-items: center;">
                            <div class="col">
                                <span id='square${layerId}'>Площадь - ${parseFloat(sourceArea).toFixed(3)}</span>     
                            </div>
                            <div class="col">
                                <select class="form-select" id="squareType_${layerId}" style="width: 80px;">
                                    <option value="hectares">га</option>
                                    <option value="square_kilometers">км&sup2;</option>
                                    <option value="square_meters">м&sup2;</option>
                                </select>
                            </div>
                        </div>` : ''}
                        ${totalArea && parseFloat(totalArea) !== 0 ? `
                        <div class="row" style="display: flex; align-items: center;">
                            <div class="col">
                                <span id='totalSquare${layerId}'>Общая площадь - ${parseFloat(totalArea).toFixed(3)}</span>    
                            </div>
                            <div class="col">
                                <select class="form-select" id="totalSquareType_${layerId}" style="width: 80px;">
                                    <option value="hectares">га</option>
                                    <option value="square_kilometers">км&sup2;</option>
                                    <option value="square_meters">м&sup2;</option>
                                </select>
                            </div>
                        </div>` : ''}
                        ${cutArea && parseFloat(cutArea) !== 0 ? `
                        <div class="row" style="display: flex; align-items: center;">
                            <div class="col">
                                <span id='cutSquare${layerId}'>Площадь вырезанного - ${parseFloat(cutArea).toFixed(3)}</span>     
                            </div>
                            <div class="col">
                                <select class="form-select" id="cutSquareType_${layerId}" style="width: 80px;">
                                    <option value="hectares">га</option>
                                    <option value="square_kilometers">км&sup2;</option>
                                    <option value="square_meters">м&sup2;</option>
                                </select>
                            </div>
                        </div>` : ''}
                    `}
                </div>
            </div>
        </div>
        <div class="mb-3 ms-3" id="typeObjectsAround_${layerId}" style="display: none">
            <label class="form-check-label" for="buildingType">Типы объектов вокруг:</label><br>
            <input type="checkbox" id="apartamentsObjects_${layerId}">

            <label for="apartamentsObjects">Здания, общественные объекты</label><br>
            <div style="margin-left: 15px; display: none" id="apartamentsPoligonsId_${layerId}">
                <input type="checkbox" id="apartamentsPoligon${layerId}">
                <label for="apartamentsPoligons">Добавить полигоны</label><br>
            </div>
                <input type="checkbox" id="parksObjects_${layerId}">
                <label for="parksObjects">Места для отдыха и развлечений</label><br>
            <div style="margin-left: 15px; display: none" id="parksPoligonsId_${layerId}">
                <input type="checkbox" id="parksPoligon${layerId}">
                <label for="parksPoligons">Добавить полигоны</label><br>
            </div>
                <input type="checkbox" id="waterObjects_${layerId}">
                <label for="waterObjects">Водные объекты</label><br>
            <div style="margin-left: 15px; display: none" id="waterPoligonsId_${layerId}">
                <input type="checkbox" id="waterPoligon${layerId}">
                <label for="waterPoligons">Добавить полигоны</label><br>
            </div>
    <input type="checkbox" id="natureObjects_${layerId}">
    <label for="natureObjects">Природные объекты</label><br>
<div style="margin-left: 15px; display: none" id="naturePoligonsId_${layerId}">
    <input type="checkbox" id="naturePoligon${layerId}">
    <label for="naturePoligons">Добавить полигоны</label><br>
</div>
        </div>
    </div>`;
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
        openCanvas();
        isFirstObjectAdded = true;
    }

    if (type === 'Line') {
        const isStructureCheckbox = htmlEl.querySelector(`[name="isStructure_${layerId}"]`);
        const lengthTypeSelect = htmlEl.querySelector(`#lengthType_${layerId}`);

        isStructureCheckbox.addEventListener('change', function () {
            const typeStructureElement = document.getElementById(`typeStructure_${layerId}`);
            if (isStructureCheckbox.checked) {
                typeStructureElement.style.display = 'block';
            } else {
                typeStructureElement.style.display = 'none';
            }
        });

        lengthTypeSelect.addEventListener('change', function () {
            const lengthElement = htmlEl.querySelector('#length');
            const selectedType = lengthTypeSelect.value;
            const length = turf.length(layer.toGeoJSON(), {units: selectedType}).toFixed(2);
            lengthElement.textContent = `Длина - ${length}`;
        });
    } else {
        const isBuildingCheckbox = htmlEl.querySelector(`[name="buildingType_${layerId}"]`);
        const isPlotCheckbox = htmlEl.querySelector(`[name="PlotType_${layerId}"]`);
        const squareTypeSelect = htmlEl.querySelector(`#squareType_${layerId}`);
        const totalSquareTypeSelect = htmlEl.querySelector(`#totalSquareType_${layerId}`);
        const cutSquareTypeSelect = htmlEl.querySelector(`#cutSquareType_${layerId}`);
        const buildingInfo = htmlEl.querySelector(`#buildingInfo_${layerId}`);
        const cadastralNumber = htmlEl.querySelector(`#cadastralNumber_${layerId}`);
        const inputCadastral = htmlEl.querySelector(`#cadastral_number_${layerId}`);

        const maskOptions = {
            placeholder: "__:__:_______:____"
        };

        $(inputCadastral).mask('99:99:9999999:9999', maskOptions);

        isBuildingCheckbox.addEventListener('change', function () {
            if (isBuildingCheckbox.checked) {
                buildingInfo.style.display = 'block';
                isPlotCheckbox.checked = false;
                cadastralNumber.style.display = 'none';
            } else {
                buildingInfo.style.display = 'none';
            }
        });

        isPlotCheckbox.addEventListener('change', function () {
            if (isPlotCheckbox.checked) {
                buildingInfo.style.display = 'none';
                cadastralNumber.style.display = 'block';
                isBuildingCheckbox.checked = false;
            } else {
                cadastralNumber.style.display = 'none';
            }
        });

        squareTypeSelect.addEventListener('change', handleSquareTypeChange);
        if (totalSquareTypeSelect) {
            totalSquareTypeSelect.addEventListener('change', handleTotalSquareTypeChange);
        }
        if (cutSquareTypeSelect) {
            cutSquareTypeSelect.addEventListener('change', handleCutSquareTypeChange);
        }

        function handleSquareTypeChange() {
            const squareElement = htmlEl.querySelector(`#square${layerId}`);
            const selectedType = squareTypeSelect.value;
            const convertedArea = convertArea(selectedType, sourceArea);
            squareElement.textContent = `Площадь - ${convertedArea}`;
        }

        function handleTotalSquareTypeChange() {
            const squareElement = htmlEl.querySelector(`#totalSquare${layerId}`);
            const selectedType = totalSquareTypeSelect.value;
            const convertedArea = convertArea(selectedType, totalArea);
            squareElement.textContent = `Общая площадь - ${convertedArea}`;
        }

        function handleCutSquareTypeChange() {
            const squareElement = htmlEl.querySelector(`#cutSquare${layerId}`);
            const selectedType = cutSquareTypeSelect.value;
            const convertedArea = convertArea(selectedType, cutArea);
            squareElement.textContent = `Площадь вырезанного - ${convertedArea}`;
        }

        function convertArea(type, area) {
            const parsedArea = parseFloat(area);
            if (isNaN(parsedArea) || parsedArea === 0) {
                return area;
            }

            let convertedArea;
            let decimalPlaces = 3;

            switch (type) {
                case 'hectares':
                    convertedArea = parsedArea;
                    break;
                case 'square_kilometers':
                    convertedArea = parsedArea * 0.01;
                    break;
                case 'square_meters':
                    convertedArea = parsedArea * 10000;
                    decimalPlaces = 0;
                    break;
                default:
                    convertedArea = parsedArea;
            }

            return convertedArea.toFixed(decimalPlaces);
        }
    }
}


function toggleElements(layerId) {
    const hiddenElements = document.getElementById(`hiddenElements_${layerId}`);
    const card = document.getElementById(layerId);
    const icon = card.querySelector('.arrow-icon');

    hiddenElements.style.display = hiddenElements.style.display === 'none' ? 'block' : 'none';
    icon.className = hiddenElements.style.display === 'none' ? 'bi bi-arrow-down-square arrow-icon' : 'bi bi-arrow-up-square arrow-icon';
}


function zoomToMarker(id, type) {
    const layer = fg.getLayer(id);
    if (type == 'Rectangle' || type == 'Polygon' || type == 'Circle') {
        var center = layer.getBounds().getCenter()
    } else if (type == 'Marker' || type == 'CircleMarker') {
        var center = layer.getLatLng()
    } else {
        var center = layer.getBounds().getCenter()
    }

    map.panTo(center);
}

function DrawCadastralPolygon(coords, number) {
    states = JSON.parse(coords)
    let polygon = L.geoJSON(states).addTo(map);
    polygon.on('pm:edit', function () {
        const area = turf.area(polygon.toGeoJSON()) / 10000;
        document.getElementById('square').innerHTML = `Площадь - ${area.toFixed(3)} га`
    });
    const center = polygon.getBounds().getCenter()
    fg.addLayer(polygon);
    const options = {
        is_cadastral: true,
        cadastral_number: number
    };
    Object.assign(polygon.options, options);
    CreateEl(polygon, 'Polygon');

    map.flyTo(center, config.maxZoom)
}


function AddGrid(layer, value, originalLayer = null, externalPolygon = null, widthInDegrees = null) {
    const feature = layer.options.isGrid && layer.options.originalGeometry
        ? layer.options.originalGeometry
        : (layer.toGeoJSON().features && layer.toGeoJSON().features[0]) ? layer.toGeoJSON().features[0] : layer.toGeoJSON();
    const type = feature.geometry.type === 'MultiPolygon' ? 'Polygon' : feature.geometry.type;
    const options = {units: 'meters', mask: feature};
    const bufferedBbox = turf.bbox(turf.buffer(feature, value, options));
    const squareGrid = turf.squareGrid(bufferedBbox, value, options);

    const pmLayer = layer.pm._layers && layer.pm._layers[0];
    const color = pmLayer ? pmLayer.options.color : layer.options.color;
    let fillColor = pmLayer ? pmLayer.options.fillColor : layer.options.fillColor;
    const fillOpacity = pmLayer ? pmLayer.options.fillOpacity : layer.options.fillOpacity;
    const weight = pmLayer ? pmLayer.options.weight : layer.options.weight;

    if (fillColor === null) {
        fillColor = color;
    }

    const clippedGridLayer = L.geoJSON();
    turf.featureEach(squareGrid, function (currentFeature) {
        const intersected = turf.intersect(feature, currentFeature);
        if (intersected) {
            clippedGridLayer.addData(intersected);
        }
    });

    const combined = turf.combine(clippedGridLayer.toGeoJSON(), feature);
    const polygon = L.geoJSON(combined)
    polygon.pm.enable({
        dragMiddleMarkers: false,
        limitMarkersToCount: 8,
        hintlineStyle: {color: color}
    });

    const newLayer = polygon.getLayers()[0];
    const id = (originalLayer || layer)._leaflet_id;
    const element = document.getElementById(id);

    if (element) {
        element.remove();
    }

    (originalLayer || layer).remove();
    layer.remove();

    newLayer.options.isGrid = true;
    newLayer.options.value = value;
    newLayer.options.originalGeometry = layer.options.originalGeometry ? layer.options.originalGeometry : feature;

    if (layer.options.is_cadastral) {
        const {is_cadastral, cadastral_number} = layer.options;
        Object.assign(newLayer.options, {is_cadastral, cadastral_number});
    }

    if (layer.options.added_external_polygon_width) {
        const {total_area, added_external_polygon_id, added_external_polygon_width} = layer.options;
        Object.assign(newLayer.options, {total_area, added_external_polygon_id, added_external_polygon_width});
    }

    newLayer.on('pm:rotateend', function (e) {
        updateLayerOptionOriginalGeometry(newLayer);
    });

    newLayer.on('pm:dragend', function (e) {
        updateLayerOptionOriginalGeometry(newLayer);
    });

    newLayer.setStyle({
        fillColor: fillColor,
        color: color,
        fillOpacity: fillOpacity,
        weight: weight
    });
    CreateEl(newLayer, type);

    if (newLayer.options.added_external_polygon_id) {
        const externalPolygonId = newLayer.options.added_external_polygon_id;
        const externalPolygon = map._layers[externalPolygonId];
        const widthInDegrees = newLayer.options.added_external_polygon_width;
        bindPolygons(newLayer, externalPolygon, widthInDegrees)
    }
}


function updateLayerOptionOriginalGeometry(layer) {
    const layerGeometry = layer.toGeoJSON().features && layer.toGeoJSON().features[0] ?
        layer.toGeoJSON().features[0].geometry.coordinates : layer.toGeoJSON().geometry.coordinates;
    let newPolygonsGeometry = [];

    layerGeometry.forEach(function (innerCoordArray) {
        let newCoords = [];
        innerCoordArray.forEach(function (subCoordArray) {
            subCoordArray.forEach(function (coord) {
                newCoords.push([coord[1], coord[0]]);
            })
        })
        const newPolyGeometry = L.polygon(newCoords).toGeoJSON().geometry;
        newPolygonsGeometry.push(newPolyGeometry);
        newCoords = [];
    });

    let mergedGeometry = newPolygonsGeometry[0];
    newPolygonsGeometry.slice(1).forEach(function (polyGeometry) {
        mergedGeometry = turf.union(mergedGeometry, polyGeometry);
    });

    const mergedPolygons = L.geoJSON(mergedGeometry);
    const feature = mergedPolygons.toGeoJSON().features && mergedPolygons.toGeoJSON().features[0] ? mergedPolygons.toGeoJSON().features[0] : mergedPolygons.toGeoJSON();

    layer.options.originalGeometry = feature;
}

// Добавление поля для ввода нового кадастрового номера
addButton.addEventListener('click', () => {
    const newField = document.createElement('div');
    const newId = `new-cadastral-${idCounter}`;
    newField.innerHTML = `
    <div id="${newId}" style="margin-bottom: 20px">
      <div class="input-group mb-3 custom-input-group">
        <input type="text" name="cadastral_numbers" id="cadastral_number${idCounter}" class="form-control custom-form-control" onblur="checkInputCadastral(this);" style="background-color: white">
        <div class="input-group-append custom-input-group-append" style="margin-left: 2px">
          <button name="edit_button" type='button' id='edit${idCounter}' class='btn btn-outline-secondary custom-button' style='margin-left: 10px; text-align: center; line-height: 10px;'><i class='bx bxs-check-circle'></i></button>
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

// Удаление кадастрового номера из основного поля
function deleteCadastral(deleteButton) {
    const parentDiv = deleteButton.parentNode.parentNode;
    const inputElement = parentDiv.querySelector('input[name="cadastral_numbers"]');
    const editButton = parentDiv.querySelector('button[id="edit1"]');
    removeCadastralValue(inputElement.value);
    inputElement.value = '';
    editButton.innerHTML = "<i class='bx bxs-check-circle'></i>";
    inputElement.readOnly = false
    inputElement.style.cssText = 'background-color: white; transition: 0.15s linear;';
}

// Редактирование кадастрового номера при вводе
function editCadastral(editButton) {
    const parentDiv = editButton.parentNode.parentNode;
    const inputElement = parentDiv.querySelector('input[name="cadastral_numbers"]');
    if (inputElement.readOnly) {
        removeCadastralValue(inputElement.value);
        inputElement.value = '';
        editButton.innerHTML = "<i class='bx bxs-check-circle'></i>";
        inputElement.readOnly = false
        inputElement.style.cssText = 'background-color: white; transition: 0.15s linear;';
    } else {
        editButton.innerHTML = "<i class='bx bxs-edit'></i>";
        inputElement.readOnly = true;
        inputElement.style.cssText = 'background-color: lightgray; transition: 0.15s linear;';
    }
}

// Проверка кадастрового номера при вводе на уникальность
function checkInputCadastral(input) {
    const allInputs = document.querySelectorAll('input[name="cadastral_numbers"]');
    const values = Array.from(allInputs)
        .filter(input => input.value)
        .map(input => input.value);

    if (input.value === '') {
        return;
    }

    const parentDiv = input.parentNode;
    const editButton = parentDiv.querySelector('button[name="edit_button"]');

    const regex = new RegExp('[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}')
    if (!regex.test(input.value)) {
        showMessageModal("error", 'Неверный формат кадастрового номера');
        return;
    }

    if (uniqueCadastralValues.includes(input.value)) {
        input.value = "";
        showMessageModal("error", "Данный кадастровый номер уже был добавлен");
        return;
    }

    uniqueCadastralValues.push(input.value);
    editButton.innerHTML = "<i class='bx bxs-edit'></i>";
    input.readOnly = true;
    input.style.cssText = 'background-color: lightgray !important; transition: 0.15s linear;';
}


$('#addCadastralModal').on('hidden.bs.modal', function () {
    const inputElement = document.querySelector('input[name="cadastral_numbers"]');
    const editButton = document.querySelector('button[name="edit_button"]');
    inputElement.readOnly = false;
    inputElement.style.cssText = 'background-color: white; transition: 0.15s linear;'
    editButton.innerHTML = "<i class='bx bxs-check-circle'></i>";
    $("form")[0].reset();
    $('#container .paragraph ').empty();

    uniqueCadastralValues = uniqueCadastralValues.filter(number => allSendCadastralNumber.includes(number));
});


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

/* Выгрузка данных в заявку */
const uploadDataButton = document.getElementById('upload_data');
uploadDataButton.addEventListener('click', uploadData);


function uploadData() {
    const square = getSquare();

    const data = {
        cadastral_numbers: uniqueCadastralValues,
        square_from_mapmaker: square
    };

    writeToDjangoSession(data);

    setTimeout(function () {
        window.open('/order/', '_blank');
    }, 1500);

    // getAddress();

    $('#uploadDataModal').modal('hide');
}

function getSquare() {
    const squareElements = document.querySelectorAll('[id^=square]');
    const areas = [];

    squareElements.forEach(element => {
        const textContent = element.textContent;
        const areaString = textContent.replace('Площадь - ', '').replace(' га', '');
        const area = parseFloat(areaString);
        areas.push(area * 10000);
    });

    return areas;
}

function getAddress() {
    const offcanvasRight = document.getElementById('offcanvasRight');
    const elements = offcanvasRight.querySelectorAll('.card-spacing');
    const layersCenterCoords = [];


    elements.forEach(element => {
        const layerId = element.id;
        const layerType = element.getAttribute('type');
        layersCenterCoords.push(getCenterCoordinatesById(layerId, layerType));
    });

    if (layersCenterCoords.length > 0) {
        $.ajax({
            data: {
                coords: JSON.stringify(layersCenterCoords),
            },
            dataType: 'json',
            url: "/get_address_by_coord/",
            success: function (response) {
                console.log(response);
            },
            error: function (xhr, status, error) {
                console.log(error);
            }
        });
    }
}


function getCenterCoordinatesById(id, type) {
    const layer = map._layers[id];

    if (layer) {
        let centerCoordinates;

        switch (type) {
            case 'Marker':
            case 'CircleMarker':
                centerCoordinates = layer.getLatLng();
                break;
            case 'Line':
            case 'Polygon':
            case 'Rectangle':
            case 'Circle':
                centerCoordinates = layer.getBounds().getCenter();
                break;
            default:
                console.error('Неверный тип объекта');
                return;
        }

        return centerCoordinates;
    } else {
        console.error('Объект не найден');
        return;
    }
}

function writeToDjangoSession(data) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/write_to_session/', true);

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', getCSRFToken());

    const jsonData = JSON.stringify(data);
    xhr.send(jsonData);
}

/* Получение CSRF-токена из куки */
function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue;
}

/* Копирование координат в буфер обмена */
const markerPositionDiv = document.getElementById('markerPosition');

markerPositionDiv.addEventListener('click', function () {
    const textContent = markerPositionDiv.textContent.trim();

    if (textContent.startsWith('LatLng')) {
        navigator.clipboard.writeText(textContent)
            .then(function () {
                showMessageModal("success", 'Координаты скопированы в буфер обмена');
            })
            .catch(function (error) {
                console.error('Ошибка при копировании текста: ', error);
            });
    }
});

/* Палитра цветов */
function createPalette(div, layer, styleType) {
    const pmLayer = layer.pm._layers && layer.pm._layers[0];

    let color = styleType === 'border'
        ? pmLayer ? pmLayer.options.color : layer.options.color
        : styleType === 'fill'
            ? pmLayer ? pmLayer.options.fillColor : layer.options.fillColor
            : null;

    if (styleType === 'fill' && !color) {
        color = pmLayer ? pmLayer.options.color : layer.options.color;
    }

    const pickr = Pickr.create({
        el: div,
        theme: 'nano',
        swatches: [
            'rgba(244, 67, 54, 1)',
            'rgba(233, 30, 99, 0.95)',
            'rgba(156, 39, 176, 0.9)',
            'rgba(103, 58, 183, 0.85)',
            'rgba(63, 81, 181, 0.8)',
            'rgba(33, 150, 243, 0.75)',
            'rgba(3, 169, 244, 0.7)',
            'rgba(0, 188, 212, 0.7)',
            'rgba(0, 150, 136, 0.75)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(139, 195, 74, 0.85)',
            'rgba(205, 220, 57, 0.9)',
            'rgba(255, 235, 59, 0.95)',
            'rgba(255, 193, 7, 1)'
        ],
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                hsla: false,
                hsva: false,
                cmyk: false,
                input: true,
                clear: false,
                save: false
            }
        },
        default: color,
    });

    pickr.on('change', function (color) {
        if (styleType === 'fill') {
            layer.setStyle({fillColor: color.toRGBA().toString()});
            const sliderInputWrapper = document.querySelector(".fill-slider-input-wrapper");
            const button = sliderInputWrapper.querySelector("button.pcr-button");
            button.style.setProperty("--pcr-color", color.toRGBA().toString());
        } else if (styleType === 'border') {
            layer.setStyle({color: color.toRGBA().toString()});
            const sliderInputWrapper = document.querySelector(".border-slider-input-wrapper");
            const button = sliderInputWrapper.querySelector("button.pcr-button");
            button.style.setProperty("--pcr-color", color.toRGBA().toString());
        }
    });

    return pickr;
}


$(document).ready(function () {
    const maskOptions = {
        placeholder: "__:__:_______:____"
    };

    $('#cadastral_number1').mask('99:99:9999999:9999', maskOptions);
});


window.onload = function () {
    let elements = document.getElementsByClassName('leaflet-control-attribution leaflet-control')
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}