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
    'CircleNumberMarker': {
        'title': 'Круговой Маркер с номером',
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
L.control.zoom({ position: "topright" }).addTo(map);

const options = {
    position: "topleft",
    drawMarker: false,
    drawPolygon: true,
    drawPolyline: true,
    drawRectangle: false,
    drawCircle: true,
    drawCircleMarker: false,
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

        const options = { steps: 64, units: 'kilometers' };
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
    const rotateValue = layer.options.rotateValue;
    const originalLayer = e.originalLayer;
    const polygon = L.geoJSON(layer.toGeoJSON());
    e.originalLayer.cutted = true;
    if (e.layer.options.isGrid) {
        AddGrid(polygon, value, originalLayer, rotateValue)
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
            try {
                var coordinates = layer.toGeoJSON().features[0].geometry.coordinates[1]
            } catch {
                var coord = getLayerGeometry(layer)
                var coordinates = coord.coordinates[0]
            }
            var cutPolygonGeometry = turf.polygon([coordinates]);
            var newCutArea = (turf.area(cutPolygonGeometry) / 10000);
            let area = turf.area(layer.toGeoJSON()) / 10000;
            layer.options.source_area = area;
            layer.options.cutArea = newCutArea
            const squareElement = document.getElementById(`square${layer._leaflet_id}`);
            const cutsquareElement = document.getElementById(`cutSquare${layer._leaflet_id}`);
            squareElement.innerHTML = `Площадь - ${area.toFixed(3)}`;
            if (cutsquareElement) {
                cutsquareElement.innerHTML = `Площадь вырезанного - ${newCutArea.toFixed(3)}`;
            }

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
map.on("click", function (e) {
    const markerPlace = document.querySelector(".marker-position");
    markerPlace.textContent = e.latlng;
    if (cross) {
        cross.setLatLng(e.latlng);
    } else {
        var crossIcon = L.divIcon({
            className: 'cross-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            html: '<div class="cross-icon" id="cross-iconId"></div>'
        });
        cross = L.marker(e.latlng, { icon: crossIcon, bubblingMouseEvents: true }).addTo(map);
    }
});

map.on('click', function (e) {
    if (cross) {
        cross.setLatLng(e.latlng);
    }
});


map.on('dblclick', function (e) {
    if (cross) {
        cross.remove();
        cross = null;
    }

    const contextMenu = L.popup({ closeButton: true })
        .setLatLng(e.latlng)
        .setContent(`<div><a type="button" id="btnAddPoly">Вставить полигон</a></div>`);
    contextMenu.openOn(map);

    document.getElementById(`btnAddPoly`).addEventListener('click', function () {
        navigator.clipboard.readText()
            .then(jsonString => {
                const [geoJSON, optionsSourcePolygon] = JSON.parse(jsonString);
                const type = optionsSourcePolygon.type;
                const layer = L.geoJSON(geoJSON);
                const layerGeometry = getLayerGeometry(layer);
                const normalizedCoordinates = getNormalizedCoordinates(layerGeometry.coordinates);
                const center = layer.getBounds().getCenter();
                const newCenter = e.latlng;
                const differenceLat = newCenter.lat - center.lat;
                const differenceLng = newCenter.lng - center.lng;

                if (type === 'LineString' || type === 'MultiLineString') {
                    let newLineCoords;
                    switch (type) {
                        case 'LineString':
                            newLineCoords = normalizedCoordinates.map(subCoordArray =>
                                subCoordArray.map(coord => [coord[1] + differenceLat, coord[0] + differenceLng])
                            );
                            break;

                        case 'MultiLineString':
                            newLineCoords = normalizedCoordinates.flatMap(subCoordArray =>
                                subCoordArray.map(array =>
                                    array.map(coord => [coord[1] + differenceLat, coord[0] + differenceLng])
                                )
                            );
                            break;
                    }
                    const newLine = L.polyline(newLineCoords).addTo(map);
                    newLine.setStyle({
                        fillColor: optionsSourcePolygon.fillColor,
                        color: optionsSourcePolygon.color,
                        fillOpacity: optionsSourcePolygon.fillOpacity,
                        weight: optionsSourcePolygon.weight
                    });

                    CreateEl(newLine, 'Line');

                    if (optionsSourcePolygon.width) {
                        const value = optionsSourcePolygon.width;
                        AddArea(newLine, value, null);
                    }
                } else if (type === 'Polygon') {
                    const newPolygonCoordinates = normalizedCoordinates.flatMap(subCoordArray =>
                        subCoordArray.map(array =>
                            array.map(coord => [coord[1] + differenceLat, coord[0] + differenceLng])
                        )
                    );

                    const newPolygon = L.polygon(newPolygonCoordinates).addTo(map);
                    newPolygon.setStyle({
                        fillColor: optionsSourcePolygon.fillColor,
                        color: optionsSourcePolygon.color,
                        fillOpacity: optionsSourcePolygon.fillOpacity,
                        weight: optionsSourcePolygon.weight
                    });

                    newPolygon.options.cutArea = optionsSourcePolygon.cutArea ? optionsSourcePolygon.cutArea : undefined;
                    newPolygon.options.isHideGrid = optionsSourcePolygon.isHideGrid ? optionsSourcePolygon.isHideGrid : undefined;
                    newPolygon.options.hideGridValue = optionsSourcePolygon.hideGridValue ? optionsSourcePolygon.hideGridValue : undefined;
                    newPolygon.options.hideGridRotateValue = optionsSourcePolygon.hideGridRotateValue ? optionsSourcePolygon.hideGridRotateValue : undefined;

                    CreateEl(newPolygon, 'Polygon');

                    if (optionsSourcePolygon.width) {
                        const value = optionsSourcePolygon.width;
                        AddArea(newPolygon, value, null);
                    }
                } else if (type === 'MultiPolygon') {
                    if (optionsSourcePolygon.isGrid) {
                        const originalGeometry = optionsSourcePolygon.originalGeometry;
                        const originalCoordinates = originalGeometry.geometry.coordinates;
                        const normalizedOriginalCoordinates = getNormalizedCoordinates(originalCoordinates);

                        const newPolygonCoordinates = normalizedOriginalCoordinates.map(subCoordArray =>
                            subCoordArray.map(array =>
                                array.map(coord => [coord[1] + differenceLat, coord[0] + differenceLng])
                            )
                        );

                        const newPolygon = L.polygon(newPolygonCoordinates).addTo(map);
                        newPolygon.setStyle({
                            fillColor: optionsSourcePolygon.fillColor,
                            color: optionsSourcePolygon.color,
                            fillOpacity: optionsSourcePolygon.fillOpacity,
                            weight: optionsSourcePolygon.weight
                        });

                        newPolygon.options.cutArea = optionsSourcePolygon.cutArea ? optionsSourcePolygon.cutArea : undefined;

                        CreateEl(newPolygon, 'Polygon');

                        if (optionsSourcePolygon.width) {
                            const value = optionsSourcePolygon.width;
                            AddArea(newPolygon, value, null);
                        }

                        const stepValue = optionsSourcePolygon.value;
                        const rotateValue = optionsSourcePolygon.rotateValue;
                        AddGrid(newPolygon, stepValue, null, rotateValue);
                    } else {
                        const newPolygonCoordinates = normalizedCoordinates.map(subCoordArray =>
                            subCoordArray.map(array =>
                                array.map(coord => [coord[1] + differenceLat, coord[0] + differenceLng])
                            )
                        );
                        const newPolygon = L.polygon(newPolygonCoordinates).addTo(map);
                        newPolygon.setStyle({
                            fillColor: optionsSourcePolygon.fillColor,
                            color: optionsSourcePolygon.color,
                            fillOpacity: optionsSourcePolygon.fillOpacity,
                            weight: optionsSourcePolygon.weight
                        });

                        newPolygon.options.cutArea = optionsSourcePolygon.cutArea ? optionsSourcePolygon.cutArea : undefined;

                        CreateEl(newPolygon, 'Polygon');

                        if (optionsSourcePolygon.width) {
                            const value = optionsSourcePolygon.width;
                            AddArea(newPolygon, value, null);
                        }
                    }
                }
            })
            .catch(err => {
                console.log('Something went wrong', err);
            });
        contextMenu.remove();
    });
});

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

let counter = 0;

const customControl = L.Control.extend({
    options: {
        position: 'topleft'
    },
    drawingMode: null,
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-pm-custom-toolbar leaflet-bar leaflet-control');
        const buttons = [
            { title: 'Включить линейку', iconClass: 'bi bi-rulers', id: 'btnTurnRuler' },
            { title: 'Добавить кадастровый номер', iconClass: 'bi bi-pencil-square', modalId: '#addCadastralModal' },
            { title: 'Построить полигон', iconClass: 'bi bi-plus-square', modalId: '#createPolygonModal' },
            { title: 'Выгрузить данные в заявку', iconClass: 'bi bi-upload', modalId: '#uploadDataModal' },
            { title: 'Объединить полигоны', iconClass: 'bi bi-link', id: 'btnShowDivUnionPolygons' },
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
                const selectElement = L.DomUtil.create('select', 'leaflet-pm-action', divElement);
                selectElement.style.fontSize = '14px';
                selectElement.style.borderRadius = '0';

                const options = [
                    { value: 5, text: '5' },
                    { value: 10, text: '10' },
                    { value: 25, text: '25' },
                    { value: 50, text: '50' },
                    { value: 100, text: '100' }
                ];

                options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.text = option.text;
                    selectElement.appendChild(optionElement);
                });

                selectElement.addEventListener('change', function (event) {
                    const selectedValue = event.target.value;
                    minDistanceToPoint = selectedValue;
                });

                buttonElement.addEventListener('click', function () {
                    if (divElement.style.display === 'none') {
                        divElement.style.display = 'block';
                        turnRuler();
                    } else {
                        divElement.style.display = 'none';
                    }
                });
            } else if (button.id === 'btnShowDivUnionPolygons') {
                buttonElement.addEventListener('click', function () {
                    const divUnionPolygonsBtn = document.querySelector('.union-polygons-buttons');
                    divUnionPolygonsBtn.style.display = divUnionPolygonsBtn.style.display === 'none' ? 'block' : 'none';
                });
            } else {
                buttonElement.addEventListener('click', function () {
                    $(button.modalId).modal('show');
                });
            }
        });

        const divUnionPolygonsBtn = L.DomUtil.create('div', 'union-polygons-buttons', container);
        divUnionPolygonsBtn.style.display = 'none';

        const divUnionPolygonsBtnContainer1 = L.DomUtil.create('div', 'button-container', divUnionPolygonsBtn);
        const btnUnionPolygons1 = L.DomUtil.create('a', 'leaflet-buttons-control-button', divUnionPolygonsBtnContainer1);
        const btnUnionPolygons1Icon = L.DomUtil.create('i', 'bi bi-share', btnUnionPolygons1);
        btnUnionPolygons1.setAttribute('title', 'Объединить полигоны в блок');

        const divElementinsidebtnUnionPolygons1 = L.DomUtil.create('div', 'leaflet-pm-actions-container', btnUnionPolygons1);
        divElementinsidebtnUnionPolygons1.style.display = 'none';

        const finishElementBtnUnionPolygons1 = L.DomUtil.create('a', 'leaflet-pm-action action-finishMode', divElementinsidebtnUnionPolygons1);
        finishElementBtnUnionPolygons1.setAttribute('role', 'button');
        finishElementBtnUnionPolygons1.setAttribute('tabindex', '0');
        finishElementBtnUnionPolygons1.setAttribute('href', '#');
        finishElementBtnUnionPolygons1.setAttribute('id', 'finishBtnUnionPolygons1');
        finishElementBtnUnionPolygons1.innerText = 'Завершить';

        const removeElementBtnUnionPolygons1 = L.DomUtil.create('a', 'leaflet-pm-action action-removeLastVertex', divElementinsidebtnUnionPolygons1);
        removeElementBtnUnionPolygons1.setAttribute('role', 'button');
        removeElementBtnUnionPolygons1.setAttribute('tabindex', '0');
        removeElementBtnUnionPolygons1.setAttribute('href', '#');
        removeElementBtnUnionPolygons1.setAttribute('id', 'removeBtnUnionPolygons1');
        removeElementBtnUnionPolygons1.innerText = 'Отменить последнее действие';

        const cancelElementBtnUnionPolygons1 = L.DomUtil.create('a', 'leaflet-pm-action action-removeLastVertex', divElementinsidebtnUnionPolygons1);
        cancelElementBtnUnionPolygons1.setAttribute('role', 'button');
        cancelElementBtnUnionPolygons1.setAttribute('tabindex', '0');
        cancelElementBtnUnionPolygons1.setAttribute('href', '#');
        cancelElementBtnUnionPolygons1.setAttribute('id', 'cancelBtnUnionPolygons1');
        cancelElementBtnUnionPolygons1.innerText = 'Отменить';

        btnUnionPolygons1.addEventListener('click', function () {
            if (divElementinsidebtnUnionPolygons1.style.display === 'none') {
                divElementinsidebtnUnionPolygons1.style.display = 'block';
                divElementinsidebtnUnionPolygons2.style.display = 'none';
                finishElementBtnUnionPolygons1.setAttribute('data-bs-toggle', "tooltip");
                finishElementBtnUnionPolygons1.setAttribute('data-bs-custom-class', "custom-tooltip");
                finishElementBtnUnionPolygons1.setAttribute('data-bs-title', `Подходит для сложных геометрических объектов. Объединяет полигоны в блок, сохраняя их геометрию.`);
                new bootstrap.Tooltip(finishElementBtnUnionPolygons1);
                if (window['cancelUnionPolygonsFunc']) {
                    window['cancelUnionPolygonsFunc']();
                }
                unionPolygons("block", removeElementBtnUnionPolygons1, cancelElementBtnUnionPolygons1, finishElementBtnUnionPolygons1);
            } else {
                divElementinsidebtnUnionPolygons1.style.display = 'none';
            }
        });

        const divUnionPolygonsBtnContainer2 = L.DomUtil.create('div', 'button-container', divUnionPolygonsBtn);
        const btnUnionPolygons2 = L.DomUtil.create('a', 'leaflet-buttons-control-button', divUnionPolygonsBtnContainer2);
        const btnUnionPolygons2Icon = L.DomUtil.create('i', 'fa-regular fa-object-group fa-xl', btnUnionPolygons2);
        btnUnionPolygons2.setAttribute('title', 'Метод выпуклой оболочки');

        const divElementinsidebtnUnionPolygons2 = L.DomUtil.create('div', 'leaflet-pm-actions-container', btnUnionPolygons2);
        divElementinsidebtnUnionPolygons2.style.display = 'none';

        const finishElementBtnUnionPolygons2 = L.DomUtil.create('a', 'leaflet-pm-action action-finishMode', divElementinsidebtnUnionPolygons2);
        finishElementBtnUnionPolygons2.setAttribute('role', 'button');
        finishElementBtnUnionPolygons2.setAttribute('tabindex', '0');
        finishElementBtnUnionPolygons2.setAttribute('href', '#');
        finishElementBtnUnionPolygons2.setAttribute('id', 'finishBtnUnionPolygons2');
        finishElementBtnUnionPolygons2.innerText = 'Завершить';

        const removeElementBtnUnionPolygons2 = L.DomUtil.create('a', 'leaflet-pm-action action-removeLastVertex', divElementinsidebtnUnionPolygons2);
        removeElementBtnUnionPolygons2.setAttribute('role', 'button');
        removeElementBtnUnionPolygons2.setAttribute('tabindex', '0');
        removeElementBtnUnionPolygons2.setAttribute('href', '#');
        removeElementBtnUnionPolygons2.setAttribute('id', 'removeBtnUnionPolygons2');
        removeElementBtnUnionPolygons2.innerText = 'Отменить последнее действие';

        const cancelElementBtnUnionPolygons2 = L.DomUtil.create('a', 'leaflet-pm-action action-removeLastVertex', divElementinsidebtnUnionPolygons2);
        cancelElementBtnUnionPolygons2.setAttribute('role', 'button');
        cancelElementBtnUnionPolygons2.setAttribute('tabindex', '0');
        cancelElementBtnUnionPolygons2.setAttribute('href', '#');
        cancelElementBtnUnionPolygons2.setAttribute('id', 'cancelBtnUnionPolygons2');
        cancelElementBtnUnionPolygons2.innerText = 'Отменить';

        btnUnionPolygons2.addEventListener('click', function () {
            if (divElementinsidebtnUnionPolygons2.style.display === 'none') {
                divElementinsidebtnUnionPolygons2.style.display = 'block';
                divElementinsidebtnUnionPolygons1.style.display = 'none';
                finishElementBtnUnionPolygons2.setAttribute('data-bs-toggle', "tooltip");
                finishElementBtnUnionPolygons2.setAttribute('data-bs-custom-class', "custom-tooltip");
                finishElementBtnUnionPolygons2.setAttribute('data-bs-title', `Подходит для простых геометрических объектов. Использует алгоритм выпуклой оболочки, чтобы объединить полигоны вместе, исходя из формы и расположения их угловых точек.`);
                new bootstrap.Tooltip(finishElementBtnUnionPolygons2);
                if (window['cancelUnionPolygonsFunc']) {
                    window['cancelUnionPolygonsFunc']();
                }
                unionPolygons("convex", removeElementBtnUnionPolygons2, cancelElementBtnUnionPolygons2, finishElementBtnUnionPolygons2);
            } else {
                divElementinsidebtnUnionPolygons2.style.display = 'none';
            }
        });

        const mainButton = L.DomUtil.create('a', 'leaflet-buttons-control-button', container);
        const mainIcon = L.DomUtil.create('i', 'bi bi-pin-map-fill', mainButton);

        const panel = L.DomUtil.create('div', 'button-panel leaflet-buttons-control-hidden', container);

        const extraButtons = [
            { title: 'Добавить маркер', iconClass: 'bi bi-geo-alt-fill', action: 'selectMarker' },
            { title: 'Добавить круговой маркер', iconClass: 'bi bi-record-circle', action: 'selectCircleMarker' },
            {
                title: 'Добавить круговой маркер с номером',
                iconClass: 'bi bi-1-circle-fill',
                action: 'selectCircleNumberMarker'
            }
        ];

        let isDrawing = false;

        extraButtons.forEach(button => {
            const buttonElement = L.DomUtil.create('a', 'leaflet-buttons-control-button', panel);
            const iconElement = L.DomUtil.create('i', button.iconClass, buttonElement);

            buttonElement.setAttribute('title', button.title);

            buttonElement.addEventListener('click', function () {
                if (isDrawing) {
                    isDrawing = false;
                    return;
                }

                if (button.action === 'selectMarker') {
                    map.pm.enableDraw('Marker');
                    customControl.drawingMode = 'Marker';
                } else if (button.action === 'selectCircleMarker') {
                    map.pm.enableDraw('CircleMarker');
                    customControl.drawingMode = 'CircleMarker';
                } else if (button.action === 'selectCircleNumberMarker') {
                    isDrawing = true;
                    map.on('click', function (event) {
                        if (!isDrawing) return;
                        counter++;
                        var marker = L.circleMarker(event.latlng, {
                            radius: 10,
                            color: 'blue',
                            fillColor: 'blue',
                            fillOpacity: 1
                        }).addTo(map);

                        marker.bindTooltip(`${counter}`, {
                            permanent: true,
                            className: 'marker-tooltip',
                            direction: 'center',
                            offset: [0, 0]
                        });
                        CreateEl(marker, "CircleNumberMarker")
                    });
                }
            });
        });

        const closeButton = L.DomUtil.create('a', 'leaflet-buttons-control-button leaflet-buttons-control-hidden', panel);
        closeButton.setAttribute('title', 'Закрыть');
        const closeIcon = L.DomUtil.create('i', 'bi bi-x', closeButton);

        closeButton.addEventListener('click', function () {
            if (customControl.drawingMode === 'Marker') {
                map.pm.disableDraw('Marker');
            } else if (customControl.drawingMode === 'CircleMarker') {
                map.pm.disableDraw('CircleMarker');
            } else {
                if (isDrawing) {
                    isDrawing = false;
                }
            }

            panel.classList.add('leaflet-buttons-control-hidden');

            Array.from(panel.getElementsByClassName('leaflet-buttons-control-button')).forEach(button => {
                button.classList.add('leaflet-buttons-control-hidden');
            });
        });

        mainButton.addEventListener('click', function () {
            panel.classList.toggle('leaflet-buttons-control-hidden');

            Array.from(panel.getElementsByClassName('leaflet-buttons-control-button')).forEach(button => {
                button.classList.toggle('leaflet-buttons-control-hidden');
            });
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

let minDistanceToPoint = 5;

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
            if (distance < minDistance && distance < minDistanceToPoint) {
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
            map.getContainer().classList.remove('line-cursor');
            textMarker.remove();
            return;
        }

        let closestCoord = null;
        let minDistance = Infinity;

        coords.forEach(coord => {
            const coordLatLng = L.latLng(coord[1], coord[0]);
            const distance = coordLatLng.distanceTo(e.latlng);
            if (distance < minDistance && distance < minDistanceToPoint) {
                minDistance = distance;
                closestCoord = coordLatLng;
            }
        });

        if (closestCoord) {
            marker = createMarker(closestCoord);
            if (line) {
                line.setLatLngs([marker.getLatLng(), closestCoord]);
            }
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
        textMarker = L.marker(textMarkerLatLng, { icon: textIcon })
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
    const { lat, lng } = center;
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
    var cutPoliCoords = null;
    try {
        cutPoliCoords = layer.feature.geometry.coordinates
    } catch (error) {
    }
    let flag = 1;
    let el = `<div><a type="button" id="copyGEOJSON_${layerId}"${type === 'Circle' || type === 'Polygon' || type === 'Rectangle' || type === 'Line' ? '' : ' style="display: none"'}>Копировать элемент</a></div>`;
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
                <input type="text" class="form-control form-control-sm" id="gridRotateValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" placeholder="Угол поворота для ячейки" style="margin-left: 10px;">

                <button type="button" class="btn btn-light btn-sm" id="btnSendGridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title=" " style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>

            <div><a type="button" id="btnChangeGrid_${layerId}"${!layer.options.isGrid ? ' style="display: none"' : ''}>Изменить сетку</a></div>            <div class="mb-3" id="сhangeGrid_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="сhangeGridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" placeholder="Шаг сетки в метрах" style="margin-left: 10px;">
                <input type="text" class="form-control form-control-sm" id="сhangeGridRotateValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" placeholder="Угол поворота для ячейки" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnChangeGridValue_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title="" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>

            <div><a type="button" id="btnHideGrid_${layerId}"${!layer.options.isGrid ? ' style="display: none"' : ''}>Cкрыть сетку</a></div>
            <div><a type="button" id="btnShowGrid_${layerId}"${!layer.options.isHideGrid ? ' style="display: none"' : ''}>Отобразить сетку</a></div>
            <div><a type="button" id="btnRotateGrid_${layerId}"${!layer.options.isGrid ? ' style="display: none"' : ''}>Повернуть полигон</a></div>
            <div><a type="button" id="btnDeleteGrid_${layerId}"${!layer.options.isGrid ? ' style="display: none"' : ''}>Удалить сетку</a></div>
            
            <div class="mb"><a type="button" id="btnAddArea_${layerId}"${layer.options.added_external_polygon_id ? ' style="display: none"' : ''}>Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>

            <div class="mb"><a type="button" id="btnDisableExternalPolygon_${layerId}" style="display: none">Отключить привязку внешнего полигона</a></div>
            <div class="mb"><a type="button" id="btnEnableExternalPolygon_${layerId}" style="display: none">Включить привязку внешнего полигона</a></div>
            
            <div class="mb"><a type="button" id="btnAddChangeArea_${layerId}"${!layer.options.added_external_polygon_id ? ' style="display: none"' : ''}>Изменить полигон вокруг</a></div>
            <div class="mb-3" id="addChangeAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="changeAreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>

            <div class="mb"><a type="button" id="btnDisableExternalPolygon_${layerId}" style="display: none">Отключить привязку внешнего полигона</a></div>
            <div class="mb"><a type="button" id="btnEnableExternalPolygon_${layerId}" style="display: none">Включить привязку внешнего полигона</a></div>

            <div class="mb"><a type="button" id="btnCutArea_${layerId}">Вырезать часть полигона</a></div>
            <div class="mb-3" id="CutArea_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="AreaWidth_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                <input type="text" class="form-control form-control-sm" id="AreaLenght_${layerId}" placeholder="Высота полигона" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendCutArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnChangeCutArea_${layerId}"${!layer.options.isCut ? ' style="display: none"' : ''}>Изменить вырезанный полигон</a></div>
            <div class="mb-3" id="changeCutArea_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="changeAreaWidth_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                <input type="text" class="form-control form-control-sm" id="changeAreaLenght_${layerId}" placeholder="Высота полигона" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeCutArea_${layerId}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-title=" " style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnChangeSize_${layerId}" style="${layer.options.isRectangle ? '' : 'display: none'}">Изменить размер полигона</a></div>
            <div class="mb-3" id="ChangeSize_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="PolygonWidth_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                <input type="text" class="form-control form-control-sm" id="PolygonHeight_${layerId}" placeholder="Высота полигона" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeSize_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>

            ${type === 'Circle' ? `
            <div class="mb"><a type="button" id="btnChangeCircleSize_${layerId}">Изменить радиус круга</a></div>
            <div class="mb-3" id="changeCircleSize_${layerId}" style="display: none">
            <p id="oldRadius_${layerId}"></p>
                <input type="text" class="form-control form-control-sm" id="CircleRadius_${layerId}" placeholder="Радиус круга в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeCircleSize_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>
            ` : ''}      
            <div><a type="button" id="" onclick="changePolygonColor(${layerId}, '${type}')">Изменить цвет</a></div>
            
            <div><a type="button" id="btnPolygonCalculations_${layerId}" style="${type === 'Circle' ? 'display: none' : ''}">Вычисления</a></div>        
            <div id="polygonCalculations_${layerId}" style="display: none">
                <div><a type="button" id="btnFindLengthSide_${layerId}" style="margin: 10px 0 0 10px;">Найти длину стороны</a></div>
            </div>

            <div><a type="button" id="addObjectsAround_${layerId}">Добавить муниципальные здания</a></div>
            <div class="mb-3" id="objectsAround_${layerId}" style="display: none">
            <input type="text" class="form-control form-control-sm" id="radiusAroundObjects_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
            <button type="button" class="btn btn-light btn-sm" id="btnSendRadius_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
        </div>
            `
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddAreaFunc(layer, layerId, contextMenu);
            AddChangeAreaFunc(layer, layerId, contextMenu);
            AddGridFunc(layer, layerId, contextMenu, e);
            AddChangeGridFunc(layer, layerId, contextMenu, e);
            AddDeleteGridFunc(layer, layerId, contextMenu);
            AddHideGridFunc(layer, layerId, contextMenu);
            AddShowGridFunc(layer, layerId, contextMenu);
            AddCopyGeoJSONFunc(layer, layerId, contextMenu);
            AddChangePolygonSizeFunc(layer, layerId, contextMenu);

            const btnDisableExternalPolygon = document.getElementById(`btnDisableExternalPolygon_${layerId}`);
            const btnEnableExternalPolygon = document.getElementById(`btnEnableExternalPolygon_${layerId}`);

            if (layer.options.added_external_polygon_id && layer.options.update_external_polygon_handler) {
                btnDisableExternalPolygon.style.display = 'block';
            } else if (layer.options.added_external_polygon_id && !layer.options.update_external_polygon_handler) {
                btnEnableExternalPolygon.style.display = 'block';
            }

            document.getElementById(`btnRotateGrid_${layerId}`).addEventListener('click', function () {
                RotateGridPoly(layer, layerId)
            });

            document.getElementById(`btnCutArea_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`CutArea_${layerId}`);
                if (div.style.display === 'none') {
                    div.style.display = 'block';

                    $(`#AreaWidth_${layerId}`).mask("9999.99", { placeholder: "Ширина полигона" });
                    $(`#AreaLenght_${layerId}`).mask("9999.99", { placeholder: "Высота полигона" });

                    const widthInput = document.getElementById(`AreaWidth_${layerId}`);
                    const heightInput = document.getElementById(`AreaLenght_${layerId}`);
                    const button = document.getElementById(`btnSendCutArea_${layerId}`);

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

            document.getElementById(`btnSendCutArea_${layerId}`).addEventListener('click', function () {
                const length = document.getElementById(`AreaWidth_${layerId}`).value;
                const width = document.getElementById(`AreaLenght_${layerId}`).value;
                const { lat, lng } = contextMenu._latlng;
                cutPolygonArea(layer, length, width, lat, lng);
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

            document.getElementById(`btnChangeCutArea_${layerId}`).addEventListener('click', () => {
                const div = document.getElementById(`changeCutArea_${layerId}`);
                if (div.style.display === 'none') {
                    div.style.display = 'block';

                    $(`#changeAreaWidth_${layerId}`).mask("9999.99", { placeholder: "Ширина полигона" });
                    $(`#changeAreaLenght_${layerId}`).mask("9999.99", { placeholder: "Высота полигона" });

                    const widthInput = document.getElementById(`changeAreaWidth_${layerId}`);
                    const heightInput = document.getElementById(`changeAreaLenght_${layerId}`);
                    const button = document.getElementById(`btnSendChangeCutArea_${layerId}`);

                    widthInput.addEventListener("input", enableButton);
                    heightInput.addEventListener("input", enableButton);

                    button.setAttribute('data-bs-title', `Найдите нужную вырезанную область внутри полигона, размеры которой хотите изменить. Выполните клик внутри этой области`);
                    new bootstrap.Tooltip(button);

                    function enableButton() {
                        const widthValue = widthInput.value.trim();
                        const heightValue = heightInput.value.trim();

                        button.disabled = !(widthValue && heightValue && widthValue !== "." && heightValue !== ".");
                    }
                } else {
                    div.style.display = 'none';
                }
            });

            document.getElementById(`btnSendChangeCutArea_${layerId}`).addEventListener('click', function () {
                const length = document.getElementById(`changeAreaWidth_${layerId}`).value;
                const width = document.getElementById(`changeAreaLenght_${layerId}`).value;
                changeCutPolygonArea(layer, length, width);
                contextMenu.remove();
            });

            btnDisableExternalPolygon.addEventListener('click', function () {
                disableExternalPolygon(layer, contextMenu);
            });

            btnEnableExternalPolygon.addEventListener('click', function () {
                enableExternalPolygon(layer, contextMenu);
            });

            if (type === "Circle") {
                document.getElementById(`btnChangeCircleSize_${layerId}`).addEventListener('click', () => {
                    const originalLatLngs = layer.getLatLngs()[0];
                    const centerLatLng = layer.getBounds().getCenter();
                    let maxDistance = 0;
                    originalLatLngs.forEach((latLng) => {
                        const distance = centerLatLng.distanceTo(latLng);
                        if (distance > maxDistance) {
                            maxDistance = distance;
                        }
                    });

                    const oldRadius = document.getElementById(`oldRadius_${layerId}`);
                    oldRadius.textContent = `Старый радиус: ${maxDistance.toFixed(1)} м`
                    const div = document.getElementById(`changeCircleSize_${layerId}`);
                    if (div.style.display === 'none') {
                        div.style.display = 'block';
                        $(`#CircleRadius_${layerId}`).mask("9999.99", { placeholder: "Радиус круга" });
                        const radiusInput = document.getElementById(`CircleRadius_${layerId}`);
                        const button = document.getElementById(`btnSendChangeCircleSize_${layerId}`);
                        radiusInput.addEventListener("input", enableButton);

                        function enableButton() {
                            const radiusValue = radiusInput.value.trim();
                            button.disabled = !(radiusValue && radiusValue !== ".");
                        }
                    } else {
                        div.style.display = 'none';
                    }
                    document.getElementById(`btnSendChangeCircleSize_${layerId}`).addEventListener('click', function () {
                        const radius = document.getElementById(`CircleRadius_${layerId}`).value;
                        changeCircleradius(layer, radius)
                        contextMenu.remove();
                    });

                });
            }

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
            <div class="mb"><a type="button" id="btnAddArea_${layerId}"${layer.options.added_external_polygon_id ? ' style="display: none"' : ''}>Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnAddChangeArea_${layerId}"${!layer.options.added_external_polygon_id ? ' style="display: none"' : ''}>Изменить полигон вокруг</a></div>
            <div class="mb-3" id="addChangeAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="changeAreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnDisableExternalPolygon_${layerId}" style="display: none">Отключить привязку внешнего полигона</a></div>
            <div class="mb"><a type="button" id="btnEnableExternalPolygon_${layerId}" style="display: none">Включить привязку внешнего полигона</a></div>
            
            <div><a type="button" id="" onclick="changePolygonColor(${layerId}, '${type}')">Изменить цвет</a></div>
            <div><a type="button" id="btnContinueLine_${layerId}">Продолжить линию</a></div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`;
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddAreaFunc(layer, layerId, contextMenu);
            AddChangeAreaFunc(layer, layerId, contextMenu);
            AddCopyGeoJSONFunc(layer, layerId, contextMenu);

            const btnDisableExternalPolygon = document.getElementById(`btnDisableExternalPolygon_${layerId}`);
            const btnEnableExternalPolygon = document.getElementById(`btnEnableExternalPolygon_${layerId}`);

            if (layer.options.added_external_polygon_id && layer.options.update_external_polygon_handler) {
                btnDisableExternalPolygon.style.display = 'block';
            } else if (layer.options.added_external_polygon_id && !layer.options.update_external_polygon_handler) {
                btnEnableExternalPolygon.style.display = 'block';
            }

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

            btnDisableExternalPolygon.addEventListener('click', function () {
                disableExternalPolygon(layer, contextMenu);
            });

            btnEnableExternalPolygon.addEventListener('click', function () {
                enableExternalPolygon(layer, contextMenu);
            });
        });
    } else if (type === 'CircleMarker' || type === "CircleNumberMarker") {
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
            const contextMenu = L.popup({ closeButton: true })
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
                const contextInfoMenu = L.popup({ closeButton: true, offset: L.point(0, -10) })
                    .setLatLng(center)
                    .setContent(`№: ${mapObjects[type]['number']}</b><br>Название объекта: ${nameObject}<br>Описание объекта: ${infoObject}`);
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

            <div class="mb"><a type="button" id="btnAddArea_${layerId}"${layer.options.added_external_polygon_id ? ' style="display: none"' : ''}>Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnAddChangeArea_${layerId}"${!layer.options.added_external_polygon_id ? ' style="display: none"' : ''}>Изменить полигон вокруг</a></div>
            <div class="mb-3" id="addChangeAreas_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="changeAreaValue_${layerId}" placeholder="Ширина полигона в метрах" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendChangeArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Изменить</button>
            </div>
            
            <div class="mb"><a type="button" id="btnDisableExternalPolygon_${layerId}" style="display: none">Отключить привязку внешнего полигона</a></div>
            <div class="mb"><a type="button" id="btnEnableExternalPolygon_${layerId}" style="display: none">Включить привязку внешнего полигона</a></div>

            <div><a type="button" id="btnAddCircle_${layerId}">Добавить окружность</a></div>
            <div class="mb-3" id="addACircle_${layerId}" style="display: none">
                        <input type="text" class="form-control form-control-sm" id="CircleAreaValue_${layerId}" placeholder="Ширина окружности" style="margin-left: 10px;">
                        <button type="button" class="btn btn-light btn-sm" id="btnSendCircleArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
                    </div>
                    <div><a type="button" id="addObjectsAround_${layerId}">Добавить муниципальные здания</a></div>
                    <div class="mb-3" id="objectsAround_${layerId}" style="display: none">
                    <input type="text" class="form-control form-control-sm" id="radiusAroundObjects_${layerId}" placeholder="Радиус" style="margin-left: 10px;">
                    <button type="button" class="btn btn-light btn-sm" id="btnSendRadius_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;" disabled>Добавить</button>
                </div>
            <div><a type="button" id="addNameInfo_${layerId}">Добавить название и описание</a></div>

            <div class="mb-3" id="addInfo${layerId}" style="display: none">
            <input type="text" class="form-control form-control-sm" id="NameObject_${layerId}" placeholder="Название объекта" style="margin-left: 10px;">
            <input type="text" class="form-control form-control-sm" id="InfoObject_${layerId}" placeholder="Описание объекта" style="margin-left: 10px;">
            <button type="button" class="btn btn-light btn-sm" id="btnNameInfoObject_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
        </div>`;
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);
            AddAreaFunc(layer, layerId, contextMenu);
            AddChangeAreaFunc(layer, layerId, contextMenu);

            const btnDisableExternalPolygon = document.getElementById(`btnDisableExternalPolygon_${layerId}`);
            const btnEnableExternalPolygon = document.getElementById(`btnEnableExternalPolygon_${layerId}`);

            if (layer.options.added_external_polygon_id && layer.options.update_external_polygon_handler) {
                btnDisableExternalPolygon.style.display = 'block';
            } else if (layer.options.added_external_polygon_id && !layer.options.update_external_polygon_handler) {
                btnEnableExternalPolygon.style.display = 'block';
            }

            document.getElementById(`btnAddCircle_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`addACircle_${layerId}`);
                div.style.display = div.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`addNameInfo_${layerId}`).addEventListener('click', function () {
                const divInfo = document.getElementById(`addInfo${layerId}`);
                divInfo.style.display = divInfo.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`addObjectsAround_${layerId}`).addEventListener('click', function () {
                const radiusBlock = document.getElementById(`objectsAround_${layerId}`);
                if (radiusBlock.style.display === 'none') {
                    radiusBlock.style.display = 'block';
                        
                    const radiusInput = document.getElementById(`radiusAroundObjects_${layerId}`);
                    const button = document.getElementById(`btnSendRadius_${layerId}`);
            
                    radiusInput.addEventListener("input", enableButton);
            
                    function enableButton() {
                        const radiusValue = parseFloat(radiusInput.value.trim());
                        if (radiusValue >= 50 && radiusValue <= 500) {
                            button.disabled = false;
                            button.onclick = function() {
                                addObjectsAround(myLat, myLng, layerId, radiusValue);
                            };
                        } else {
                            button.disabled = true;
                        }
                    }
                } else {
                    radiusBlock.style.display = 'none';
                }
            });
            document.getElementById(`btnNameInfoObject_${layerId}`).addEventListener('click', function () {
                const nameObject = document.getElementById(`NameObject_${layerId}`).value;
                const infoObject = document.getElementById(`InfoObject_${layerId}`).value;
                document.getElementById(`buildingName_${layerId}`).value = nameObject;
                document.getElementById(`buildingDescription_${layerId}`).value = infoObject;
                const center = layer.getLatLng();
                contextMenu.remove()
                const contextInfoMenu = L.popup({ closeButton: true, offset: L.point(0, -20) })
                    .setLatLng(center)
                    .setContent(`№: ${mapObjects[type]['number']}</b><br>Название объекта: ${nameObject}<br>Описание объекта: ${infoObject}`);
                contextInfoMenu.openOn(map);
            });

            document.getElementById(`btnSendCircleArea_${layerId}`).addEventListener('click', function () {
                const value = document.getElementById(`CircleAreaValue_${layerId}`).value;
                const center = layer.getLatLng();
                L.circle(center, { radius: value }).addTo(map)
                contextMenu.remove()
            });

            btnDisableExternalPolygon.addEventListener('click', function () {
                disableExternalPolygon(layer, contextMenu);
            });

            btnEnableExternalPolygon.addEventListener('click', function () {
                enableExternalPolygon(layer, contextMenu);
            });
        });
    }

    if (cutPoliCoords !== null & type == 'Polygon' & !layer.options.isGrid) {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
        var polygon = turf.polygon([cutPoliCoords[1]]);
        cutArea = (turf.area(polygon) / 10000).toFixed(3);
        try {
            newPoly = L.geoJSON(turf.difference(layer.toGeoJSON().geometry, polygon.geometry))
        } catch {
            newPoly = L.geoJSON(turf.difference(layer.toGeoJSON().features.geometry, polygon.geometry))
        }
        newPoly.options.cutArea = cutArea;
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

let isRotating = false;
function disableExternalPolygon(layer, contextMenu) {
    isRotating = true;
    if (layer.options.added_external_polygon_id) {
        const externalPolygonId = layer.options.added_external_polygon_id;
        const externalPolygon = map._layers[externalPolygonId];
        let dragEnableHandler = window['dragEnableHandler_' + layer._leaflet_id];
        externalPolygon.off('pm:dragenable', dragEnableHandler);
    }
    let updateExternalPolygonHandler = window['updateExternalPolygonHandler_' + layer._leaflet_id];
    layer.off('pm:dragend', updateExternalPolygonHandler);
    layer.options.update_external_polygon_handler = false;
    contextMenu.remove();
}

function enableExternalPolygon(layer, contextMenu) {
    if (layer.options.added_external_polygon_id) {
        const externalPolygonId = layer.options.added_external_polygon_id;
        const externalPolygon = map._layers[externalPolygonId];
        let dragEnableHandler = window['dragEnableHandler_' + layer._leaflet_id];
    }
    let updateExternalPolygonHandler = window['updateExternalPolygonHandler_' + layer._leaflet_id];
    layer.on('pm:dragend', updateExternalPolygonHandler);
    layer.options.update_external_polygon_handler = true;
    contextMenu.remove();
}

function cutPolygonArea(layer, length, width, lat, lng) {
    let cutArea = 0;
    let newPoly;
    const metersPerDegree = 111300;

    const lengthDegrees = length / (metersPerDegree * Math.cos(lat * Math.PI / 180));
    const widthDegrees = width / metersPerDegree;

    const southWest = L.latLng(lat - widthDegrees / 2, lng - lengthDegrees / 2);
    const northWest = L.latLng(lat + widthDegrees / 2, lng - lengthDegrees / 2);
    const northEast = L.latLng(lat + widthDegrees / 2, lng + lengthDegrees / 2);
    const southEast = L.latLng(lat - widthDegrees / 2, lng + lengthDegrees / 2);

    const polygon = L.polygon([southWest, northWest, northEast, southEast]);
    const layerGeometry = getLayerGeometry(layer);
    const externalGeometry = getExternalGeometry(layer);
    const points = polygon.getLatLngs()[0];

    const isWithin = points.every(function (point) {
        const turfPoint = turf.point([point.lng, point.lat]);

        if (layer.options.merged_polygon) {
            for (let i = 0; i < externalGeometry.length; i++) {
                const turfPolygon = turf.polygon([externalGeometry[i]]);
                if (turf.booleanWithin(turfPoint, turfPolygon)) {
                    return true;
                }
            }
        } else {
            const turfPolygon = turf.polygon(externalGeometry);
            return turf.booleanWithin(turfPoint, turfPolygon);
        }

        return false;
    });

    if (!isWithin) {
        alert('Все точки вырезанной области должны находиться в пределах геометрии исходного полигона');
        return;
    }

    newPoly = L.geoJSON(turf.difference(layerGeometry, polygon.toGeoJSON().geometry))
    newPoly.addTo(map)

    const coords = getLayerGeometry(newPoly).coordinates
    for (i = 1; i < coords.length; i++) {
        var poly = L.polygon(coords[i])
        cutArea += Number((turf.area(poly.toGeoJSON()) / 10000).toFixed(3))
    }

    newPoly.options.cutArea = cutArea;
    newPoly.options.isCut = true;
    newPoly.options.merged_polygon = layer.options.merged_polygon ? layer.options.merged_polygon : undefined;
    newPoly.options.added_external_polygon_id = layer.options.added_external_polygon_id ? layer.options.added_external_polygon_id : undefined;
    newPoly.options.added_external_polygon_width = layer.options.added_external_polygon_width ? layer.options.added_external_polygon_width : undefined;
    newPoly.options.isHideGrid = layer.options.isHideGrid ? layer.options.isHideGrid : undefined;
    newPoly.options.hideGridValue = layer.options.hideGridValue ? layer.options.hideGridValue : undefined;
    newPoly.options.hideGridRotateValue = layer.options.hideGridRotateValue ? layer.options.hideGridRotateValue : undefined;

    setPolygonStyle(layer, newPoly);

    CreateEl(newPoly, 'Polygon');

    const layerCard = document.getElementById(layer._leaflet_id);
    if (layerCard) {
        setCardPositionAndStyle(layer, newPoly)
        layerCard.remove();
    }

    if (layer.options.isGrid) {
        const rotateValue = layer.options.rotateValue ? layer.options.rotateValue : undefined;
        AddGrid(newPoly, layer.options.value, null, rotateValue);
    } else {
        newPoly.options.isFirstCut = true;
    }

    if (layer.options.added_external_polygon_id && !layer.options.isGrid) {
        AddArea(newPoly, layer.options.added_external_polygon_width);
    }

    layer.remove();
}

function setCardPositionAndStyle(oldLayer, newLayer) {
    const oldLayerId = oldLayer._leaflet_id;
    const newLayerId = newLayer._leaflet_id;
    const canvasContainer = document.querySelector('.offcanvas-body');
    const cards = Array.from(canvasContainer.querySelectorAll('.card.card-spacing'));

    const oldLayerCard = document.getElementById(oldLayerId);
    const newLayerCard = document.getElementById(newLayerId);
    const oldLayerCardIndex = cards.indexOf(oldLayerCard);

    if (oldLayerCard && newLayerCard && oldLayerCardIndex !== -1) {
        const oldLayerCardTitle = oldLayerCard.querySelector('h6.card-subtitle.text-body-secondary').textContent;
        const newLayerCardTitle = newLayerCard.querySelector('h6.card-subtitle.text-body-secondary');
        newLayerCardTitle.textContent = oldLayerCardTitle;

        const oldLayerCardHiddenElements = oldLayerCard.querySelector('.hidden-elements');
        const oldLayerCardDisplayStyle = window.getComputedStyle(oldLayerCardHiddenElements).display;
        const newLayerCardHiddenElements = newLayerCard.querySelector('.hidden-elements');
        newLayerCardHiddenElements.style.display = oldLayerCardDisplayStyle;

        const oldLayerCardBuildingTypeIsChecked = oldLayerCard.querySelector(`#buildingType_${oldLayerId}`).checked;
        if (oldLayerCardBuildingTypeIsChecked) {
            const newLayerCardBuildingTypeCheckbox = newLayerCard.querySelector(`#buildingType_${newLayerId}`)
            const buildingInfoDiv = newLayerCard.querySelector(`#buildingInfo_${newLayerId}`);
            newLayerCardBuildingTypeCheckbox.checked = true;
            buildingInfoDiv.style.display = 'block';
        }

        const oldLayerCardPlotTypeIsChecked = oldLayerCard.querySelector(`[name='PlotType_${oldLayerId}']`).checked;
        if (oldLayerCardPlotTypeIsChecked) {
            const newLayerCardPlotTypeCheckbox = newLayerCard.querySelector(`[name='PlotType_${newLayerId}']`)
            const cadastralNumberDiv = newLayerCard.querySelector(`#cadastralNumber_${newLayerId}`);
            newLayerCardPlotTypeCheckbox.checked = true;
            cadastralNumberDiv.style.display = 'block';
        }

        const oldLayerTypeBuildingDiv = oldLayerCard.querySelector(`#typeBuilding_${oldLayerId}`);
        const oldLayerTypeBuildingSelectValue = oldLayerTypeBuildingDiv.querySelector('select').value;
        const newLayerTypeBuildingDiv = newLayerCard.querySelector(`#typeBuilding_${newLayerId}`);
        const newLayerTypeBuildingSelect = newLayerTypeBuildingDiv.querySelector('select');
        newLayerTypeBuildingSelect.value = oldLayerTypeBuildingSelectValue;

        const oldLayerNumberOfFloorsDiv = oldLayerCard.querySelector(`#numberOfFloors_${oldLayerId}`);
        const oldLayerNumberOfFloorsInputValue = oldLayerNumberOfFloorsDiv.querySelector('input').value;
        const newLayerNumberOfFloorsDiv = newLayerCard.querySelector(`#numberOfFloors_${newLayerId}`);
        const newLayerNumberOfFloorsInput = newLayerNumberOfFloorsDiv.querySelector('input');
        newLayerNumberOfFloorsInput.value = oldLayerNumberOfFloorsInputValue;

        const oldLayerNumberOfUndergroundLevelsDiv = oldLayerCard.querySelector(`#numberOfOndergroundLevels_${oldLayerId}`);
        const oldLayerNumberOfUndergroundLevelInputValue = oldLayerNumberOfUndergroundLevelsDiv.querySelector('input').value;
        const newLayerNumberOfUndergroundLevelsDiv = newLayerCard.querySelector(`#numberOfOndergroundLevels_${newLayerId}`);
        const newLayerNumberOfUndergroundLevelInput = newLayerNumberOfUndergroundLevelsDiv.querySelector('input');
        newLayerNumberOfUndergroundLevelInput.value = oldLayerNumberOfUndergroundLevelInputValue;

        const oldLayerTypeOfFoundationDiv = oldLayerCard.querySelector(`#typeOfFoundation${oldLayerId}`);
        const oldLayerTypeOfFoundationSelectValue = oldLayerTypeOfFoundationDiv.querySelector('select').value;
        const newLayerTypeOfFoundationDiv = newLayerCard.querySelector(`#typeOfFoundation${newLayerId}`);
        const newLayerTypeOfFoundationSelect = newLayerTypeOfFoundationDiv.querySelector('select');
        newLayerTypeOfFoundationSelect.value = oldLayerTypeOfFoundationSelectValue;

        const oldLayerFoundationSizeDiv = oldLayerCard.querySelector(`#foundationSize_${oldLayerId}`);
        const oldLayerFoundationSizeInputValue = oldLayerFoundationSizeDiv.querySelector('input').value;
        const newLayerFoundationSizeDiv = newLayerCard.querySelector(`#foundationSize_${newLayerId}`);
        const newLayerFoundationSizeInput = newLayerFoundationSizeDiv.querySelector('input');
        newLayerFoundationSizeInput.value = oldLayerFoundationSizeInputValue;

        const oldLayerBuildingNameInputValue = oldLayerCard.querySelector(`input#buildingName_${oldLayerId}`).value;
        const newLayerBuildingNameInput = newLayerCard.querySelector(`input#buildingName_${newLayerId}`);
        newLayerBuildingNameInput.value = oldLayerBuildingNameInputValue;

        const oldLayerBuildingDescriptionInputValue = oldLayerCard.querySelector(`textarea#buildingDescription_${oldLayerId}`).value;
        const newLayerBuildingDescriptionInput = newLayerCard.querySelector(`textarea#buildingDescription_${newLayerId}`);
        newLayerBuildingDescriptionInput.value = oldLayerBuildingDescriptionInputValue;

        const oldLayerCadastralNumberInputValue = oldLayerCard.querySelector(`input#cadastral_number_${oldLayerId}`).value;
        const newLayerCadastralNumberInput = newLayerCard.querySelector(`input#cadastral_number_${newLayerId}`);
        newLayerCadastralNumberInput.value = oldLayerCadastralNumberInputValue;

        const oldLayerSquareSpan = oldLayerCard.querySelector(`span#square${oldLayerId}`);
        if (oldLayerSquareSpan) {
            const oldLayerSquareTypeSelectValue = oldLayerCard.querySelector(`select#squareType_${oldLayerId}`).value;
            const newLayerSquareTypeSelect = newLayerCard.querySelector(`select#squareType_${newLayerId}`)
            newLayerSquareTypeSelect.value = oldLayerSquareTypeSelectValue;
            newLayerSquareTypeSelect.dispatchEvent(new Event('change'));
        }

        // const oldLayerCutSquareSpan = oldLayerCard.querySelector(`span#cutSquare${oldLayerId}`);
        // if(oldLayerCutSquareSpan) {
        //     const oldLayerCutSquareTypeSelectValue = oldLayerCard.querySelector(`select#cutSquareType_${oldLayerId}`).value;
        //     const newLayerCutSquareTypeSelect = newLayerCard.querySelector(`select#cutSquareType_${newLayerId}`)
        //     newLayerCutSquareTypeSelect.value = oldLayerCutSquareTypeSelectValue;
        //     newLayerCutSquareTypeSelect.dispatchEvent(new Event('change'));
        // }

        canvasContainer.removeChild(newLayerCard);
        canvasContainer.insertBefore(newLayerCard, cards[oldLayerCardIndex]);
    }
}


function getLayerGeometry(layer) {
    const layerGeoJSON = layer.toGeoJSON();
    return layerGeoJSON.features ? layerGeoJSON.features[0].geometry : layerGeoJSON.geometry;
}

function getNormalizedCoordinates(coordinates) {
    const targetDegree = 4;
    const nestedLevel = countNestedLevels(coordinates);
    let normalizedCoordinates;

    if (nestedLevel > targetDegree) {
        normalizedCoordinates = coordinates.flat();
    } else if (nestedLevel === targetDegree) {
        normalizedCoordinates = coordinates;
    } else {
        normalizedCoordinates = [coordinates];
    }

    return normalizedCoordinates;
}

function getExternalGeometry(layer) {
    const layerGeometry = getLayerGeometry(layer);
    const externalCoords = [];
    const coordinates = layerGeometry.coordinates;
    const normalizedCoordinates = getNormalizedCoordinates(coordinates);

    if (layer.options.isGrid && layerGeometry.type === "MultiPolygon") {
        const polygonsGeometry = [];

        normalizedCoordinates.forEach(function (innerCoordinates) {
            const flattenedCoords = innerCoordinates.flatMap(subCoordinates =>
                subCoordinates.map(coord => [coord[1], coord[0]])
            );

            const polygonGeometry = L.polygon(flattenedCoords).toGeoJSON().geometry;
            polygonsGeometry.push(polygonGeometry);
        });

        const mergedGeometry = polygonsGeometry.reduce((merged, polygonGeometry) =>
            turf.union(merged, polygonGeometry)
        );

        const mergedCoordinates = mergedGeometry.geometry.coordinates ? mergedGeometry.geometry.coordinates : mergedGeometry.coordinates;
        const normalizedMergedCoordinates = getNormalizedCoordinates(mergedCoordinates);

        normalizedMergedCoordinates.forEach(coordinates => {
            externalCoords.push(coordinates[0]);
        });
    } else {
        normalizedCoordinates.forEach(coordinates => {
            externalCoords.push(coordinates[0]);
        });
    }

    return externalCoords;
}

function changeCircleradius(layer, radius) {
    const centerLatLng = layer.getBounds().getCenter();
    const centerPoint = turf.point([centerLatLng.lng, centerLatLng.lat]);
    const options = { steps: 64, units: 'meters' };
    const newCircle = turf.circle(centerPoint, radius, options);
    const circleCoords = newCircle.geometry.coordinates[0].map((coord) => [coord[1], coord[0]]);
    const newPolygon = L.polygon(circleCoords).addTo(map);
    const newArea = turf.area(newCircle) / 10000;
    newPolygon.options.source_area = newArea.toFixed(1);
    const layerCard = document.getElementById(layer._leaflet_id);
    CreateEl(newPolygon, 'Circle');
    if (layerCard) {
        setCardPositionAndStyle(layer, newPolygon)
        layerCard.remove();
    }
    layer.remove();
}

function changeCutPolygonArea(layer, length, width) {
    const layerGeometry = getLayerGeometry(layer);
    const externalGeometry = getExternalGeometry(layer);

    const normalizedCoordinates = getNormalizedCoordinates(layerGeometry.coordinates);

    const polygon1Coordinates = normalizedCoordinates.map(innerCoordinates => {
        return innerCoordinates.map(subCoordinates => {
            return subCoordinates.map(coord => [coord[1], coord[0]]);
        });
    });

    const polygon2Coordinates = externalGeometry.map((ring) =>
        ring.map((point) => [point[1], point[0]])
    );

    const polygon1 = L.polygon(polygon1Coordinates);
    const polygon2 = L.polygon(polygon2Coordinates);

    const polygon1Geometry = getLayerGeometry(polygon1);
    const polygon2Geometry = getLayerGeometry(polygon2);

    let differenceCoordinates = getDifference(polygon2Geometry, polygon1Geometry);
    const fixedDifferenceCoordinates = getNormalizedCoordinates(differenceCoordinates);

    function getDifference(polygon2, polygon1) {

        if (layer.options.merged_polygon && !layer.options.isGrid) {
            let difference = [];
            for (let i = 0; i < polygon1.coordinates.length; i++) {
                const p1 = L.polygon(polygon1.coordinates[i]);
                const p2 = L.polygon(polygon2.coordinates[i]);
                const p1Geometry = getLayerGeometry(p1);
                const p2Geometry = getLayerGeometry(p2);
                const diff = turf.difference(p2Geometry, p1Geometry);
                if (diff) {
                    difference.push(diff.geometry.coordinates);
                }
            }
            const fixedDifference = difference.map(innerCoordinates => {
                return innerCoordinates.map(subCoordinates => {
                    return subCoordinates.map(coord => [coord[1], coord[0]]);
                });
            });
            return fixedDifference;
        } else if (layer.options.merged_polygon && layer.options.isGrid) {
            let difference = [];
            const polygonsGeometry = [];

            polygon1.coordinates.forEach(function (innerCoordinates) {
                const flattenedCoords = innerCoordinates.flatMap(subCoordinates =>
                    subCoordinates.map(coord => [coord[1], coord[0]])
                );

                const polygonGeometry = L.polygon(flattenedCoords).toGeoJSON().geometry;
                polygonsGeometry.push(polygonGeometry);
            });

            const mergedGeometry = polygonsGeometry.reduce((merged, polygonGeometry) =>
                turf.union(merged, polygonGeometry)
            );

            const mergedCoordinates = mergedGeometry.geometry.coordinates ? mergedGeometry.geometry.coordinates : mergedGeometry.coordinates;
            const normalizedMergedCoordinates = getNormalizedCoordinates(mergedCoordinates);

            for (let i = 0; i < normalizedMergedCoordinates.length; i++) {
                const p1 = L.polygon(normalizedMergedCoordinates[i]);
                const p2 = L.polygon(polygon2.coordinates[i]);
                const p1Geometry = getLayerGeometry(p1);
                const p2Geometry = getLayerGeometry(p2);
                const diff = turf.difference(p2Geometry, p1Geometry);
                if (diff) {
                    difference.push(diff.geometry.coordinates);
                }
            }

            const fixedDifference = difference.map(innerCoordinates => {
                return innerCoordinates.map(subCoordinates => {
                    return subCoordinates.map(coord => [coord[1], coord[0]]);
                });
            });

            return fixedDifference;
        } else {
            const difference = turf.difference(polygon2, polygon1);
            return difference.geometry.coordinates;
        }
    }

    function changeCutEventHandler(e) {
        const clickedPoint = turf.point([e.latlng.lng, e.latlng.lat]);
        let foundDifference;

        fixedDifferenceCoordinates.forEach(function (polygonCoords) {
            const turfPolygon = turf.polygon(polygonCoords);

            if (turf.booleanPointInPolygon(clickedPoint, turfPolygon)) {
                foundDifference = turfPolygon;
            }
        });

        if (foundDifference) {
            const centerPoint = turf.center(foundDifference);
            const lat = centerPoint.geometry.coordinates[1];
            const lgt = centerPoint.geometry.coordinates[0];

            const mergedGeometry = turf.union(polygon1Geometry, foundDifference.geometry);
            const mergedCoordinates = mergedGeometry.geometry.coordinates;

            let fixedMergedCoordinates;
            if (layer.options.merged_polygon) {
                fixedMergedCoordinates = mergedCoordinates.map(innerCoordinates => {
                    return innerCoordinates.map(subCoordinates => {
                        return subCoordinates.map(coord => [coord[1], coord[0]]);
                    });
                });
            } else {
                fixedMergedCoordinates = mergedCoordinates.map((ring) =>
                    ring.map((point) => [point[1], point[0]])
                );
            }

            const mergedPolygon = L.polygon(fixedMergedCoordinates);
            mergedPolygon.options.isGrid = layer.options.isGrid ? layer.options.isGrid : undefined;
            mergedPolygon.options.value = layer.options.isGrid ? layer.options.value : undefined;
            mergedPolygon.options.rotateValue = layer.options.rotateValue ? layer.options.rotateValue : undefined;
            mergedPolygon.options.isHideGrid = layer.options.isHideGrid ? layer.options.isHideGrid : undefined;
            mergedPolygon.options.hideGridValue = layer.options.hideGridValue ? layer.options.hideGridValue : undefined;
            mergedPolygon.options.hideGridRotateValue = layer.options.hideGridRotateValue ? layer.options.hideGridRotateValue : undefined;
            mergedPolygon.options.merged_polygon = layer.options.merged_polygon ? layer.options.merged_polygon : undefined;
            mergedPolygon.options.added_external_polygon_id = layer.options.added_external_polygon_id ? layer.options.added_external_polygon_id : undefined;
            mergedPolygon.options.added_external_polygon_width = layer.options.added_external_polygon_width ? layer.options.added_external_polygon_width : undefined;

            mergedPolygon.addTo(map);

            setPolygonStyle(layer, mergedPolygon);

            CreateEl(mergedPolygon, 'Polygon');

            setCardPositionAndStyle(layer, mergedPolygon);

            removeLayerAndElement(layer);

            cutPolygonArea(mergedPolygon, length, width, lat, lgt);

            map.off('click', changeCutEventHandler);
        } else {
            alert('В указанной области не найден вырезанный полигон');
            map.off('click', changeCutEventHandler);
            return;
        }
    }

    map.on('click', changeCutEventHandler);
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
            const line = L.polyline([currentVertex, nextVertex], { color: 'red' }).addTo(map);
            lines.push(line);

            line.on('click', function (e) {
                L.DomEvent.stopPropagation(e);
                line.setStyle({ color: 'green' });
                const length = turf.length(line.toGeoJSON(), { units: 'meters' }).toFixed(2);
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
    ${type !== 'Line'
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
        layer.setStyle({ fillOpacity: opacity }); // Обновление стиля слоя
    }

    // Обновление значения ползунка и поля с толщиной для границы полигона
    function updateBorderWeight(value) {
        borderWeightSlider.value = value;
        borderWeightInput.value = value;
        layer.setStyle({ weight: value }); // Обновление стиля слоя
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

            $(`#PolygonWidth_${layerId}`).mask("9999.99", { placeholder: "Ширина полигона" });
            $(`#PolygonHeight_${layerId}`).mask("9999.99", { placeholder: "Высота полигона" });

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
    var inputRotateGrid = document.getElementById(`btnSendGridRotateValue${layerId}`)
    if (!inputRotateGrid) {
        inputRotateGrid = 0
    }
    var area = layer.options.source_area;
    var minValue;
    if (area <= 5) {
        minValue = 5;

    } else if (area < 1000 && area >= 100) {
        minValue = 10;
    } else if (area < 10000 && area >= 1000) {

        minValue = 100;
    }
    document.getElementById(`btnAddGrid_${layerId}`).addEventListener('click', function () {
        const div = document.getElementById(`addGrid_${layerId}`);
        const inputElement = document.getElementById("gridValue_" + layerId);

        if (div.style.display === 'none') {
            recommendedGridStep = calculateRecommendedGridStep(layer);
            recommendedGridStep = recommendedGridStep < 5 ? '5.00' : recommendedGridStep;
            inputElement.dataset.bsTitle = `Рекомендованный шаг сетки ${recommendedGridStep} м. Минимальный шаг сетки ${minValue} м.`;
            div.style.display = 'block';

            new bootstrap.Tooltip(inputElement);

            $(`#gridValue_${layerId}`).mask("9999.99", {
                placeholder: "Шаг сетки в метрах",
            });

        } else {
            div.style.display = 'none';
        }
    });

    inputGrid.addEventListener('input', function () {
        const inputElementValue = inputGrid.value.trim();
        const isNumeric = /^-?\d*\.?\d*$/.test(inputElementValue);

        if (inputElementValue >= minValue && isNumeric && inputElementValue !== ".") {
            btnSendGridValue.disabled = false;
            if (parseFloat(inputElementValue) < parseFloat(recommendedGridStep) && area > 100) {
                btnSendGridValue.setAttribute('data-bs-title', `Добавление сетки может замедлить работу сервера или привести к перезагрузке страницы.`);
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
        const rotateValue = document.getElementById(`gridRotateValue_${layerId}`).value;
        AddGrid(e.target, value, layer, rotateValue);
        contextMenu.remove();
    });
}

function AddChangeGridFunc(layer, layerId, contextMenu, e) {
    let recommendedGridStep;
    const inputChangeGrid = document.getElementById(`сhangeGridValue_${layerId}`);
    const inputChangeRotateGrid = document.getElementById(`сhangeGridRotateValue_${layerId}`);
    const btnChangeGridValue = document.getElementById(`btnChangeGridValue_${layerId}`);
    var area = layer.options.source_area;
    var minValue;
    if (area < 5) {
        minValue = 5;

    } else if (area < 1000 && area >= 100) {
        minValue = 10;
    } else if (area < 10000 && area >= 1000) {
        minValue = 100;
    }

    document.getElementById(`btnChangeGrid_${layerId}`).addEventListener('click', function () {
        const div = document.getElementById(`сhangeGrid_${layerId}`);
        const inputElement = document.getElementById("сhangeGridValue_" + layerId);

        if (div.style.display === 'none') {
            recommendedGridStep = calculateRecommendedGridStep(layer);
            recommendedGridStep = recommendedGridStep < 5 ? '5.00' : recommendedGridStep;
            inputElement.dataset.bsTitle = `Рекомендованный минимальный шаг сетки ${recommendedGridStep} м`;
            div.style.display = 'block';

            new bootstrap.Tooltip(inputElement);

            $(`#сhangeGridValue_${layerId}`).mask("9999.99", { placeholder: "Шаг сетки в метрах" });
        } else {
            div.style.display = 'none';
        }
    });

    inputChangeGrid.addEventListener('input', function () {
        const inputElementValue = inputChangeGrid.value.trim();
        const isNumeric = /^-?\d*\.?\d*$/.test(inputElementValue);

        if (inputElementValue >= minValue && isNumeric && inputElementValue !== ".") {
            btnChangeGridValue.disabled = false;
            if (parseFloat(inputElementValue) < parseFloat(recommendedGridStep) && area > 100) {
                btnChangeGridValue.setAttribute('data-bs-title', `Добавление сетки может замедлить работу сервера или привести к перезагрузке страницы.`);
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

    inputChangeRotateGrid.addEventListener('input', function () {
        btnChangeGridValue.disabled = false;
    })

    document.getElementById(`btnChangeGridValue_${layerId}`).addEventListener('click', function () {
        const value = document.getElementById(`сhangeGridValue_${layerId}`).value;
        const rotateValue = document.getElementById(`сhangeGridRotateValue_${layerId}`).value;
        AddGrid(e.target, value, layer, rotateValue);
        contextMenu.remove();
    });
}

function AddDeleteGridFunc(layer, layerId, contextMenu) {
    const originalGeometry = layer.options.originalGeometry;
    document.getElementById(`btnDeleteGrid_${layerId}`).addEventListener('click', function () {
        const originalLayer = L.geoJSON(originalGeometry).addTo(map);
        originalLayer.options.isCut = layer.options.isCut ? layer.options.isCut : undefined;
        originalLayer.options.cutArea = layer.options.cutArea ? layer.options.cutArea : undefined;
        originalLayer.options.added_external_polygon_id = layer.options.added_external_polygon_id ? layer.options.added_external_polygon_id : undefined;
        originalLayer.options.added_external_polygon_width = layer.options.added_external_polygon_width ? layer.options.added_external_polygon_width : undefined;
        CreateEl(originalLayer, 'Polygon')
        setCardPositionAndStyle(layer, originalLayer);
        document.getElementById(layerId).remove()
        layer.remove()
        contextMenu.remove()

        if (originalLayer.options.added_external_polygon_id) {
            const externalPolygonId = originalLayer.options.added_external_polygon_id;
            const externalPolygon = map._layers[externalPolygonId];
            const widthInDegrees = originalLayer.options.added_external_polygon_width;
            bindPolygons(originalLayer, externalPolygon, widthInDegrees)
        }
    });
}

function AddHideGridFunc(layer, layerId, contextMenu) {
    const originalGeometry = layer.options.originalGeometry;
    document.getElementById(`btnHideGrid_${layerId}`).addEventListener('click', function () {
        const originalLayer = L.geoJSON(originalGeometry).addTo(map);
        originalLayer.options.isHideGrid = true;
        originalLayer.options.hideGridValue = layer.options.value;
        originalLayer.options.hideGridRotateValue = layer.options.rotateValue;
        originalLayer.options.isCut = layer.options.isCut ? layer.options.isCut : undefined;
        originalLayer.options.cutArea = layer.options.cutArea ? layer.options.cutArea : undefined;
        originalLayer.options.added_external_polygon_id = layer.options.added_external_polygon_id ? layer.options.added_external_polygon_id : undefined;
        originalLayer.options.added_external_polygon_width = layer.options.added_external_polygon_width ? layer.options.added_external_polygon_width : undefined;
        originalLayer.options.hideGridRotateValue = layer.options.rotateValue;

        CreateEl(originalLayer, 'Polygon');

        setCardPositionAndStyle(layer, originalLayer);
        document.getElementById(layerId).remove()
        layer.remove()
        contextMenu.remove()

        if (originalLayer.options.added_external_polygon_id) {
            const externalPolygonId = originalLayer.options.added_external_polygon_id;
            const externalPolygon = map._layers[externalPolygonId];
            const widthInDegrees = originalLayer.options.added_external_polygon_width;
            bindPolygons(originalLayer, externalPolygon, widthInDegrees)
        }
    });
}

function AddShowGridFunc(layer, layerId, contextMenu) {
    document.getElementById(`btnShowGrid_${layerId}`).addEventListener('click', function () {
        AddGrid(layer, layer.options.hideGridValue, null, layer.options.hideGridRotateValue)
        contextMenu.remove()
    });
}

function RotateGridPoly(layer, layerId) {
    var currentAngle = 0
    const el = `
    <div class="mb-3" id="angle-rotate-container">
      <label for="angle-rotate-slider" class="form-label">Угол поворота полигона</label>
      <div class="angle-rotate-input-wrapper">
        <input type="range" class="form-range" id="angle-rotate-slider" min="0" max="360" value="${currentAngle}">
        <input type="number" class="form-control" id="angle-rotate-input" value="${currentAngle}">
        <div class="color-button" id="angle-rotate-button"></div>
      </div>
    </div>`;

    // Создание всплывающего окна
    const popup = L.popup({
        closeButton: true,
        className: 'custom-popup'
    }).setLatLng(map.getCenter()).setContent(el).openOn(map);


    var angleRotateSlider = document.getElementById('angle-rotate-slider');
    var angleRotateInput = document.getElementById('angle-rotate-input')
    var center = layer.getBounds().getCenter()
    var pivot = [center.lng, center.lat]
    var polygon = layer;

    function updateAngle(value) {
        var options = { pivot: pivot };
        var rotatedPoly = turf.transformRotate(polygon.toGeoJSON(), value, options);
        layer.remove()
        layer = L.geoJSON(rotatedPoly).addTo(map);
    }

    angleRotateSlider.addEventListener('input', function () {
        const value = parseInt(angleRotateSlider.value);
        angleRotateInput.value = value;
        updateAngle(value);
    });

    angleRotateInput.addEventListener('input', function () {
        const value = parseInt(angleRotateInput.value);
        updateAngle(value);

    });


}

function AddCopyGeoJSONFunc(layer, layerId, contextMenu) {
    document.getElementById(`copyGEOJSON_${layerId}`).addEventListener('click', function () {
        const options = {};
        options.width = layer.options.added_external_polygon_width ? layer.options.added_external_polygon_width : undefined;
        options.isGrid = layer.options.isGrid ? layer.options.isGrid : undefined;
        options.originalGeometry = layer.options.originalGeometry ? layer.options.originalGeometry : undefined;
        options.value = layer.options.isGrid ? layer.options.value : undefined;
        options.rotateValue = layer.options.rotateValue ? layer.options.rotateValue : undefined;
        options.isHideGrid = layer.options.isHideGrid ? layer.options.isHideGrid : undefined;
        options.hideGridValue = layer.options.hideGridValue ? layer.options.hideGridValue : undefined;
        options.hideGridRotateValue = layer.options.hideGridRotateValue ? layer.options.hideGridRotateValue : undefined;
        options.isFirstCut = layer.options.isFirstCut ? layer.options.isFirstCut : undefined;
        options.cutArea = layer.options.cutArea ? layer.options.cutArea : undefined;
        options.type = getLayerGeometry(layer).type;

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

function AddAreaFunc(layer, layerId, contextMenu) {
    const btnAddArea = document.getElementById(`btnAddArea_${layerId}`);
    const btnSendArea = document.getElementById(`btnSendArea_${layerId}`);
    const inputArea = document.getElementById(`AreaValue_${layerId}`);

    $(`#AreaValue_${layerId}`).mask("9999.99", { placeholder: "Ширина полигона в метрах" });

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

function AddChangeAreaFunc(layer, layerId, contextMenu) {
    const btnAddChangeArea = document.getElementById(`btnAddChangeArea_${layerId}`);
    const btnSendChangeArea = document.getElementById(`btnSendChangeArea_${layerId}`);
    const inputChangeArea = document.getElementById(`changeAreaValue_${layerId}`);

    $(`#changeAreaValue_${layerId}`).mask("9999.99", { placeholder: "Ширина полигона в метрах" });

    btnAddChangeArea.addEventListener('click', function () {
        const div = document.getElementById(`addChangeAreas_${layerId}`);
        div.style.display = div.style.display === 'none' ? 'block' : 'none';
    });

    inputChangeArea.addEventListener('input', function () {
        const inputElementValue = inputChangeArea.value.trim();
        const isNumeric = /^-?\d*\.?\d*$/.test(inputElementValue);

        if (inputElementValue && isNumeric && inputElementValue !== ".") {
            btnSendChangeArea.disabled = false;
        } else {
            btnSendChangeArea.disabled = true;
        }
    });

    btnSendChangeArea.addEventListener('click', function () {
        const value = document.getElementById(`changeAreaValue_${layerId}`).value;
        AddArea(layer, value, contextMenu);
    });
}

function changePolygonSize(layer, newWidth, newHeight) {
    const layerId = layer._leaflet_id;
    const width = parseFloat(newWidth);
    const height = parseFloat(newHeight);

    const center = layer.getCenter();
    const metersPerDegree = 111300;
    const { lat, lng } = center;
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

function unionPolygons(method, removeBtn, cancelBtn, finishBtn) {
    const userCreatedLayers = Object.values(map._layers)
        .filter(l => l.options && l.options.is_user_create);

    let clickedLayers = [];
    let layerStyle = {};
    let coords = [];

    let colorLastLayer;
    let fillColorLastLayer;
    let fillOpacityLastLayer;
    let weightLastLayer;

    userCreatedLayers.forEach(layer => {
        const layerId = layer._leaflet_id;
        const pmLayer = layer.pm._layers && layer.pm._layers[0];
        const color = pmLayer ? pmLayer.options.color : layer.options.color;
        let fillColor = pmLayer ? pmLayer.options.fillColor : layer.options.fillColor;
        const fillOpacity = pmLayer ? pmLayer.options.fillOpacity : layer.options.fillOpacity;
        const weight = pmLayer ? pmLayer.options.weight : layer.options.weight;

        if (fillColor === null) {
            fillColor = color;
        }

        layerStyle[layerId] = {
            'color': color,
            'fillColor': fillColor,
            'fillOpacity': fillOpacity,
            'weight': weight
        }

        function layerClickHandler() {
            const layerGeometry = getLayerGeometry(layer);
            const type = layerGeometry.type;
            if (type === 'Polygon' || type === 'MultiPolygon') {
                if (clickedLayers.includes(layer)) {
                    const layerIndex = clickedLayers.indexOf(layer);
                    clickedLayers.splice(layerIndex, 1);

                    const sourceStyle = layerStyle[layerId];
                    layer.setStyle({
                        fillColor: sourceStyle.fillColor,
                        color: sourceStyle.color,
                        fillOpacity: sourceStyle.fillOpacity,
                        weight: sourceStyle.weight
                    });
                } else {
                    clickedLayers.push(layer);
                    colorLastLayer = color;
                    fillColorLastLayer = fillColor;
                    fillOpacityLastLayer = fillOpacity;
                    weightLastLayer = weight;
                    layer.setStyle({ color: '#4CAF50CC', fillColor: '#4CAF50CC' });
                }
            } else {
                alert('Выбранный объект должен быть типа Полигон или Мультиполигон. Пожалуйста, выберите соответствующий тип объекта.');
            }
        }

        window['layerClickHandlerFunc_' + layerId] = layerClickHandler;
        layer.on('click', layerClickHandler);
    });

    removeBtn.addEventListener('click', removeBtnClickHandler);

    function removeBtnClickHandler(e) {
        e.stopPropagation();
        if (clickedLayers.length > 0) {
            const lastLayer = clickedLayers.pop();

            lastLayer.setStyle({
                fillColor: colorLastLayer,
                color: fillColorLastLayer,
                fillOpacity: fillOpacityLastLayer,
                weight: weightLastLayer
            });
        }
    }

    cancelBtn.addEventListener('click', cancelBtnClickHandler);
    window['cancelUnionPolygonsFunc'] = cancelBtnClickHandler;

    function cancelBtnClickHandler() {
        userCreatedLayers.forEach(layer => {
            let layerClickHandlerFunc = window['layerClickHandlerFunc_' + layer._leaflet_id];
            layer.off('click', layerClickHandlerFunc);
        });
        clickedLayers.forEach(layer => {
            const layerId = layer._leaflet_id;
            const sourceStyle = layerStyle[layerId];
            layer.setStyle({
                fillColor: sourceStyle.fillColor,
                color: sourceStyle.color,
                fillOpacity: sourceStyle.fillOpacity,
                weight: sourceStyle.weight
            });
        });
        cancelBtn.removeEventListener('click', cancelBtnClickHandler);
        finishBtn.removeEventListener('click', finishBtnClickHandler);
        return;
    }

    finishBtn.addEventListener('click', finishBtnClickHandler);

    function finishBtnClickHandler(e) {
        if (clickedLayers.length > 1) {
            let cutArea = 0;
            clickedLayers.forEach(layer => {
                const layerGeometry = getLayerGeometry(layer);
                const normalizedCoordinates = getNormalizedCoordinates(layerGeometry.coordinates);
                coords.push(normalizedCoordinates);

                if (layer.options.cutArea) {
                    cutArea += parseFloat(layer.options.cutArea);
                }
            });

            const newPolygonsGeometry = [];
            coords.forEach(function (innerCoordArray) {
                innerCoordArray.forEach(function (subCoordArray) {
                    const fixedCoords = subCoordArray.map(coordArray =>
                        coordArray.map(coord => [coord[1], coord[0]])
                    );

                    const newPolyGeometry = L.polygon(fixedCoords).toGeoJSON().geometry;
                    newPolygonsGeometry.push(newPolyGeometry);
                });
            });

            const mergedGeometry = newPolygonsGeometry.reduce((merged, polyGeometry) =>
                turf.union(merged, polyGeometry)
            );

            switch (method) {
                case "block":
                    createMergedPolygonLayer(mergedGeometry, cutArea);
                    break;
                case "convex":
                    const allVertices = getAllVertices(mergedGeometry);
                    const convexHull = getConvexHull(allVertices);
                    const polygon = turf.polygon(convexHull.geometry.coordinates);
                    createMergedPolygonLayer(polygon);
                    break;
            }

            userCreatedLayers.forEach(layer => {
                let layerClickHandlerFunc = window['layerClickHandlerFunc_' + layer._leaflet_id];
                layer.off('click', layerClickHandlerFunc);
            });

            clickedLayers.forEach(layer => {
                removeLayerAndElement(layer);
            });
            finishBtn.removeEventListener('click', finishBtnClickHandler);
            return;
        } else {
            e.stopPropagation();
            alert('Для объединения полигонов требуется указать как минимум два полигона. Пожалуйста, выберите два или более полигона для объединения.');
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

    function getConvexHull(allVertices) {
        const points = turf.featureCollection(allVertices.map(vertex => turf.point(vertex)));
        return turf.convex(points);
    }

    function createMergedPolygonLayer(geometry, cutArea = null) {
        const newLayer = L.geoJSON(geometry, {
            merged_polygon: true,
            cutArea: cutArea ? cutArea : undefined
        });

        newLayer.addTo(map);
        CreateEl(newLayer, 'Polygon');
    }
}


function writeAreaOrLengthInOption(layer, type) {
    if (type === 'Line') {
        layer.options.length = turf.length(layer.toGeoJSON(), { units: 'meters' }).toFixed(2);
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
function addObjectsAround(objectLat, objectLng, objectLayerId, radius) {

}

// function addObjectsAround(objectLat, objectLng, objectLayerId, radius) {
//     const selectType = document.getElementById(`typeObjectsAround_${objectLayerId}`);
//     const apartamentsObjects = document.getElementById(`apartamentsObjects_${objectLayerId}`);
//     const parksObjects = document.getElementById(`parksObjects_${objectLayerId}`);
//     const waterObjects = document.getElementById(`waterObjects_${objectLayerId}`);
//     const natureObjects = document.getElementById(`natureObjects_${objectLayerId}`);
//     selectType.style.display = "block"
//     const apartContainerPoligons = document.getElementById(`apartamentsPoligonsId_${objectLayerId}`);
//     const parkContainerPoligons = document.getElementById(`parksPoligonsId_${objectLayerId}`);
//     const waterContainerPoligons = document.getElementById(`waterPoligonsId_${objectLayerId}`);
//     const natureContainerPoligons = document.getElementById(`naturePoligonsId_${objectLayerId}`);
//     const apartCheckPoligon = document.getElementById(`apartamentsPoligon${objectLayerId}`);
//     const parkCheckPoligon = document.getElementById(`parksPoligon${objectLayerId}`);
//     const waterCheckPoligon = document.getElementById(`waterPoligon${objectLayerId}`);
//     const natureCheckPoligon = document.getElementById(`naturePoligon${objectLayerId}`);

//     const squareElement = document.getElementById(`square${layer._leaflet_id}`);

//     squareElement.innerHTML = `Площадь - ${area.toFixed(3)}`;


    
//     const query = `[out:json];
//     (
//     way(around:${radius}, ${objectLat}, ${objectLng})["natural"];
//     way(around:${radius}, ${objectLat}, ${objectLng})["building"];
//     way(around:${radius}, ${objectLat}, ${objectLng})["amenity" ];
//     way(around:${radius}, ${objectLat}, ${objectLng})["leisure"];
//     way(around:${radius}, ${objectLat}, ${objectLng})["waterway"];
//     way(around:${radius}, ${objectLat}, ${objectLng})["water"];
//     way(around:${radius}, ${objectLat}, ${objectLng})["tourism"];
//     way(around:${radius}, ${objectLat}, ${objectLng})["shop"];
//     );
//     out qt center geom;`

//     fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)

//         .then(response => response.json())
//         .then(data => {
//             const allObjectsData = data.elements;
//             allObjectsData.forEach(objectsData => {
//                 const building = objectsData.tags.building
//                 const amenity = objectsData.tags.amenity
//                 const leisure = objectsData.tags.leisure
//                 const water = objectsData.tags.water
//                 const waterway = objectsData.tags.waterway
//                 const natural = objectsData.tags.natural

//                 const minLon = objectsData.bounds.minlon;
//                 const minLat = objectsData.bounds.minlat;
//                 const maxLon = objectsData.bounds.maxlon;
//                 const maxLat = objectsData.bounds.maxlat;
//                 const centerLat = (minLat + maxLat) / 2;
//                 const centerLon = (minLon + maxLon) / 2;

//                 const markerGroupBuilding = L.layerGroup().addTo(map);
//                 const markerGroupLeisure = L.layerGroup().addTo(map);
//                 const markerGroupWater = L.layerGroup().addTo(map);
//                 const markerGroupNature = L.layerGroup().addTo(map);
//                 const polygonsGroupBuilding = L.layerGroup().addTo(map);
//                 const polygonsGroupLeisure = L.layerGroup().addTo(map);
//                 const polygonsGroupWater = L.layerGroup().addTo(map);
//                 const polygonsGroupNature = L.layerGroup().addTo(map);

//                 fetch('/static/translate_data.json')
//                     .then(response => response.json())
//                     .then(jsonData => {
//                         apartamentsObjects.addEventListener('change', function () {
//                             if (apartamentsObjects.checked) {
//                                 apartContainerPoligons.style.display = "block";
//                                 if (building || amenity) {
//                                     var greenIcon = new L.Icon({
//                                         iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//                                         shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//                                         iconSize: [25, 41],
//                                         iconAnchor: [12, 41],
//                                         popupAnchor: [1, -34],
//                                         shadowSize: [41, 41]
//                                     });
//                                     readJSONFile(amenity, building)
//                                     L.marker([centerLat, centerLon], { icon: greenIcon })
//                                         .addTo(markerGroupBuilding)
//                                         .bindPopup(objectsData.tags.name || jsonData[building] || jsonData[amenity] || objectsData.tags["addr:housenumber"])
//                                         .openPopup();
//                                     objectsPoligonstFunc(objectsData);
//                                 }
//                             } else {
//                                 markerGroupBuilding.clearLayers();
//                                 apartContainerPoligons.style.display = "none";
//                             }
//                         })
//                     });

//                 function objectsPoligonstFunc(poligonsObjData) {
//                     apartCheckPoligon.addEventListener('change', function () {
//                         if (apartCheckPoligon.checked) {
//                             const polygonCoordinates = poligonsObjData.geometry.map(coord => [coord.lat, coord.lon]);
//                             const polygon = L.polygon(polygonCoordinates, { color: 'red' });
//                             polygon.addTo(polygonsGroupBuilding);
//                         } else {
//                             polygonsGroupBuilding.clearLayers();
//                         }
//                     });
//                 }

//                 fetch('/static/translate_data.json')
//                     .then(response => response.json())
//                     .then(jsonData => {
//                         parksObjects.addEventListener('change', function () {
//                             if (parksObjects.checked) {
//                                 parkContainerPoligons.style.display = "block"
//                                 if (leisure) {
//                                     var greenIcon = new L.Icon({
//                                         iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//                                         shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//                                         iconSize: [25, 41],
//                                         iconAnchor: [12, 41],
//                                         popupAnchor: [1, -34],
//                                         shadowSize: [41, 41]
//                                     });
//                                     readJSONFile(leisure, natural)
//                                     L.marker([centerLat, centerLon], { icon: greenIcon }).addTo(markerGroupLeisure)
//                                         .bindPopup(objectsData.tags.name || jsonData[leisure] || jsonData[natural])
//                                         .openPopup();
//                                     parksPoligonstFunc(objectsData)
//                                 }
//                             } else {
//                                 markerGroupLeisure.clearLayers();
//                                 parkContainerPoligons.style.display = "none"
//                             }
//                         })
//                     });

//                 function parksPoligonstFunc(poligonsParksData) {
//                     parkCheckPoligon.addEventListener('change', function () {
//                         if (parkCheckPoligon.checked) {
//                             const polygonCoordinates = poligonsParksData.geometry.map(coord => [coord.lat, coord.lon]);
//                             const polygon = L.polygon(polygonCoordinates, { color: 'red' });
//                             polygon.addTo(polygonsGroupLeisure);
//                         } else {
//                             polygonsGroupLeisure.clearLayers();
//                         }
//                     });
//                 }

//                 fetch('/static/translate_data.json')
//                     .then(response => response.json())
//                     .then(jsonData => {
//                         waterObjects.addEventListener('change', function () {
//                             if (waterObjects.checked) {
//                                 waterContainerPoligons.style.display = "block"
//                                 if (water || waterway || natural === "water") {
//                                     var greenIcon = new L.Icon({
//                                         iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//                                         shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//                                         iconSize: [25, 41],
//                                         iconAnchor: [12, 41],
//                                         popupAnchor: [1, -34],
//                                         shadowSize: [41, 41]
//                                     });
//                                     readJSONFile(water, waterway)
//                                     L.marker([centerLat, centerLon], { icon: greenIcon }).addTo(markerGroupWater)
//                                         .bindPopup(objectsData.tags.name || jsonData[water] || jsonData[waterway])
//                                         .openPopup();
//                                     waterPoligonstFunc(objectsData)
//                                 }
//                             } else {
//                                 markerGroupWater.clearLayers();
//                                 waterContainerPoligons.style.display = "none"
//                             }
//                         })
//                     });

//                 function waterPoligonstFunc(poligonsWaterData) {
//                     waterCheckPoligon.addEventListener('change', function () {
//                         if (waterCheckPoligon.checked) {
//                             if (waterway === "river" || waterway === "stream" || waterway === "canal") {
//                                 const polygonCoordinates = poligonsWaterData.geometry.map(coord => [coord.lat, coord.lon]);
//                                 var riverPolyline = L.polyline(polygonCoordinates, { color: 'red' }).addTo(map);
//                                 riverPolyline.addTo(polygonsGroupWater);
//                             } else {
//                                 const polygonCoordinates = poligonsWaterData.geometry.map(coord => [coord.lat, coord.lon]);
//                                 const polygon = L.polygon(polygonCoordinates, { color: 'red' });
//                                 polygon.addTo(polygonsGroupWater);
//                             }
//                         } else {
//                             polygonsGroupWater.clearLayers();
//                         }
//                     });
//                 }

//                 fetch('/static/translate_data.json')
//                     .then(response => response.json())
//                     .then(jsonData => {
//                         natureObjects.addEventListener('change', function () {
//                             if (natureObjects.checked) {
//                                 natureContainerPoligons.style.display = "block"
//                                 if (natural) {
//                                     var greenIcon = new L.Icon({
//                                         iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//                                         shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//                                         iconSize: [25, 41],
//                                         iconAnchor: [12, 41],
//                                         popupAnchor: [1, -34],
//                                         shadowSize: [41, 41]
//                                     });
//                                     readJSONFile(natural)
//                                     L.marker([centerLat, centerLon], { icon: greenIcon }).addTo(markerGroupNature)
//                                         .bindPopup(objectsData.tags.name || jsonData[natural])
//                                         .openPopup();
//                                     naturePoligonstFunc(objectsData)
//                                 }
//                             } else {
//                                 markerGroupNature.clearLayers();
//                                 natureContainerPoligons.style.display = "none"
//                             }
//                         })
//                     });

//                 function naturePoligonstFunc(poligonsNatureData) {
//                     natureCheckPoligon.addEventListener('change', function () {
//                         if (natureCheckPoligon.checked) {
//                             const polygonCoordinates = poligonsNatureData.geometry.map(coord => [coord.lat, coord.lon]);
//                             const polygon = L.polygon(polygonCoordinates, { color: 'red' });
//                             polygon.addTo(polygonsGroupNature);
//                         } else {
//                             polygonsGroupNature.clearLayers();
//                         }
//                     });
//                 }
//             });
//         })
//         .catch(error => {
//             console.log(error)
//         });
// }

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
    const layerElement = document.getElementById(layer._leaflet_id);
    if (layerElement) {
        layerElement.remove();
    }
    layer.remove();
}


function disableMapEditMode(shape) {
    map.pm.disableDraw(shape);
    map.pm.disableGlobalEditMode();
}

function setPolygonStyle(layer1, layer2) {
    const pmLayer = layer1.pm._layers && layer1.pm._layers[0];
    const color = pmLayer ? pmLayer.options.color : layer1.options.color;
    let fillColor = pmLayer ? pmLayer.options.fillColor : layer1.options.fillColor;
    const fillOpacity = pmLayer ? pmLayer.options.fillOpacity : layer1.options.fillOpacity;
    const weight = pmLayer ? pmLayer.options.weight : layer1.options.weight;

    if (fillColor === null) {
        fillColor = color;
    }

    layer2.setStyle({
        fillColor: fillColor,
        color: color,
        fillOpacity: fillOpacity,
        weight: weight
    });
}

function AddArea(layer, value, contextMenu = null) {
    let layerJSON = getLayerGeometry(layer);
    const layerId = layer._leaflet_id;

    const layerType = layerJSON.type;

    if (layerType === 'LineString' || layerType === 'Point') {
        const buffered = turf.buffer(layerJSON, value, { units: 'meters' })
        const polygonLayer = L.geoJSON(buffered);

        removeOldExternalPolygon(layer);

        polygonLayer.addTo(map);
        polygonLayer.bringToBack();

        if (layerType === 'LineString') {
            setPolygonStyle(layer, polygonLayer);
        }

        layer.options.added_external_polygon_id = polygonLayer._leaflet_id;
        layer.options.added_external_polygon_width = value;

        let updateExternalPolygonHandler = window['updateExternalPolygonHandler_' + layerId];
        if (updateExternalPolygonHandler) {
            layer.off('pm:dragend', updateExternalPolygonHandler);
            updateExternalPolygonHandler = undefined;
            window['updateExternalPolygonHandler_' + layerId] = undefined;
        }

        bindPolygons(layer, polygonLayer, value);
        CreateEl(polygonLayer, "Polygon")

    } else {
        const externalPolygonCoords = [];

        const externalGeometry = getExternalGeometry(layer);

        for (let i = 0; i < externalGeometry.length; i++) {
            const bufferPolygon = turf.polygon([externalGeometry[i]]);
            const bufferPolygonGeometry = bufferPolygon.geometry;
            const buffered = turf.buffer(bufferPolygonGeometry, value, { units: 'meters' });
            const polygonLayer = L.geoJSON(buffered);
            const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, bufferPolygonGeometry);
            const differenceCoordinates = difference.geometry.coordinates;
            externalPolygonCoords.push(differenceCoordinates)
        }

        const fixedExternalPolygonCoords = externalPolygonCoords.map(innerCoordinates => {
            return innerCoordinates.map(subCoordinates => {
                return subCoordinates.map(coord => [coord[1], coord[0]]);
            });
        });

        let externalPolygon = L.polygon(fixedExternalPolygonCoords);

        removeOldExternalPolygon(layer);

        externalPolygon.addTo(map);
        externalPolygon.bringToBack();

        setPolygonStyle(layer, externalPolygon);

        layer.options.added_external_polygon_id = externalPolygon._leaflet_id;
        layer.options.added_external_polygon_width = value;

        writeAreaOrLengthInOption(layer);
        const totalArea = layer.options.total_area;

        const squareSpan = document.getElementById(`square${layerId}`);
        const parentSquareSpan = squareSpan.parentNode.parentNode;

        const html = `
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
            </div>
        `;

        parentSquareSpan.insertAdjacentHTML('afterend', html);

        const totalSquareTypeSelect = document.getElementById(`totalSquareType_${layerId}`);

        totalSquareTypeSelect.addEventListener('change', handleTotalSquareTypeChange);

        function handleTotalSquareTypeChange() {
            const squareElement = document.getElementById(`totalSquare${layerId}`);
            const selectedType = totalSquareTypeSelect.value;
            const convertedArea = convertArea(selectedType, totalArea);
            squareElement.textContent = `Общая площадь - ${convertedArea}`;
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

        let updateExternalPolygonHandler = window['updateExternalPolygonHandler_' + layerId];
        if (updateExternalPolygonHandler) {
            layer.off('pm:dragend', updateExternalPolygonHandler);
            updateExternalPolygonHandler = undefined;
            window['updateExternalPolygonHandler_' + layerId] = undefined;
        }

        bindPolygons(layer, externalPolygon, value);
    }
    if (contextMenu !== null) {
        contextMenu.remove();
    }
}

function bindPolygons(sourcePolygon, externalPolygon, value) {
    const layerId = sourcePolygon._leaflet_id;
    const dragEnableHandler = function (e) {
        if (!isRotating) {
            e.layer.pm.disableLayerDrag();
        }
    };
    const existingDragEnableHandler = window['dragEnableHandler_' + layerId];
    if (existingDragEnableHandler) {
        externalPolygon.off('pm:dragenable', existingDragEnableHandler);
    }
    window['dragEnableHandler_' + layerId] = dragEnableHandler;

    externalPolygon.on('pm:dragenable', dragEnableHandler);

    const rotateEnableHandler = function (e) {
        if (!isRotating) {
            e.layer.pm.disableRotate();
        }
    };
    const existingRotateEnableHandler = window['rotateEnableHandler_' + layerId];
    if (existingRotateEnableHandler) {
        externalPolygon.off('pm:rotateenable', existingRotateEnableHandler);
    }
    window['rotateEnableHandler_' + layerId] = rotateEnableHandler;
    externalPolygon.on('pm:rotateenable', rotateEnableHandler);

    const sourcePolygonType = getLayerGeometry(sourcePolygon).type;
    function updateExternalPolygon() {
        if (isRotating) {
            externalPolygon.pm.disableRotate();
        }
        let newExternalPolygon;
        if (sourcePolygonType === 'LineString' || sourcePolygonType === 'MultiLineString' || sourcePolygonType === 'Point') {
            let sourcePolygonJSON = getLayerGeometry(sourcePolygon);
            const buffered = turf.buffer(sourcePolygonJSON, value, { units: 'meters' });
            const fixedBufferedCoordinates = buffered.geometry.coordinates.map(ring =>
                ring.map(point => [point[1], point[0]])
            );

            newExternalPolygon = L.polygon(fixedBufferedCoordinates);
        } else {
            const externalPolygonCoords = [];
            const externalGeometry = getExternalGeometry(sourcePolygon);

            for (let i = 0; i < externalGeometry.length; i++) {
                const bufferPolygon = turf.polygon([externalGeometry[i]]);
                const bufferPolygonGeometry = bufferPolygon.geometry;
                const buffered = turf.buffer(bufferPolygonGeometry, value, { units: 'meters' });
                const polygonLayer = L.geoJSON(buffered);
                const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, bufferPolygonGeometry);
                const differenceCoordinates = difference.geometry.coordinates;
                externalPolygonCoords.push(differenceCoordinates);
            }

            const fixedExternalPolygonCoords = externalPolygonCoords.map(innerCoordinates =>
                innerCoordinates.map(subCoordinates =>
                    subCoordinates.map(coord => [coord[1], coord[0]])
                )
            );

            newExternalPolygon = L.polygon(fixedExternalPolygonCoords);
        }


        removeOldExternalPolygon(sourcePolygon);

        newExternalPolygon.addTo(map).bringToBack();
        newExternalPolygon.pm.disableLayerDrag();
        newExternalPolygon.pm.disableRotate();

        externalPolygon.setLatLngs(newExternalPolygon.getLatLngs());
        sourcePolygon.options.added_external_polygon_id = newExternalPolygon._leaflet_id;

    }

    const existingUpdateExternalPolygonHandler = window['updateExternalPolygonHandler_' + layerId];
    if (existingUpdateExternalPolygonHandler) {
        sourcePolygon.off('pm:dragend', existingUpdateExternalPolygonHandler);
        sourcePolygon.off('pm:rotateend', existingUpdateExternalPolygonHandler);
    }
    window['updateExternalPolygonHandler_' + layerId] = updateExternalPolygon;
    sourcePolygon.options.update_external_polygon_handler = true;

    sourcePolygon.on('pm:dragend', updateExternalPolygon);

    sourcePolygon.on('pm:rotatestart', function () {
        isRotating = true;
    });
    sourcePolygon.on('pm:rotateend', function () {
        isRotating = false;
        updateExternalPolygon();

    });

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
                ${type === 'Marker' || type === 'CircleMarker' || type === "CircleNumberMarker" ? `
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

                        <div class="row" ${layer.options.isGrid ? ' style="display: flex;  align-items: center;"' : 'style="display: none;"'}>
                            <span>Шаг сетки ${layer.options.isGrid ? layer.options.value : ''} м.</span>
                        </div>
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
        <div class="col">
        <span id='radiusObjectsAround${layerId}'>Радиус - </span>    
    </div>
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
            const length = turf.length(layer.toGeoJSON(), { units: selectedType }).toFixed(2);
            lengthElement.textContent = `Длина - ${length}`;
        });
    } else if (type !== "Marker") {
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

        if (isBuildingCheckbox) {
            isBuildingCheckbox.addEventListener('change', function () {
                if (isBuildingCheckbox.checked) {
                    buildingInfo.style.display = 'block';
                    isPlotCheckbox.checked = false;
                    cadastralNumber.style.display = 'none';
                } else {
                    buildingInfo.style.display = 'none';
                }
            });
        }

        if (isPlotCheckbox) {
            isPlotCheckbox.addEventListener('change', function () {
                if (isPlotCheckbox.checked) {
                    buildingInfo.style.display = 'none';
                    cadastralNumber.style.display = 'block';
                    isBuildingCheckbox.checked = false;
                } else {
                    cadastralNumber.style.display = 'none';
                }
            });
        }

        if (type !== "CircleMarker") {
            if (squareTypeSelect) {
                squareTypeSelect.addEventListener('change', handleSquareTypeChange);
            }
            if (totalSquareTypeSelect) {
                totalSquareTypeSelect.addEventListener('change', handleTotalSquareTypeChange);
            }
            if (cutSquareTypeSelect) {
                cutSquareTypeSelect.addEventListener('change', handleCutSquareTypeChange);
            }
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

function AddGrid(layer, value, originalLayer = null, rotateValue = null) {
    const feature = layer.options.isGrid && layer.options.originalGeometry
        ? layer.options.originalGeometry
        : (layer.toGeoJSON().features && layer.toGeoJSON().features[0]) ? layer.toGeoJSON().features[0] : layer.toGeoJSON();
    const type = feature.geometry.type === 'MultiPolygon' ? 'Polygon' : feature.geometry.type;
    const pmLayer = layer.pm._layers && layer.pm._layers[0];
    const color = pmLayer ? pmLayer.options.color : layer.options.color;
    let fillColor = pmLayer ? pmLayer.options.fillColor : layer.options.fillColor;
    const fillOpacity = pmLayer ? pmLayer.options.fillOpacity : layer.options.fillOpacity;
    const weight = pmLayer ? pmLayer.options.weight : layer.options.weight;
    if (fillColor === null) {
        fillColor = color;
    }
    const clippedGridLayer = L.geoJSON();
    value = value ? value : layer.options.value;

    var bufferArea = (turf.area(layer.toGeoJSON()) / 10000).toFixed(3)
    if (bufferArea <= 5) {
        bufferArea = 50
    }
    const center = turf.centerOfMass(feature)
    const pivot = center.geometry.coordinates;

    if (rotateValue) {
        const rotateOptions = { pivot: pivot };
        const buffer = turf.buffer(feature, bufferArea * 2, { units: 'meters' })
        const options = { units: 'meters', mask: buffer };
        const bufferedBbox = turf.bbox(buffer);
        const squareGrid = turf.squareGrid(bufferedBbox, value, options);

        turf.featureEach(squareGrid, function (currentFeature) {
            var rotatedPoly = turf.transformRotate(currentFeature, Number(rotateValue), rotateOptions);
            const intersected = turf.intersect(feature, rotatedPoly);
            if (intersected) {
                clippedGridLayer.addData(intersected);
            }
        });
    } else {
        const options = { units: 'meters', mask: feature };
        const bufferedBbox = turf.bbox(turf.buffer(feature, value, options));
        const squareGrid = turf.squareGrid(bufferedBbox, value, options);

        turf.featureEach(squareGrid, function (currentFeature) {
            const intersected = turf.intersect(feature, currentFeature);
            if (intersected) {
                clippedGridLayer.addData(intersected);
            }
        });
    }

    const combined = turf.combine(clippedGridLayer.toGeoJSON(), feature);
    const polygon = L.geoJSON(combined)
    polygon.pm.enable({
        dragMiddleMarkers: false,
        limitMarkersToCount: 8,
        hintlineStyle: { color: color }
    });

    const newLayer = polygon.getLayers()[0];
    if (rotateValue) {
        newLayer.options.rotateValue = rotateValue;
    }

    newLayer.options.isGrid = true;
    newLayer.options.value = value;
    newLayer.options.originalGeometry = layer.options.originalGeometry ? layer.options.originalGeometry : feature;
    newLayer.options.merged_polygon = layer.options.merged_polygon ? layer.options.merged_polygon : undefined;
    newLayer.options.hide = 1;


    if (layer.options.is_cadastral) {
        const { is_cadastral, cadastral_number } = layer.options;
        Object.assign(newLayer.options, { is_cadastral, cadastral_number });
    }

    if (layer.options.added_external_polygon_width) {
        const { total_area, added_external_polygon_id, added_external_polygon_width } = layer.options;
        Object.assign(newLayer.options, { total_area, added_external_polygon_id, added_external_polygon_width });
    }

    if (layer.options.cutArea) {
        const { isCut, cutArea } = layer.options;
        Object.assign(newLayer.options, { isCut, cutArea });
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

    setCardPositionAndStyle(layer, newLayer);

    const id = (originalLayer || layer)._leaflet_id;
    const element = document.getElementById(id);

    if (element) {
        element.remove();
    }

    (originalLayer || layer).remove();
    layer.remove();

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
            layer.setStyle({ fillColor: color.toRGBA().toString() });
            const sliderInputWrapper = document.querySelector(".fill-slider-input-wrapper");
            const button = sliderInputWrapper.querySelector("button.pcr-button");
            button.style.setProperty("--pcr-color", color.toRGBA().toString());
        } else if (styleType === 'border') {
            layer.setStyle({ color: color.toRGBA().toString() });
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