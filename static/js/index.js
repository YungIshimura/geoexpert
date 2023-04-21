$(document).ready(function () {
    fetch('http://ip-api.com/json/')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Создаем карту
            maptilersdk.config.apiKey = 'XvVImBnharciGdYPoK1T';
            const map = new maptilersdk.Map({
                container: 'map',
                style: '318612b3-a5ec-4f96-9d00-f492e49114b9',
                zoom: 11,
            });
            // Устанавливаем центр карты на местоположение пользователя
            map.setCenter([data.lon, data.lat]);
            map.on('load', async function () {
                map.setLanguage(maptilersdk.Language.NON_LATIN);
                const control_bottom_right = map.getContainer().querySelector('.maplibregl-ctrl-bottom-right');
                const control_bottom_left = map.getContainer().querySelector('.maplibregl-ctrl-bottom-left');
                control_bottom_right.style.display = 'none';
                control_bottom_left.style.display = 'none';

                const control_group = map.getContainer().querySelector('.maplibregl-ctrl-top-right');
                control_group.style.position = 'fixed';
                control_group.style.top = '50%';
                control_group.style.right = '0';
                control_group.style.transform = 'translate(0, -50%)';
                control_group.style.margin = '20px';

                // Перебираем объекты
                const features = geoData.features;
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    const coords = JSON.parse(feature.geometry.coordinates);
                    const fixedCoords = coords[0][0].map(([lat, lon]) => [lon, lat]);
                    const object_pk = feature.properties.object_pk;

                    map.addLayer({
                        'id': 'polygon' + i,
                        'type': 'line',
                        'source': {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Polygon',
                                    'coordinates': [fixedCoords]
                                }
                            }
                        },
                        'layout': {},
                        'paint': {
                            'line-color': '#ffffff',
                            'line-opacity': 0.7
                        },
                        'z-index': 100
                    });

                    // Рассчитываем среднюю точку
                    const center = findCenter(fixedCoords);

                    const popupContent = `
                          <div>
                            <p><bold>${feature.properties.name}</bold></p>
                            <img src="${testimageUrl}" style="width:220px; height:220px">
                            <a href="" id="order-detail-link" data-bs-toggle="modal" data-bs-target="#detailsModal" data-pk="${object_pk}">Подробнее</a>
                          </div>
                    `;

                    const popup = new maptilersdk.Popup()
                        .setHTML(popupContent);


                    // Создаем маркер на карте
                    const marker = new maptilersdk.Marker()
                        .setLngLat(center)
                        .setPopup(popup)
                        .addTo(map);

                    marker.getPopup()._content.style.opacity = 0.8;
                }
            });
        });
});

function findCenter(coords) {
    // "Развернуть" массив с координатами
    const flatCoords = coords.flat(Infinity);

    // Вычислить среднее значение широты и долготы
    const latitudes = flatCoords.filter((_, index) => index % 2 === 0);
    const longitudes = flatCoords.filter((_, index) => index % 2 === 1);
    const latitudeSum = latitudes.reduce((sum, lat) => sum + lat, 0);
    const longitudeSum = longitudes.reduce((sum, lon) => sum + lon, 0);
    const latitudeAvg = latitudeSum / latitudes.length;
    const longitudeAvg = longitudeSum / longitudes.length;

    // Вернуть координаты центра
    return [latitudeAvg, longitudeAvg];
}


// Вызываем модальное окно с подробной информацией и заполняем данными
$(document).on('click', '#order-detail-link', function (e) {
    e.preventDefault();
    const obj_pk = $(this).data('pk');
    fetch('http://127.0.0.1:8000/detail/' + obj_pk + '/')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            document.querySelector('#detailsModal #order-name').textContent = data.name;
            document.querySelector('#detailsModal #order-type-work').innerHTML = `Виды изысканий: ${data.type_work.join(', ')}`;
            document.querySelector('#detailsModal #order-customer').innerHTML = `Заказчик: ${data.customer}`;
            document.querySelector('#detailsModal #order-work-objective').innerHTML = `Градостроительная деятельность: ${data.work_objective}`;
            if (data.year !== null) {
                document.querySelector('#detailsModal #order-year').innerHTML = `<small class="text-muted">Заказ был выполнен в ${data.year} году</small>`;
                document.querySelector('#detailsModal #order-year').style.display = 'block';
            } else {
                document.querySelector('#detailsModal #order-year').style.display = 'none';
            }
            $('#detailsModal').modal('show');
        });
});

const cardButton = document.querySelector('.card-button');
const cardContainer = document.querySelector('.card-container');
const closeButton = document.querySelector('.close-button');
const logo = document.getElementById('logo')

cardButton.addEventListener('mouseenter', () => {
    cardContainer.style.display = 'block';
    logo.style.display = 'none'
});

closeButton.addEventListener('click', () => {
    cardContainer.style.display = 'none';
    logo.style.display = 'block'
});