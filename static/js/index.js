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
            });
        });
});


const services_btn = document.getElementById('services_btn_id');
const experience_btn = document.getElementById('experience_btn_id');
const about_us_btn = document.getElementById('about_us_btn_id');
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
