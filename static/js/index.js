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
                style: '09a9b1dc-c6f8-4113-8998-ae8b6d56f018',
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

                    const photoSrc = feature.properties.photo !== '' ? feature.properties.photo : '/static/img/no_photo.jpg';
                    const popupContent = `
                      <div>
                        <p><bold>${feature.properties.name}</bold></p>
                        <img src="${photoSrc}" style="width:220px; height:220px">
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
    console.log(obj_pk)
    fetch('http://127.0.0.1:8000/detail/' + obj_pk + '/')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
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

            // Очистка содержимого слайдера
            document.querySelector('#detailsModal .slider-for').innerHTML = '';
            document.querySelector('#detailsModal .slider-nav').innerHTML = '';

            let slider_for = document.querySelector('#detailsModal .slider-for')
            let slider_nav = document.querySelector('#detailsModal .slider-nav')
            for (let i = 0; i < data.images.length; i++) {
                div1 = document.createElement("div");
                div2 = document.createElement("div");
                div1.innerHTML = `<img id='main-image' src="${data.images[i]}"
                class="img-fluid rounded-start" style='width:333px; height:333px'></div>`;
                div2.innerHTML = `<img src="${data.images[i]}"
                style='width:200px; margin-left:5px; height:133px;'>`
                slider_for.appendChild(div1);
                slider_nav.appendChild(div2);
            }
            InitSlider(true);
            $('#detailsModal').modal('show');
        });
});

$('#detailsModal').on('hidden.bs.modal', function () {
    $('.slider-for').slick('unslick');
    $('.slider-nav').slick('unslick');
});

$('#detailsModal').on('shown.bs.modal', function () {
    InitSlider(false);
});

// Слайды
function InitSlider(flag) {
    if (flag) {
        $('.slider-for').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: true,
            asNavFor: '.slider-nav'
        });
        $('.slider-nav').slick({
            slidesToShow: 5,
            slidesToScroll: 1,
            asNavFor: '.slider-for',
            dots: false,
            centerMode: true,
            focusOnSelect: true,
            variableWidth: true,
            prevArrow: $('.prev-btn'),
            nextArrow: $('.next-btn'),
            useCSS: true,
        });
        $('#detailsModal').on('shown.bs.modal', function () {
            $('.slider-for').slick('setPosition');
            $('.slider-nav').slick('setPosition');
        });
        $('.slider-nav').css('filter', 'blur(2px)');
    }
}


const services_btn = document.getElementById('services_btn_id');
const experience_btn = document.getElementById('experience_btn_id');
const about_us_btn = document.getElementById('about_us_btn_id');
const cardButton = document.querySelector('.card-button');
const cardContainer = document.querySelector('.card-container');
const closeButton = document.querySelector('.close-button');
const popup = document.getElementById('card-container_id');
const logo = document.getElementById('logo')
const startTime = Date.now();
let timerId;

services_btn.addEventListener('mouseover', function () {
    timerId = setTimeout(function () {
        const currentTime = Date.now();
        const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
        if (elapsedTimeInSeconds >= 2) {
            document.getElementById('services_card_id').classList.add('for_favorite_card');
            popup.style.display = 'block';
            logo.style.display = 'none';
        }
    }, 500);
});
services_btn.addEventListener('mouseout', function () {
    clearTimeout(timerId);
});

experience_btn.addEventListener('mouseover', function () {
    timerId = setTimeout(function () {
        const currentTime = Date.now();
        const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
        if (elapsedTimeInSeconds >= 2) {
            document.getElementById('experience_card_id').classList.add('for_favorite_card');
            popup.style.display = 'block';
            logo.style.display = 'none';
        }
    }, 500);
});
experience_btn.addEventListener('mouseout', function () {
    clearTimeout(timerId);
});

about_us_btn.addEventListener('mouseover', function () {
    timerId = setTimeout(function () {
        const currentTime = Date.now();
        const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
        if (elapsedTimeInSeconds >= 2) {
            document.getElementById('about_us_card_id').classList.add('for_favorite_card');
            popup.style.display = 'block';
            logo.style.display = 'none';
        }
    }, 500);
});
about_us_btn.addEventListener('mouseout', function () {
    clearTimeout(timerId);
});

function hideInfoPopup() {
    document.querySelector('.card-container').style.display = 'none';
    logo.style.display = 'block';
    document.getElementById('about_us_card_id').classList.remove('for_favorite_card');
    document.getElementById('services_card_id').classList.remove('for_favorite_card');
    document.getElementById('experience_card_id').classList.remove('for_favorite_card');
}