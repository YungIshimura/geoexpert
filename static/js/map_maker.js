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

L.control.zoom({ position: "topright" }).addTo(map);

const options = {
    position: "topleft",
    drawMarker: true,
    drawPolygon: true,
    drawPolyline: true,
    drawRectangle: false,
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

    CreateEl(layer, type)
    AddEditArea(layer)
});


function AddEditArea(layer) {
    layer.on('pm:edit', (e) => {
        if (!e.layer.cutted &&
            (e.shape === 'Polygon' ||
                e.shape === 'Rectangle' ||
                e.shape === 'Circle')
        ) {
            let area = turf.area(layer.toGeoJSON()) / 10000;
            const squareElement = document.getElementById(`square${layer._leaflet_id}`);
            squareElement.innerHTML = `Площадь - ${area.toFixed(3)} га`;
        }
    });
}

// TODO посмотреть варианты для переделывания


// map.on('pm:cut', function (e) {
//     let previousLayer;
//     let layer = e.layer;
//     let originalLayer = e.originalLayer;
//     var polyFlag = 0;
//     var gridFlag = 1;

//     e.originalLayer.cutted = true;
//     if (layer.options.isGrid) {
//         AddGrid(layer, originalLayer)
//         gridFlag--;
//     }
//     try {
//         document.getElementById(originalLayer._leaflet_id).remove()
//     } catch {
//     }
//     let polygonsDiff = turf.difference(originalLayer.toGeoJSON(), layer.toGeoJSON());
//     let cuttedPolygon = L.geoJSON(polygonsDiff, {
//         style: {
//             fillOpacity: 0,
//             weight: 2,
//         }
//     }).addTo(map)

//     layer.on('pm:remove', function (e) {
//         cuttedPolygon.remove()
//     })

//     layer.on('pm:drag', function (e) {
//         let cuttedPolygonCoords = e.layer.toGeoJSON().geometry.coordinates[1]
//         var swappedCoordinates = cuttedPolygonCoords.map(function (coord) {
//             var latitude = coord[0];
//             var longitude = coord[1];
//             return [longitude, latitude];
//         });
//         let cuttedPoly = cuttedPolygon.getLayers()[0]
//         cuttedPoly.setLatLngs(swappedCoordinates)

//         layer.on('pm:dragend', function (e) {
//             let polygonCoords = e.layer.toGeoJSON().geometry.coordinates[0]
//             var swappedCoordinates = polygonCoords.map(function (coord) {
//                 return [coord[1], coord[0]];
//             });
//             originalLayer = L.polygon(swappedCoordinates)
//         })
//     })

//     cuttedPolygon.on('pm:edit', function (e) {
//         var diffPoly;
//         var cuttedGeoJSON = cuttedPolygon.toGeoJSON().features[0].geometry;

//         if (polyFlag) {
//             var coords = originalLayer.geometry.coordinates[0]
//             var swappedCoordinates = coords.map(function (coord) {
//                 return [coord[1], coord[0]];
//             });
//             var polygon = L.polygon(swappedCoordinates);
//             diffPoly = turf.difference(polygon.toGeoJSON().geometry, cuttedGeoJSON);
//         } else {
//             diffPoly = turf.difference(originalLayer.toGeoJSON().geometry, cuttedGeoJSON);
//         }

//         var newLayer = L.geoJSON(diffPoly);
//         if (previousLayer) {
//             map.removeLayer(previousLayer);
//         }
//         newLayer.addTo(map);
//         previousLayer = newLayer;

//         previousLayer.on('pm:edit', function (e) {
//             originalLayer = previousLayer.toGeoJSON().features[0];
//             polyFlag++;
//             var poly_coords = e.layer.toGeoJSON().geometry.coordinates[1];
//             var swappedCoordinates = poly_coords.map(function (coord) {
//                 return [coord[1], coord[0]];
//             });
//             var cuttedPoly = cuttedPolygon.getLayers()[0];
//             cuttedPoly.setLatLngs(swappedCoordinates);
//         });

//         previousLayer.on('pm:remove', function (e) {
//             cuttedPolygon.remove()
//         })
//         layer.remove();
//     });
//     if (gridFlag) {
//         CreateEl(layer, 'Polygon')
//         gridFlag++;
//     }

//     AddEditFuncs(layer)
// })


map.on('pm:remove', (e) => {
    let layer = e.layer;
    let id = layer._leaflet_id;
    let element = document.getElementById(id);
    if (element) {
        element.remove();
    }
    else {
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

map.on("click", function (e) {
    const markerPlace = document.querySelector(".marker-position");
    markerPlace.textContent = e.latlng;
});

map.on('dblclick', function (e) {
    const contextMenu = L.popup({ closeButton: true })
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
                    CreateEl(mergedPolygons, 'Polygon');
                    mergedPolygons.options.is_copy_polygons = true;

                    if (optionsSoucePolygon && !optionsSoucePolygon.isGrid && optionsSoucePolygon.width) {
                        const value = optionsSoucePolygon.width;
                        AddArea(mergedPolygons, value, null);
                    }

                    if (optionsSoucePolygon && optionsSoucePolygon.isGrid && !optionsSoucePolygon.width) {
                        const cellWidth = optionsSoucePolygon.cellWidth;
                        AddGrid(mergedPolygons, null, cellWidth);
                    }

                    if (optionsSoucePolygon && optionsSoucePolygon.isGrid && optionsSoucePolygon.width) {
                        const options = {
                            isGrid: optionsSoucePolygon.isGrid,
                            originalGeometry: mergedPolygons.toGeoJSON().features[0],
                            cellWidth: optionsSoucePolygon.cellWidth,
                            width: optionsSoucePolygon.width,
                        };
                        Object.assign(mergedPolygons.options, options);
                        const value = optionsSoucePolygon.width;
                        AddArea(mergedPolygons, value, null);
                    }

                    // if (optionsSoucePolygon && optionsSoucePolygon.isGrid) {
                    //     const cellWidth = optionsSoucePolygon.cellWidth;
                    //     AddGrid(mergedPolygons, null, cellWidth);
                    // }

                } else {
                    const newCoords = coords[0][0].map(coord =>
                        [coord[1] + differenceLat, coord[0] + differenceLng]
                    );
                    const newPoly = L.polygon(newCoords).addTo(map);
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
            { title: 'Добавить кадастровый номер', iconClass: 'bi bi-pencil-square', modalId: '#addCadastralModal' },
            { title: 'Построить полигон', iconClass: 'bi bi-plus-square', modalId: '#createPolygonModal' },
            { title: 'Выгрузить данные в заявку', iconClass: 'bi bi-upload', modalId: '#uploadDataModal' }
        ];

        buttons.forEach(button => {
            const buttonElement = L.DomUtil.create('a', 'leaflet-buttons-control-button', container);
            const iconElement = L.DomUtil.create('i', button.iconClass, buttonElement);

            buttonElement.setAttribute('title', button.title);
            buttonElement.addEventListener('click', function () {
                $(button.modalId).modal('show');
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

function createRectangle() {
    const lengthInput = document.getElementById('lengthInput');
    const widthInput = document.getElementById('widthInput');
    const square = document.getElementById('square');

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

    const polygon = L.polygon([southWest, northWest, northEast, southEast]);
    polygon.on('pm:edit', function () {
        const area = turf.area(polygon.toGeoJSON()) / 10000;
        square.innerHTML = `Площадь - ${area.toFixed(3)} га`
    });
    map.fitBounds(polygon.getBounds());

    CreateEl(polygon, 'Polygon');

    lengthInput.value = '';
    widthInput.value = '';
}

function CreateEl(layer, type, externalPolygon = null, sourceLayerOptions = null) {
    const layerId = layer._leaflet_id;
    let flag = 1;
    let el = `<div><a type="button" id="copyGEOJSON_${layerId}">Копировать элемент</a></div>`;
    let recommendedGridStep;

    if (type === 'Circle' || type === 'Polygon' || type === 'Rectangle') {
        layer.on('contextmenu', function (e) {
            const myLat = e.latlng['lat']
            const myLng = e.latlng['lng']
            const content = `${el} 
            <div><a type="button" id="btnAddGrid_${layerId}"${layer.options.isGrid ? ' style="display: none"' : ''}>Добавить сетку</a></div>
            <div class="mb-3" id="addGrid_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="gridValue_${layerId}" placeholder="Шаг сетки" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnSendGridValue_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
            </div>
            <div><a type="button" id="btnChangeGrid_${layerId}"${!layer.options.isGrid ? ' style="display: none"' : ''}>Изменить сетку</a></div>
            <div class="mb-3" id="сhangeGrid_${layerId}" style="display: none">
                <input type="text" class="form-control form-control-sm" id="сhangeGridValue_${layerId}" placeholder="Шаг сетки" style="margin-left: 10px;">
                <button type="button" class="btn btn-light btn-sm" id="btnChangeGridValue_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
            </div>

            <div class="mb"><a type="button" id="btnAddArea_${layerId}">Добавить полигон вокруг</a></div>
            <div class="mb-3" id="addAreas_${layerId}" style="display: none">
                        <input type="text" class="form-control form-control-sm" id="AreaValue_${layerId}" placeholder="Ширина полигона" style="margin-left: 10px;">
                        <button type="button" class="btn btn-light btn-sm" id="btnSendArea_${layerId}" style="margin: 10px 0 0 10px; height: 25px; display: flex; align-items: center;">Добавить</button>
                    </div>
            <div><a type="button" id="btnUnionPolygon_${layerId}">Объединить полигоны</a></div>
            <div><a type="button" id="btnChangeColor_${layerId}">Изменить цвет</a></div>

            <div id="colorPalette_${layerId}" style="display: none"></div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddChangeColorFunc(layer, layerId)
            AddAreaFunc(layer, layerId, contextMenu)

            document.getElementById(`btnAddGrid_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`addGrid_${layerId}`);

                if (div.style.display === 'none') {
                    recommendedGridStep = calculateRecommendedGridStep(layer);

                    if (recommendedGridStep.length > 1) {
                        showMessageModal('info', `Рекомендованный шаг сетки от ${recommendedGridStep[0]} до ${recommendedGridStep[1]} метров`);
                    } else {
                        showMessageModal('info', `Рекомендованный шаг сетки ${recommendedGridStep} метров`);
                    }

                    div.style.display = 'block';
                } else {
                    div.style.display = 'none';
                }
            });

            document.getElementById(`btnSendGridValue_${layerId}`).addEventListener('click', function () {
                const value = document.getElementById(`gridValue_${layerId}`).value;
                if (isValueInRange(value, recommendedGridStep)) {
                    AddGrid(e.target, layer, value);
                } else {
                    showMessageModal('error', `Введите число в рекомендованном диапозоне`);
                }
                contextMenu.remove();
            });

            document.getElementById(`btnChangeGrid_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`сhangeGrid_${layerId}`);

                if (div.style.display === 'none') {
                    recommendedGridStep = calculateRecommendedGridStep(layer);

                    if (recommendedGridStep.length > 1) {
                        showMessageModal('info', `Рекомендованный шаг сетки от ${recommendedGridStep[0]} до ${recommendedGridStep[1]} метров`);
                    } else {
                        showMessageModal('info', `Рекомендованный шаг сетки ${recommendedGridStep} метров`);
                    }

                    div.style.display = 'block';
                } else {
                    div.style.display = 'none';
                }
            });

            document.getElementById(`btnChangeGridValue_${layerId}`).addEventListener('click', function () {
                const value = document.getElementById(`сhangeGridValue_${layerId}`).value;
                if (isValueInRange(value, recommendedGridStep)) {
                    AddGrid(e.target, layer, value);
                } else {
                    showMessageModal('error', `Введите число в рекомендованном диапозоне`);
                }
                contextMenu.remove();
            });

            document.getElementById(`copyGEOJSON_${layerId}`).addEventListener('click', function () {
                const options = {};
                if (layer.options.added_external_polygon_width) {
                    options.width = layer.options.added_external_polygon_width;
                }
                if (layer.options.isGrid) {
                    options.isGrid = layer.options.isGrid;
                    options.cellWidth = layer.options.cellWidth;
                }
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

            document.getElementById(`btnUnionPolygon_${layerId}`).addEventListener('click', function () {
                showMessageModal('info', 'Выберите полигон для объединения');
                mergedPolygons(layer, contextMenu);
            });
        });
    } else if (type === 'Line') {
        layer.on('contextmenu', function (e) {
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
            <div><a type="button" id="btnChangeColor_${layerId}">Изменить цвет</a></div>
            <div id="colorPalette_${layerId}" style="display: none"></div>
            <div><a type="button" id="btnContinueLine_${layerId}">Продолжить линию</a></div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`;
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddChangeColorFunc(layer, layerId)
            AddAreaFunc(layer, layerId, contextMenu)

            document.getElementById(`btnAddMarkers_${layerId}`).addEventListener('click', function () {
                if (flag) {
                    const stepValue = document.getElementById(`StepValue_${layerId}`).value;
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
            const myLat = e.latlng['lat']
            const myLng = e.latlng['lng']
            const content = `${el}
            <div><a type="button" id="btnChangeColor_${layerId}">Изменить цвет</a></div>
            <div id="colorPalette_${layerId}" style="display: none"></div>
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);

            AddChangeColorFunc(layer, layerId)
        });
    } else if (type == 'Marker') {
        layer.on('contextmenu', function (e) {
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
            <div><a type="button" onclick="addObjectsAround(${myLat}, ${myLng}, ${layerId})">Добавить муниципальные здания</a></div>`;
            const contextMenu = L.popup({ closeButton: true })
                .setLatLng(e.latlng)
                .setContent(content);
            contextMenu.openOn(map);
            AddAreaFunc(layer, layerId, contextMenu)

            document.getElementById(`btnAddCircle_${layerId}`).addEventListener('click', function () {
                const div = document.getElementById(`addACircle_${layerId}`);
                div.style.display = div.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById(`btnSendCircleArea_${layerId}`).addEventListener('click', function () {
                const value = document.getElementById(`CircleAreaValue_${layerId}`).value;
                const center = layer.getLatLng();
                L.circle(center, { radius: value }).addTo(map)
                contextMenu.remove()
            });
        });
    }
    fg.addLayer(layer);

    layer.options.is_user_create = true;

    writeAreaOrLengthInOption(layer, type, externalPolygon, sourceLayerOptions);
    createSidebarElements(layer, type);
}

function AddChangeColorFunc(layer, layerId) {
    const div = document.getElementById(`colorPalette_${layerId}`);
    const picker = createPalette(div, layer);
    const button = document.querySelector(".pcr-button");
    button.style.display = 'none';
    let isPaletteVisible = false;

    document.getElementById(`btnChangeColor_${layerId}`).addEventListener('click', function (event) {
        if (!isPaletteVisible) {
            picker.show();
            isPaletteVisible = true;
        } else {
            picker.hide();
            isPaletteVisible = false;
        }
    });

}

function AddAreaFunc(layer, layerId, contextMenu) {
    document.getElementById(`btnAddArea_${layerId}`).addEventListener('click', function () {
        const div = document.getElementById(`addAreas_${layerId}`);
        div.style.display = div.style.display === 'none' ? 'block' : 'none';

    });

    document.getElementById(`btnSendArea_${layerId}`).addEventListener('click', function () {
        const value = document.getElementById(`AreaValue_${layerId}`).value;
        AddArea(layer, value, contextMenu);
    });
}

function calculateRecommendedGridStep(layer) {
    const area = parseFloat(layer.options.total_area ? layer.options.total_area : layer.options.source_area);
    let stepValue = [];

    if (area >= 0.001 && area <= 0.01) {
        stepValue.push(2, 5);
    } else if (area > 0.01 && area <= 0.1) {
        stepValue.push(5, 15);
    } else if (area > 0.1 && area <= 0.5) {
        stepValue.push(5, 20);
    } else if (area > 0.5 && area <= 1) {
        stepValue.push(5, 40);
    } else if (area > 1 && area <= 20) {
        stepValue.push(10, 150);
    } else if (area > 20 && area <= 50) {
        stepValue.push(20, 200);
    } else if (area > 50 && area <= 100) {
        stepValue.push(30, 300);
    } else if (area > 100 && area <= 200) {
        stepValue.push(40, 400);
    } else if (area > 200 && area <= 400) {
        stepValue.push(50, 500);
    }

    return stepValue;
}

function isValueInRange(value, recommendedGridStep) {
    return value >= recommendedGridStep[0] && value <= recommendedGridStep[1];
}

function mergedPolygons(layer, contextMenu) {
    const userCreatedLayers = Object.values(map._layers)
        .filter(l => l.options && l.options.is_user_create);

    function mergedPolygonslEventHandler(e) {
        const clickedLatLng = e.latlng;
        let polygonWithPoint = null;

        for (const userLayer of userCreatedLayers) {
            const feature = getFeatureFromLayer(userLayer);

            if (isPolygonOrMultiPolygon(feature)) {
                const isPointInPolygon = isPointInsidePolygon(clickedLatLng, feature.geometry);

                if (isPointInPolygon) {
                    polygonWithPoint = userLayer;
                    break;
                }
            }
        }

        if (polygonWithPoint !== null) {
            if (layer._leaflet_id === polygonWithPoint._leaflet_id) {
                showMessageModal("error", "Вы не можете объединить один полигон");
            } else {
                const layerGeometry = getLayerGeometry(layer);
                const clickedLayerGeometry = getLayerGeometry(polygonWithPoint);
                const mergedGeometry = turf.union(layerGeometry, clickedLayerGeometry);
                const mergedLayer = createMergedLayer(mergedGeometry);

                removeExternalPolygon(layer);
                removeExternalPolygon(polygonWithPoint);
                removeLayerAndElement(layer);
                removeLayerAndElement(polygonWithPoint);

                mergedLayer.addTo(map);
                CreateEl(mergedLayer, 'Polygon');
            }
        } else {
            showMessageModal("error", "Нужно выбрать полигон");
        }
        map.off('click', mergedPolygonslEventHandler);
    }

    function getFeatureFromLayer(layer) {
        const layerGeoJSON = layer.toGeoJSON();

        return layerGeoJSON.features ? layerGeoJSON.features[0] : layerGeoJSON;
    }

    function isPolygonOrMultiPolygon(feature) {
        const type = feature.geometry.type;
        return type === 'Polygon' || type === 'MultiPolygon';
    }

    function isPointInsidePolygon(clickedLatLng, geometry) {
        const layerGeoJSONGeometry = geometry;

        return turf.booleanPointInPolygon(
            [clickedLatLng.lng, clickedLatLng.lat],
            layerGeoJSONGeometry
        );
    }

    function getLayerGeometry(layer) {
        const layerGeoJSON = layer.toGeoJSON();

        return layerGeoJSON.features ? layerGeoJSON.features[0].geometry : layerGeoJSON.geometry;
    }

    function createMergedLayer(mergedGeometry) {
        return L.geoJSON(mergedGeometry, {
            merged_polygon: true
        });
    }

    function removeExternalPolygon(layer) {
        const externalPolygonId = layer.options.added_external_polygon_id;
        const targetLayer = getLayerById(externalPolygonId);

        if (targetLayer) {
            targetLayer.remove();
        }
    }

    function getLayerById(id) {
        return map._layers[id] || null;
    }

    map.on('click', mergedPolygonslEventHandler);

    contextMenu.remove();
}

function writeAreaOrLengthInOption(layer, type, externalPolygon, sourceLayerOptions) {
    if (externalPolygon) {
        const sourcePolygonArea = sourceLayerOptions.source_area;
        const externalPolygonArea = (turf.area(externalPolygon.toGeoJSON()) / 10000).toFixed(3);
        const totalArea = (parseFloat(externalPolygonArea) + parseFloat(sourcePolygonArea)).toFixed(3);

        layer.options = {
            ...layer.options,
            source_area: sourcePolygonArea,
            total_area: totalArea
        };
    } else {
        if (type === 'Line') {
            layer.options.length = turf.length(layer.toGeoJSON(), { units: 'meters' }).toFixed(2);
        } else {
            layer.options.source_area = (turf.area(layer.toGeoJSON()) / 10000).toFixed(3);
        }
    }
}

function writeAreaOrLengthInOption(layer, type, externalPolygon, sourceLayerOptions) {
    if (externalPolygon) {
        const sourcePolygonArea = sourceLayerOptions.source_area;
        const externalPolygonArea = (turf.area(externalPolygon.toGeoJSON()) / 10000).toFixed(3);
        const totalArea = (parseFloat(externalPolygonArea) + parseFloat(sourcePolygonArea)).toFixed(3);

        Object.assign(layer.options, {
            source_area: sourcePolygonArea,
            total_area: totalArea
        });

    } else {
        if (type === 'Line') {
            layer.options.length = turf.length(layer.toGeoJSON(), { units: 'meters' }).toFixed(2);
        } else {
            layer.options.source_area = (turf.area(layer.toGeoJSON()) / 10000).toFixed(3)
        }
    }
}

function addObjectsAround(objectLat, objectLng, objectLayerId) {
    const radius = 300;
    const selectType = document.getElementById(`typeObjectsAround_${objectLayerId}`);
    const apartamentsObjects = document.getElementById(`apartamentsObjects_${objectLayerId}`);
    const parksObjects = document.getElementById(`parksObjects_${objectLayerId}`);
    const waterObjects = document.getElementById(`waterObjects_${objectLayerId}`);
    selectType.style.display = "block"
    const apartContainerPoligons = document.getElementById(`apartamentsPoligonsId_${objectLayerId}`);
    const parkContainerPoligons = document.getElementById(`parksPoligonsId_${objectLayerId}`);
    const waterContainerPoligons = document.getElementById(`waterPoligonsId_${objectLayerId}`);
    const apartCheckPoligon = document.getElementById(`apartamentsPoligon${objectLayerId}`);
    const parkCheckPoligon = document.getElementById(`parksPoligon${objectLayerId}`);
    const waterCheckPoligon = document.getElementById(`waterPoligon${objectLayerId}`);

    const municipalBuildList = [
        "parking", "fire_station", "school", "kindergarten",
        "university", "research_institute", "service", "clinic",
        "arts_centre", "place_of_worship"
    ]
    const query = `[out:json];
    (
    way(around:${radius}, ${objectLat}, ${objectLng})["natural"];
    way(around:${radius}, ${objectLat}, ${objectLng})["building"];
    way(around:${radius}, ${objectLat}, ${objectLng})["leisure"];
    way(around:${radius}, ${objectLat}, ${objectLng})["waterway"];
    way(around:${radius}, ${objectLat}, ${objectLng})["water"];
    );
    out qt center geom;`

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)

        .then(response => response.json())
        .then(data => {
            const allObjectsData = data.elements;
            allObjectsData.forEach(objectsData => {
                try {
                    const building = objectsData.tags.building
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
                    var translatrObjects = {
                        "research_institute": "Исследовательский институт",
                        "apartments": "Жилой дом",
                        "school": "Школа",
                        "kindergarten": "Детский сад",
                        "service": "Сервисный объект",
                        "university": "Университет",
                        "office": "Офис",
                        "retail": "Магазин/Торговый центр",
                        "commercial": "Коммерческое здание",
                        "garages": "Гаражи",
                        "clinic": "Поликлиника",
                        "parking": "Парковка",
                        "arts_centre": "Центр искусств",
                        "place_of_worship": "Религиозное здание",
                        "public_building": "общественное здание",
                        "fire_station": "Пожарная станция",
                        "river": "Река",
                        "stream": "Источник",
                        "water": "Водный объект",
                        "wood": "Лес",
                        "park": "Парк",
                        "train_station": "Железнодорожная станция",
                        "house": "Жилой дом",
                        "toilets": "Туалет",
                        "industrial": "Промышленный объект",
                        "playground": "Детская площадка",
                        "fitness_station": "Фитнес центр",
                        "construction": "Стройка",
                        "kiosk": "Киоск",
                        "sport": "Спортивный объект",
                        "hospital": "Больница",
                        "pitch": "Спорт площадка",
                        "drain": "Болото"
                    }
                    var naturalObjList = ["wood", "garden", "tree_row", "grassland"]
                    const markerGroupBuilding = L.layerGroup().addTo(map);
                    const markerGroupLeisure = L.layerGroup().addTo(map);
                    const markerGroupWater = L.layerGroup().addTo(map);
                    const polygonsGroupBuilding = L.layerGroup().addTo(map);
                    const polygonsGroupLeisure = L.layerGroup().addTo(map);
                    const polygonsGroupWater = L.layerGroup().addTo(map);

                    apartamentsObjects.addEventListener('change', function () {
                        if (apartamentsObjects.checked) {
                            apartContainerPoligons.style.display = "block"
                            if (building) {
                                var greenIcon = new L.Icon({
                                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34],
                                    shadowSize: [41, 41]
                                });
                                L.marker([centerLat, centerLon], { icon: greenIcon }).addTo(markerGroupBuilding)
                                    .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.building])
                                    .openPopup();
                                objectsPoligonstFunc(objectsData)
                            }
                        } else {
                            markerGroupBuilding.clearLayers();
                            apartContainerPoligons.style.display = "none"
                        }
                    });

                    function objectsPoligonstFunc(poligonsObjData) {
                        apartCheckPoligon.addEventListener('change', function () {
                            if (apartCheckPoligon.checked) {
                                const polygonCoordinates = poligonsObjData.geometry.map(coord => [coord.lat, coord.lon]);
                                const polygon = L.polygon(polygonCoordinates, { color: 'red' });
                                polygon.addTo(polygonsGroupBuilding);
                            } else {
                                polygonsGroupBuilding.clearLayers();
                            }
                        });
                    }

                    parksObjects.addEventListener('change', function () {
                        if (parksObjects.checked) {
                            parkContainerPoligons.style.display = "block"
                            if (leisure || naturalObjList.includes(objectsData.tags.natural)) {
                                var greenIcon = new L.Icon({
                                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34],
                                    shadowSize: [41, 41]
                                });
                                L.marker([centerLat, centerLon], { icon: greenIcon }).addTo(markerGroupLeisure)
                                    .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.leisure] || translatrObjects[objectsData.tags.natural])
                                    .openPopup();
                                parksPoligonstFunc(objectsData)
                            }
                        } else {
                            markerGroupLeisure.clearLayers();
                            parkContainerPoligons.style.display = "none"
                        }
                    });
                    function parksPoligonstFunc(poligonsParksData) {
                        parkCheckPoligon.addEventListener('change', function () {
                            if (parkCheckPoligon.checked) {
                                const polygonCoordinates = poligonsParksData.geometry.map(coord => [coord.lat, coord.lon]);
                                const polygon = L.polygon(polygonCoordinates, { color: 'red' });
                                polygon.addTo(polygonsGroupLeisure);
                            } else {
                                polygonsGroupLeisure.clearLayers();
                            }
                        });
                    }

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
                                L.marker([centerLat, centerLon], { icon: greenIcon }).addTo(markerGroupWater)
                                    .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.water] || translatrObjects[objectsData.tags.waterway])
                                    .openPopup();
                                waterPoligonstFunc(objectsData)
                            }
                        } else {
                            markerGroupWater.clearLayers();
                            waterContainerPoligons.style.display = "none"
                        }
                    });
                    function waterPoligonstFunc(poligonsWaterData) {
                        waterCheckPoligon.addEventListener('change', function () {
                            if (waterCheckPoligon.checked) {
                                const polygonCoordinates = poligonsWaterData.geometry.map(coord => [coord.lat, coord.lon]);
                                const polygon = L.polygon(polygonCoordinates, { color: 'red' });
                                polygon.addTo(polygonsGroupWater);
                            } else {
                                polygonsGroupWater.clearLayers();
                            }
                        });
                    }

                }
                catch
                {
                }
=======
                const building = objectsData.tags.building
                const amenity = objectsData.tags.amenity
                const leisure = objectsData.tags.leisure
                const water = objectsData.tags.water
                const waterway = objectsData.tags.waterway
                const markerGroupBuilding = L.layerGroup().addTo(map);
                const markerGroupAmenity = L.layerGroup().addTo(map);
                const markerGroupLeisure = L.layerGroup().addTo(map);
                const markerGroupWater = L.layerGroup().addTo(map);

                apartamentsObjects.addEventListener('change', function () {
                    if (apartamentsObjects.checked) {
                        if (building !== "yes" && (building === "apartments" || building === "house")) {
                            var greenIcon = new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            });
                            L.marker([objectsData.center.lat, objectsData.center.lon], { icon: greenIcon }).addTo(markerGroupBuilding)
                                .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.building])
                                .openPopup();
                        }
                    } else {
                        markerGroupBuilding.clearLayers();
                    }
                });

                municipalObjects.addEventListener('change', function () {
                    if (municipalObjects.checked) {
                        if (municipalBuildList.includes(amenity) || municipalBuildList.includes(building)) {
                            var greenIcon = new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            });
                            L.marker([objectsData.center.lat, objectsData.center.lon], { icon: greenIcon }).addTo(markerGroupAmenity)
                                .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.building])
                                .openPopup();
                        }
                    } else {
                        markerGroupAmenity.clearLayers();
                    }
                });

                parksObjects.addEventListener('change', function () {
                    if (parksObjects.checked) {
                        if (leisure || objectsData.tags.natural === "wood") {
                            var greenIcon = new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            });
                            L.marker([objectsData.center.lat, objectsData.center.lon], { icon: greenIcon }).addTo(markerGroupLeisure)
                                .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.leisure] || translatrObjects[objectsData.tags.natural])
                                .openPopup();
                        }
                    } else {
                        markerGroupLeisure.clearLayers();
                    }
                });

                waterObjects.addEventListener('change', function () {
                    if (waterObjects.checked) {
                        if (water || waterway) {
                            var greenIcon = new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            });
                            L.marker([objectsData.center.lat, objectsData.center.lon], { icon: greenIcon }).addTo(markerGroupWater)
                                .bindPopup(objectsData.tags.name || translatrObjects[objectsData.tags.water] || translatrObjects[objectsData.tags.waterway])
                                .openPopup();
                        }
                    } else {
                        markerGroupWater.clearLayers();
                    }
                });

            });
        })
        .catch(error => {
            console.log(error)
        });
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

    if (layerJSON) {
        const layerType = layerJSON.type;

        if (layerType === 'LineString') {
            const line = layerJSON;

            const buffered = turf.buffer(line, value, { units: 'meters' });
            const polygonLayer = L.geoJSON(buffered);
            polygonLayer.addTo(map);

        } else if (layerType === 'Point') {
            const buffer = turf.buffer(layer.toGeoJSON(), value, { units: 'meters' })
            L.geoJSON(buffer).addTo(map)

        } else {
            const sourceLayerOptions = layer.options;

            layerJSON = sourceLayerOptions.originalGeometry ? sourceLayerOptions.originalGeometry : layerJSON;

            const buffered = turf.buffer(layerJSON, value, { units: 'meters' });
            const polygonLayer = L.geoJSON(buffered);
            const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, layerJSON);

            const polygon1 = L.geoJSON(difference).getLayers()[0].getLatLngs();
            const polygon2 = L.geoJSON(layerJSON).getLayers()[0].getLatLngs();

            let externalPolygon = L.polygon([...polygon1]);
            const sourcePolygon = L.polygon([...polygon2]);

            removeOldExternalPolygon(layer);

            externalPolygon.addTo(map);
            sourcePolygon.addTo(map);

            removeLayerAndElement(layer);

            bindPolygons(sourcePolygon, externalPolygon, value);

            sourcePolygon.options.added_external_polygon_id = externalPolygon._leaflet_id;
            sourcePolygon.options.added_external_polygon_width = value;

            if (sourceLayerOptions.is_cadastral) {
                sourcePolygon.options.is_cadastral = sourceLayerOptions.is_cadastral;
                sourcePolygon.options.cadastral_number = sourceLayerOptions.cadastral_number;
            }

            CreateEl(sourcePolygon, 'Polygon', externalPolygon, sourceLayerOptions);

            if (sourceLayerOptions && sourceLayerOptions.isGrid && sourceLayerOptions.originalGeometry) {
                const cellWidth = sourceLayerOptions.cellWidth;
                AddGrid(sourcePolygon, originalLayer = null, cellWidth);
            }
        }
    }
    else {
        const sourceLayerOptions = layer.options
        // const layerJSON = layer.toGeoJSON().features[0].geometry;
        const layerJSON = sourceLayerOptions.originalGeometry ? sourceLayerOptions.originalGeometry : layer.toGeoJSON().features[0].geometry;;

        const buffered = turf.buffer(layerJSON, value, { units: 'meters' });
        const polygonLayer = L.geoJSON(buffered);
        const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, layerJSON);
        const polygon1 = L.geoJSON(difference).getLayers()[0].getLatLngs();
        const polygon2 = L.geoJSON(layerJSON).getLayers()[0].getLatLngs();

        let externalPolygon = L.polygon([...polygon1]);
        const sourcePolygon = L.polygon([...polygon2]);

        removeOldExternalPolygon(layer);

        externalPolygon.addTo(map)
        sourcePolygon.addTo(map);

        removeLayerAndElement(layer);

        bindPolygons(sourcePolygon, externalPolygon, value);

        function updateExternalPolygon() {
            const sourceGeoJSON = sourcePolygon.toGeoJSON();
            const combinedSource = turf.combine(sourceGeoJSON)
            const buffered = turf.buffer(combinedSource, value, { units: 'degrees' });
            const polygonLayer = L.geoJSON(buffered);
            const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, sourceGeoJSON);
            const polygon = L.geoJSON(difference).getLayers()[0].getLatLngs();
            const newExternalPolygon = L.polygon([...polygon]);
            newExternalPolygon.addTo(map);

            newExternalPolygon.on('pm:dragenable', function (e) {
                e.layer.pm.disableLayerDrag();
            });

        // function updateExternalPolygon() {
        //     const sourceGeoJSON = sourcePolygon.toGeoJSON();
        //     const combinedSource = turf.combine(sourceGeoJSON)
        //     const buffered = turf.buffer(combinedSource, value, { units: 'degrees' });
        //     const polygonLayer = L.geoJSON(buffered);
        //     const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, sourceGeoJSON);
        //     const polygon = L.geoJSON(difference).getLayers()[0].getLatLngs();
        //     const newExternalPolygon = L.polygon([...polygon]);
        //     newExternalPolygon.addTo(map);

        //     newExternalPolygon.on('pm:dragenable', function (e) {
        //         e.layer.pm.disableLayerDrag();
        //     });

        //     externalPolygon.remove();
        //     externalPolygon = newExternalPolygon;

        //     sourcePolygon.options.added_external_polygon_id = newExternalPolygon._leaflet_id;
        // }

        // sourcePolygon.on('pm:drag', updateExternalPolygon);

        // externalPolygon.pm.disableLayerDrag();

        sourcePolygon.options.added_external_polygon_id = externalPolygon._leaflet_id;
        sourcePolygon.options.added_external_polygon_width = value;

        if (sourceLayerOptions.is_cadastral) {
            sourcePolygon.options.is_cadastral = sourceLayerOptions.is_cadastral;
            sourcePolygon.options.cadastral_number = sourceLayerOptions.cadastral_number;
        }

        // const options = {
        //     is_cadastral: sourceLayerOptions.is_cadastral,
        //     cadastral_number: sourceLayerOptions.cadastral_number,
        //     added_external_polygon_id: externalPolygon._leaflet_id,
        //     added_external_polygon_width: value
        // };
        // Object.assign(sourcePolygon.options, options);

        CreateEl(sourcePolygon, 'Polygon', externalPolygon, sourceLayerOptions);

        if (sourceLayerOptions && sourceLayerOptions.isGrid && sourceLayerOptions.originalGeometry) {
            const cellWidth = sourceLayerOptions.cellWidth;
            AddGrid(sourcePolygon, originalLayer = null, cellWidth);
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
        const buffered = turf.buffer(combinedSource, value, { units: 'meters', steps: 4 });
        const polygonLayer = L.geoJSON(buffered);
        const difference = turf.difference(polygonLayer.toGeoJSON().features[0].geometry, sourceGeoJSON);
        const polygon = L.geoJSON(difference).getLayers()[0].getLatLngs();
        const newExternalPolygon = L.polygon([...polygon]);
        newExternalPolygon.addTo(map);

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


function AddCircleArea(layer, value, contextMenu) {
    const center = layer.getLatLng();
    L.circle(center, { radius: value }).addTo(map)
    contextMenu.remove()
}

function addMarkersToPolyline(polyline, stepMeters) {
    var markers = L.markerClusterGroup({
        disableClusteringAtZoom: 17
    });
    var lineLatLngs = polyline.getLatLngs();

    var currentDistance = 0;
    var stepCount = 0;
    var currentZoom = map.getZoom();
    if (currentZoom > 16) {
        stepMeters = 20;
    }
    for (var i = 1; i < lineLatLngs.length; i++) {
        var startPoint = lineLatLngs[i - 1];
        var endPoint = lineLatLngs[i];
        var segmentDistance = startPoint.distanceTo(endPoint);
        stepCount = Math.floor(segmentDistance / stepMeters);
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
function ChangeColor(layer, color) {
    layer.setStyle({ color: color })
}


let isFirstObjectAdded = false;

function createSidebarElements(layer, type, description = '') {
    const lengthLine = layer.options.length
    const sourceArea = layer.options.source_area
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
            ` : `
            <div class="mb-3">
            <label class="form-check-label" for="buildingType_${layerId}">Тип объекта:</label>
            <br>
            <input class="form-check-input" type="checkbox" name="buildingType_${layerId}" id="buildingType_${layerId}"
                   value="option1"> Здание</input>
            <input class="form-check-input" type="checkbox" name="PlotType_${layerId}"
                   value="option2" ${isPlotChecked}> Участок</input>
        </div>
        <div class="mb-3" id="typeBuilding_${layerId}" style="display: none">
        <select class="form-select" aria-label="Выберите тип здания">
            <option selected>Выберите тип здания</option>
            <option value="1">Школа</option>
            <option value="2">Жилой многоэтажный дом</option>
            <option value="3">Жилое здание</option>
        </select>
    </div>
            `}
            <div class="mb-3">
                ${cadastralNumber ? `<span id='cadastral_${layerId}' name="cadastralNumber_${layerId}">Кадастровый номер: ${cadastralNumber} </span>` : ''}
            </div>
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
                    ${sourceArea && parseFloat(sourceArea) !== 0 ? `<span id='square${layerId}'>Площадь - ${parseFloat(sourceArea).toFixed(3)} га</span><br>` : ''}
                    ${totalArea && parseFloat(totalArea) !== 0 ? `<span id='totalSquare${layerId}'>Общая площадь - ${parseFloat(totalArea).toFixed(3)} га</span>` : ''}
                `}
            </div>
        </div>
    </div>
    <div class="mb-3 ms-3" id="typeObjectsAround_${layerId}" style="display: none">
    <label class="form-check-label" for="buildingType">Типы объектов вокруг:</label><br>
    <input type="checkbox" id="apartamentsObjects_${layerId}">
    <label for="apartamentsObjects">Жилые дома, муниципальные объекты</label><br>
<div style="margin-left: 15px; display: none" id="apartamentsPoligonsId_${layerId}">
    <input type="checkbox" id="apartamentsPoligon${layerId}">
    <label for="apartamentsPoligons">Добавить полигоны</label><br>
</div>
    <input type="checkbox" id="parksObjects_${layerId}">
    <label for="parksObjects">Парки, скверы, спортивные объекты</label><br>
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
    } else {
        const isBuildingCheckbox = htmlEl.querySelector(`[name="buildingType_${layerId}"]`);
        const isPlotCheckbox = htmlEl.querySelector(`[name="PlotType_${layerId}"]`);

        isBuildingCheckbox.addEventListener('change', function () {
            const typeBuilding = document.getElementById(`typeBuilding_${layerId}`);
            if (isBuildingCheckbox.checked) {
                typeBuilding.style.display = 'block';
                isPlotCheckbox.checked = false;
            } else {
                typeBuilding.style.display = 'none';
            }
        });

        isPlotCheckbox.addEventListener('change', function () {
            const typeBuilding = document.getElementById(`typeBuilding_${layerId}`);
            if (isPlotCheckbox.checked) {
                typeBuilding.style.display = 'none';
                isBuildingCheckbox.checked = false;
            }
        });
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

function AddGrid(layer, originalLayer = null, value, externalPolygon = null, widthInDegrees = null) {
    const feature = layer.options.isGrid && layer.options.originalGeometry
        ? layer.options.originalGeometry
        : (layer.toGeoJSON().features && layer.toGeoJSON().features[0]) ? layer.toGeoJSON().features[0] : layer.toGeoJSON();
    const type = feature.geometry.type === 'MultiPolygon' ? 'Polygon' : feature.geometry.type;
    const color = layer.pm._layers && layer.pm._layers[0] ? layer.pm._layers[0].options.color : layer.options.color;

    const cellWidth = value / 1000;
    const options = { units: 'kilometers', mask: feature };
    const bufferedBbox = turf.bbox(turf.buffer(feature, cellWidth, options));
    const squareGrid = turf.squareGrid(bufferedBbox, cellWidth, options);

    const clippedGridLayer = L.geoJSON();
    turf.featureEach(squareGrid, function (currentFeature) {
        const intersected = turf.intersect(feature, currentFeature);
        if (intersected) {
            clippedGridLayer.addData(intersected);
        }
    });

    const combined = turf.combine(clippedGridLayer.toGeoJSON(), feature);
    const polygon = L.geoJSON(combined, {
        style: { color: color },
        pmOptions: {
            dragMiddleMarkers: false,
            limitMarkersToCount: 8, // Устанавливаем желаемое количество вершин
            hintlineStyle: { color: 'red' },
        },
    });

    const newLayer = polygon.getLayers()[0];

    if (originalLayer) {
        const id = originalLayer._leaflet_id;
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
        originalLayer.remove();
        layer.remove();
    } else {
        const id = layer._leaflet_id;
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
        layer.remove();
    }

    newLayer.options.isGrid = true;
    newLayer.options.cellWidth = value;
    newLayer.options.originalGeometry = layer.options.originalGeometry ? layer.options.originalGeometry : feature;

    if (layer.options.is_cadastral) {
        const { is_cadastral, cadastral_number } = layer.options;
        Object.assign(newLayer.options, { is_cadastral, cadastral_number });
    }

    if (layer.options.added_external_polygon_width) {
        const { total_area, added_external_polygon_id, added_external_polygon_width } = layer.options;
        Object.assign(newLayer.options, { total_area, added_external_polygon_id, added_external_polygon_width });
    }

    newLayer.on('pm:rotateend', function (e) {
        updateLayerOptionOriginalGeometry(newLayer);
    });

    newLayer.on('pm:dragend', function (e) {
        updateLayerOptionOriginalGeometry(newLayer);
    });

    CreateEl(newLayer, type);

    if (newLayer.options.added_external_polygon_id) {
        const externalPolygonId = newLayer.options.added_external_polygon_id;
        const externalPolygon = map._layers[externalPolygonId];
        const widthInDegrees = newLayer.options.added_external_polygon_width;
        bindPolygons(newLayer, externalPolygon, widthInDegrees)
    }

    // if (externalPolygon && widthInDegrees) {
    //     bindPolygons(newLayer, externalPolygon, widthInDegrees);
    // }
}

function updateLayerOptionOriginalGeometry(layer) {
    const layerGeometry = layer.toGeoJSON().features && layer.toGeoJSON().features[0] ? layer.toGeoJSON().features[0].geometry.coordinates : layer.toGeoJSON().geometry.coordinates;
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

function AddPoints(layer) {
    var markers = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: true,
        disableClusteringAtZoom: 18,
    });
    var polygon = layer.toGeoJSON()
    var cellSize = 10 // Размер ячейки сетки
    var options = { units: 'meters' }; // Единицы измерения
    var pointGrid = turf.pointGrid(turf.bbox(polygon), cellSize, options);
    // Переберите точки сетки и добавьте только те, которые находятся внутри полигона, в качестве маркеров в группу
    pointGrid.features.forEach(function (feature) {
        if (turf.booleanPointInPolygon(feature.geometry, polygon)) {
            var lat = feature.geometry.coordinates[1];
            var lon = feature.geometry.coordinates[0];
            var marker = L.marker([lat, lon]);
            markers.addLayer(marker);
        }
    });

    // Добавьте группу маркеров на карту
    map.addLayer(markers);
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
function createPalette(div, layer) {
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
        }
    });

    pickr.on('change', function (color) {
        ChangeColor(layer, color.toRGBA().toString());
    });

    return pickr;
}
