$(document).ready(function () {
    fetch('http://ip-api.com/json/?lang=ru')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            // Создаем карту
            maptilersdk.config.apiKey = 'XvVImBnharciGdYPoK1T';
            const map = new maptilersdk.Map({
                container: 'map',
                style: '318612b3-a5ec-4f96-9d00-f492e49114b9',
                zoom: 11,
            });
            // Устанавливаем центр карты на местоположение пользователя
            map.setCenter([data.lon, data.lat]);
        });
});