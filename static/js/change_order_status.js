/* Включение кнопок выгрузки документов, в зависимости от выбранных видов инженерных изысканий */
const checkboxes = document.querySelectorAll('#TypeWork input[type="checkbox"]');
const downloadLinkIgi = document.querySelector('#download-igi');
const downloadLinkIgdi = document.querySelector('#download-igdi');
const downloadLinkAll = document.querySelector('#download-all');
const downloadLinkNone = document.querySelector('#download-none');

function updateLinksVisibility() {
    let igiChecked = document.querySelector('#TypeWork input[value="2"]').checked;
    let igdiChecked = document.querySelector('#TypeWork input[value="1"]').checked;

    if (igiChecked && igdiChecked) {
        downloadLinkAll.style.display = 'block';
        downloadLinkIgi.style.display = 'none';
        downloadLinkIgdi.style.display = 'none';
        downloadLinkNone.style.display = 'none';
    } else if (igiChecked) {
        downloadLinkAll.style.display = 'none';
        downloadLinkIgi.style.display = 'block';
        downloadLinkIgdi.style.display = 'none';
        downloadLinkNone.style.display = 'none';
    } else if (igdiChecked) {
        downloadLinkAll.style.display = 'none';
        downloadLinkIgi.style.display = 'none';
        downloadLinkIgdi.style.display = 'block';
        downloadLinkNone.style.display = 'none';
    } else {
        downloadLinkAll.style.display = 'none';
        downloadLinkIgi.style.display = 'none';
        downloadLinkIgdi.style.display = 'none';
        downloadLinkNone.style.display = 'block';
    }
}

// Проверяем состояние чекбоксов при загрузке страницы
updateLinksVisibility();

// Добавляем обработчик изменения состояния чекбокса
checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateLinksVisibility);
});

/* Включение полей выбора габаритов здания, в зависимости от выбранного назначения здания. Автокомплит поля назначение здания */
$(document).ready(function () {
    const phoneInput = $("#id_phone_number");
    const purposeInput = $("#id_purpose_building");
    const lengthUnit = $("#id_length_unit");
    const widthUnit = $("#id_width_unit");
    const heightUnit = $("#id_height_unit");
    const lengthInput = $("#id_length");
    const widthInput = $("#id_width");
    const heightInput = $("#id_height");

    // Инициализируем маску на поле #id_phone_number
    phoneInput.mask("+7(999)999-99-99", {placeholder: ''});

    // Задаем Autocomplete для поля #id_purpose_building
    purposeInput.autocomplete({
        source: "http://127.0.0.1:8000/purpose_building_autocomplete/",
        minLength: 0,
        select: function (event, ui) {
            const selectedValue = ui.item.value;
            resetFields();

            switch (selectedValue) {
                case "Трубопровод":
                    widthInput.attr("disabled", true);
                    widthUnit.hide();
                    heightInput.attr("disabled", true);
                    heightUnit.hide();
                    lengthUnit.val("m");
                    widthUnit.val("");
                    heightUnit.val("");
                    widthInput.val("");
                    heightInput.val("");
                    break;
                case "Полигон ТБО":
                    lengthUnit.val("m");
                    lengthUnit.find("option:eq(1)").hide();
                    heightInput.attr("disabled", true);
                    heightUnit.hide();
                    widthUnit.val("m");
                    widthUnit.find("option:eq(1)").hide();
                    break;
                case "Школа":
                case "Жилой многоэтажный дом":
                    lengthUnit.val("m");
                    lengthUnit.find("option:eq(1)").hide();
                    widthUnit.val("m");
                    widthUnit.find("option:eq(1)").hide();
                    heightUnit.val("floor");
                    heightUnit.find("option:eq(0)").hide();
                    break;
            }
        }
    }).on("click", function () {
        $(this).autocomplete("search", "");
    });

    // Проверяем, если пользователь вводит значение сам, то сбрасываем поля
    purposeInput.on("input", function () {
        const selectedValue = $(this).val().trim();
        if (selectedValue.length > 0 && !$(this).data("ui-autocomplete").menu.active) {
            resetFields();
        }
    });

    checkBuildingPurpose();

    function checkBuildingPurpose() {
        const selectedValue = purposeInput.val().trim();
        if (selectedValue.length > 0) {
            switch (selectedValue) {
                case "Трубопровод":
                    widthInput.attr("disabled", true);
                    widthUnit.hide();
                    heightInput.attr("disabled", true);
                    heightUnit.hide();
                    lengthUnit.val("m");
                    widthUnit.val("");
                    heightUnit.val("");
                    widthInput.val("");
                    heightInput.val("");
                    break;
                case "Полигон ТБО":
                    lengthUnit.val("m");
                    lengthUnit.find("option:eq(1)").hide();
                    heightInput.attr("disabled", true);
                    heightUnit.hide();
                    widthUnit.val("m");
                    widthUnit.find("option:eq(1)").hide();
                    break;
                case "Школа":
                case "Жилой многоэтажный дом":
                    lengthUnit.val("m");
                    lengthUnit.find("option:eq(1)").hide();
                    widthUnit.val("m");
                    widthUnit.find("option:eq(1)").hide();
                    heightUnit.val("floor");
                    heightUnit.find("option:eq(0)").hide();
                    break;
            }
        }
    }

    function resetFields() {
        lengthUnit.find("option").show();
        widthUnit.find("option").show();
        heightUnit.find("option").show();
        lengthUnit.attr("disabled", false);
        widthInput.attr("disabled", false);
        heightInput.attr("disabled", false);
        lengthUnit.show();
        widthUnit.show();
        heightUnit.show();
        lengthUnit.val("m");
        widthUnit.val("m");
        heightUnit.val("m");
        lengthInput.val("");
        widthInput.val("");
        heightInput.val("");
    }
});

$('#id_phone_number').on('input', function () {
    $(this).val($(this).val().replace(/[A-Za-zА-Яа-яЁё]/, ''))
});