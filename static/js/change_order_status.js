/* Включение кнопок выгрузки документов, в зависимости от выбранных видов инженерных изысканий */
const checkboxes = document.querySelectorAll('#TypeWork input[type="checkbox"]');
const downloadLinkIgi = document.querySelector('#download-igi');
const downloadLinkIgdi = document.querySelector('#download-igdi');
const downloadLinkAll = document.querySelector('#download-all');
const downloadLinkNone = document.querySelector('#download-none');
const objectNameField = document.querySelector('#object-name');

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
if (objectNameField.value !== '') {
    updateLinksVisibility();
}

// Добавляем обработчик изменения состояния чекбокса
checkboxes.forEach((checkbox) => {
    if (objectNameField.value !== '') {
        checkbox.addEventListener('change', updateLinksVisibility);
    }
});

/* Включение полей выбора габаритов здания, в зависимости от выбранного назначения здания. Автокомплит поля назначение здания */
$(document).ready(function () {
    const purposeInput = $("#id_purpose_building");
    const lengthUnit = $("#id_length_unit");
    const widthUnit = $("#id_width_unit");
    const heightUnit = $("#id_height_unit");
    const lengthInput = $("#id_length");
    const widthInput = $("#id_width");
    const heightInput = $("#id_height");

    // Задаем Autocomplete для поля #id_purpose_building
    purposeInput.autocomplete({
        source: "/purpose_building_autocomplete/",
        minLength: 0,
        select: function (event, ui) {
            const selectedValue = ui.item.value;
            resetFields();

            let purposeGroup = null;

            $.ajax({
                url: "/get_purpose_group/",
                data: {
                    'selected_value': selectedValue
                },
                dataType: 'json',
                success: function (data) {
                    purposeGroup = data.purpose_group;
                    switch (purposeGroup) {
                        case 1:
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
                        case 2:
                            lengthUnit.val("m");
                            lengthUnit.find("option:eq(1)").hide();
                            heightInput.attr("disabled", true);
                            heightUnit.hide();
                            widthUnit.val("m");
                            widthUnit.find("option:eq(1)").hide();
                            break;
                        case 3:
                            lengthUnit.val("m");
                            lengthUnit.find("option:eq(1)").hide();
                            widthUnit.val("m");
                            widthUnit.find("option:eq(1)").hide();
                            heightUnit.val("floor");
                            heightUnit.find("option:eq(0)").hide();
                            break;
                    }
                },
                error: function (xhr, status, error) {
                    console.log(error);
                }
            });
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
            $.ajax({
                url: '/get_purpose_group/',
                data: {
                    'selected_value': selectedValue
                },
                dataType: 'json',
                success: function (data) {
                    const purposeGroup = data.purpose_group;
                    switch (purposeGroup) {
                        case 1:
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
                        case 2:
                            lengthUnit.val("m");
                            lengthUnit.find("option:eq(1)").hide();
                            heightInput.attr("disabled", true);
                            heightUnit.hide();
                            widthUnit.val("m");
                            widthUnit.find("option:eq(1)").hide();
                            break;
                        case 3:
                            lengthUnit.val("m");
                            lengthUnit.find("option:eq(1)").hide();
                            widthUnit.val("m");
                            widthUnit.find("option:eq(1)").hide();
                            heightUnit.val("floor");
                            heightUnit.find("option:eq(0)").hide();
                            break;
                    }
                },
                error: function (xhr, status, error) {
                    console.log(error);
                }
            });
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

let dt = new DataTransfer();
let flag = 1

$('.input-file input[type=file]').on('change', function () {
    let $files_list = $(this).closest('.input-file').next();
    $files_list.empty();

    for (let i = 0; i < this.files.length; i++) {
        let new_file_input = '<div class="input-file-list-item">' +
            '<span class="input-file-list-name"> <svg width="28" height="33" viewBox="0 0 28 33" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M17.8501 1L27.1176 9.72913M27.1176 9.72913H19.5351C19.0882 9.72913 18.6596 9.56192 18.3436 9.26428C18.0276 8.96663 17.8501 8.56295 17.8501 8.14202V1H2.68501C2.23812 1 1.80953 1.16721 1.49353 1.46486C1.17753 1.7625 1 2.16619 1 2.58711V30.3616C1 30.7826 1.17753 31.1862 1.49353 31.4839C1.80953 31.7815 2.23812 31.9487 2.68501 31.9487H25.4326C25.8795 31.9487 26.3081 31.7815 26.6241 31.4839C26.9401 31.1862 27.1176 30.7826 27.1176 30.3616V9.72913Z" stroke="#2D9CDB" stroke-linecap="round" stroke-linejoin="round"/> </svg>' + this.files.item(i).name + '</span>' +
            '<a href="#" onclick="removeFilesItem(this); return false;" class="input-file-list-remove">x</a>' +
            '</div>';
        $files_list.append(new_file_input);
        dt.items.add(this.files.item(i));
    }
    ;
    this.files = dt.files;
});

function removeFilesItem(target) {
    let name = $(target).prev().text();
    let input = $(target).closest('.input-file-row').find('input[type=file]');
    $(target).closest('.input-file-list-item').remove();
    for (let i = 0; i < dt.items.length; i++) {
        if (name === dt.items[i].getAsFile().name) {
            dt.items.remove(i);
        }
    }
    input[0].files = dt.files;
}


/* Замена символов при вводе */
function ValueReplace() {
    regex = /[a-zA-Z0-9-@"№#!;$%^:&?*({,><~_=+`|/.../^\x5c})]+$/;

    let name = document.getElementById('id_name');
    let surname = document.getElementById('id_surname');
    let father_name = document.getElementById('id_father_name');
    let purpose_building = document.getElementById('id_purpose_building')

    name.oninput = function () {
        this.value = this.value.replace(regex, '')
    }
    surname.oninput = function () {
        this.value = this.value.replace(regex, '')
    }
    father_name.oninput = function () {
        this.value = this.value.replace(regex, '')
    }
    purpose_building.oninput = function () {
        this.value = this.value.replace(regex, '')
    }
}

window.onload = ValueReplace()


/* Расчет площади */
function convertSquare(squareValue, fromUnit, toUnit) {
    let convertedSquare;

    switch (fromUnit) {
        case "hectometer":
            squareValue *= 10000;
            break;
        default:
            break;
    }

    switch (toUnit) {
        case "hectometer":
            convertedSquare = squareValue / 10000;
            break;
        case "sq_m":
            convertedSquare = squareValue;
            break;
        default:
            break;
    }

    return convertedSquare;
}

let squareField = document.getElementById("id_square");
let squareValue = squareField.value;
let squareUnit = document.getElementById("id_square_unit").value;

document.getElementById("id_square_unit").addEventListener("change", function () {
    let newUnit = document.getElementById("id_square_unit").value;
    let convertedValue = convertSquare(squareValue, squareUnit, newUnit);

    squareValue = convertedValue;
    squareUnit = newUnit;
    squareField.value = convertedValue;
});


/* Маска на кадастровые номера */
$(document).ready(function () {
    const maskOptions = {
        placeholder: "__:__:_______:____"
    };

    $('#new_cadastral_numbers_id').mask('99:99:9999999:9999', maskOptions);

    $('input[id^="cadastral_number"]').mask('99:99:9999999:9999', maskOptions);
});


/* Маска на номер телефона */
$(document).ready(function () {
    const maskOptions = {
        placeholder: " "
    };

    $('#id_phone_number').mask('+7(999)999-99-99', maskOptions).on('input', function () {
        $(this).val($(this).val().replace(/[A-Za-zА-Яа-яЁё]/, ''))
    });
});


/* Функции удаления и редактирования кадастровых номеров */
function EditCadastral(id) {
    let cadastral = document.getElementById(`cadastral_number${id}`);
    let edit = document.getElementById(`edit${id}`);
    if (flag) {
        edit.innerHTML = "<i class='bx bxs-check-circle'></i>";
        cadastral.readOnly = false;
        cadastral.style.cssText = 'background-color:white; transition: 0.15s linear;';
        flag--;
    } else {
        edit.innerHTML = "<i class='bx bxs-edit'></i>";
        cadastral.readOnly = true;
        cadastral.style.cssText = 'background-color:lightgray; transition: 0.15s linear;';
        flag++;
    }
}

function DeleteCadastral(id) {
    document.getElementById(`cadastral_number${id}`);
    document.getElementById(id).remove();
    checkCadastral = true;
}

function EditNewCadastral() {
    var edit = document.getElementById('edit');
    var field = document.getElementById('new_cadastral_numbers_id');
    if (flag) {
        field.style.backgroundColor = "white";
        field.readOnly = false
        edit.innerHTML = "<i class='bx bxs-check-circle'></i>";
        flag--;
    } else {
        edit.innerHTML = "<i class='bx bxs-edit'></i>";
        field.readOnly = true;
        field.style.cssText = 'background-color:lightgray; transition: 0.15s linear;';
        flag++;
    }
}

function DeleteNewCadastral() {
    const field = document.getElementById('new_cadastral_numbers_id');
    document.getElementById("new_cadastral_numbers_id").value = "";
    document.getElementById("new-cadastral").style.display = "none";
    document.querySelector("#new-cadastral #edit").innerHTML = "<i class='bx bxs-edit'></i>";
    field.readOnly = true;
    field.style.cssText = 'background-color:lightgray; transition: 0.15s linear;';
    checkCadastral = true;
}

const addButton = document.getElementById('add-cadastral');
addButton.addEventListener('click', function () {
    if (document.getElementById('new-cadastral').style.display === "none") {
        document.getElementById('new-cadastral').style.display = "block";
    } else {
        document.getElementById('new-cadastral').style.display = "none";
    }
});


/* Функции проверки на уникальность при добавлении нового или редакдактировании уже сущетвующего кадастрового номера */
function checkNewCadastral() {
    const newCadastral = document.getElementById("new_cadastral_numbers_id").value.trim();
    const edit = document.querySelector("#new-cadastral #edit");
    const field = document.getElementById('new_cadastral_numbers_id');

    const regex = new RegExp('[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}');
    const isValidFormat = regex.test(newCadastral);

    let isAlreadyAdded = false;
    const cadastralInputs = document.getElementsByName("cadastral_numbers");
    for (let i = 0; i < cadastralInputs.length; i++) {
        const cadastralValue = cadastralInputs[i].value.trim();
        if (newCadastral === cadastralValue) {
            isAlreadyAdded = true;
            break;
        }
    }

    if (isAlreadyAdded || !isValidFormat) {
        checkCadastral = false;
        if (isAlreadyAdded) {
            showMessageModal("error", 'Данный кадастровый номер уже был добавлен');
        } else {
            showMessageModal("error", 'Неверный формат кадастрового номера');
        }
        edit.disabled = true;
    } else {
        checkCadastral = true;
        edit.disabled = false;
        edit.innerHTML = "<i class='bx bxs-edit'></i>";
        field.readOnly = true;
        field.style.cssText = 'background-color:lightgray; transition: 0.15s linear;';
        reloadPage();
    }
}

function checkInputCadastral(inputElement, id) {
    const editedCadastral = inputElement.value.trim();
    const cadastral = document.getElementById(`cadastral_number${id}`);
    const edit = document.getElementById(`edit${id}`);
    const regex = new RegExp('[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}');
    const isValidFormat = regex.test(editedCadastral);

    let isAlreadyAdded = false;
    const cadastralInputs = document.getElementsByName("cadastral_numbers");
    for (let i = 0; i < cadastralInputs.length; i++) {
        if (cadastralInputs[i] !== inputElement) {
            const cadastralValue = cadastralInputs[i].value.trim();
            if (editedCadastral === cadastralValue) {
                isAlreadyAdded = true;
                break;
            }
        }
    }

    if (isAlreadyAdded || !isValidFormat) {
        checkCadastral = false;
        if (isAlreadyAdded) {
            showMessageModal("error", 'Данный кадастровый номер уже был добавлен');
        } else {
            showMessageModal("error", 'Неверный формат кадастрового номера');
        }
        edit.disabled = true;
    } else {
        checkCadastral = true;
        edit.disabled = false;
        edit.innerHTML = "<i class='bx bxs-edit'></i>";
        cadastral.readOnly = true;
        cadastral.style.cssText = 'background-color:lightgray; transition: 0.15s linear;';
        reloadPage();
    }
}


/* Добавление названия объекта */
const objectName = document.getElementById('object-name');
objectName.addEventListener('change', function () {
    const inputValue = objectName.value;
    if (inputValue) {
        reloadPage()
    } else {
        reloadPage()
    }
});


/* Функции сохранения данных и перезагрузки страницы */
function saveFormData() {
    clearTimeout(saveFormData.timer);
    saveFormData.timer = setTimeout(function () {
        if (checkCadastral) {
            $.ajax({
                url: `/change_order_status/${orderPk}/`,
                type: 'POST',
                data: $('#form-data').serialize(),
                success: function (response) {
                    if (response.success) {
                        showMessageModal("success", 'Данные сохранены');
                    } else {
                        const errors_dict = response.errors;
                        let error_text = "";
                        for (let field in errors_dict) {
                            const field_label = errors_dict[field][0].label.toLowerCase();
                            const error_message = errors_dict[field][0].message.toLowerCase();
                            error_text += "Ошибка в поле " + field_label + ": " + error_message + "\n";
                        }
                        showMessageModal("error", error_text);
                    }
                },
                error: function (response) {
                    showMessageModal("error", 'Проверьте данные');
                }
            });
        }
    }, 3000);
}

// Вызываем функцию сохранения данных при изменении на странице
$(document).ready(function () {
    $('#form-data').on('input', saveFormData);
});

function reloadPage() {
    setTimeout(function () {
        location.reload();
    }, 4000);
}


/* ? */
$(document).on('mouseenter', '#close-icon', function () {
    $(this).css('cursor', 'pointer');
});
