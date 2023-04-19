$(document).ready(function () {
    fetch('http://ip-api.com/json/')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            // Создаем карту
            maptilersdk.config.apiKey = 'XvVImBnharciGdYPoK1T';
            const map = new maptilersdk.Map({
                container: 'map',
                style: '09a9b1dc-c6f8-4113-8998-ae8b6d56f018',
                zoom: 10,
            });
            // Устанавливаем центр карты на местоположение пользователя
            map.setCenter([data.lon, data.lat]);
            map.on('load', async function () {
                map.setLanguage(maptilersdk.Language.NON_LATIN);
            });
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