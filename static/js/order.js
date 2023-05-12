let dt = new DataTransfer();
let flag = 1

$('.input-file input[type=file]').on('change', function () {
    let $files_list = $(this).closest('.input-file').next();
    $files_list.empty();

    for (let i = 0; i < this.files.length; i++) {
        let new_file_input = '<div class="input-file-list-item">' +
            '<span class="input-file-list-name"> <svg width="28" height="33" style="margin-right: 15px" viewBox="0 0 28 33" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M17.8501 1L27.1176 9.72913M27.1176 9.72913H19.5351C19.0882 9.72913 18.6596 9.56192 18.3436 9.26428C18.0276 8.96663 17.8501 8.56295 17.8501 8.14202V1H2.68501C2.23812 1 1.80953 1.16721 1.49353 1.46486C1.17753 1.7625 1 2.16619 1 2.58711V30.3616C1 30.7826 1.17753 31.1862 1.49353 31.4839C1.80953 31.7815 2.23812 31.9487 2.68501 31.9487H25.4326C25.8795 31.9487 26.3081 31.7815 26.6241 31.4839C26.9401 31.1862 27.1176 30.7826 27.1176 30.3616V9.72913Z" stroke="#2D9CDB" stroke-linecap="round" stroke-linejoin="round"/> </svg>' + this.files.item(i).name + '</span>' +
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

// function DisableFloor() {
//     let floor = document.getElementById('id_height_unit_1');
//     let kmeter = document.getElementById('id_length_unit_1');
//     let meter = document.getElementById('id_length_unit_0')
//     let label = document.querySelector(`label[for=${floor.id}]`);

//     kmeter.onclick = function () {
//         floor.disabled = true;
//         floor.style.cssText = 'display:none;';
//         label.style.cssText = 'display:none;';
//     }

//     meter.onclick = function () {
//         floor.disabled = false;
//         floor.style.cssText = 'display: block;';
//         label.style.cssText = 'display: block;';
//     }
// }


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


/* Функции удаления и редактирования кадастровых номеров */
function DeleteCadastral(id) {
    document.getElementById(`cadastral_number${id}`);
    document.getElementById(id).remove();
}

function EditCadastral(id) {
    let cadastral = document.getElementById(`cadastral_number${id}`);
    let edit = document.getElementById(`edit${id}`);
    if (flag) {
        edit.innerHTML = "<i class='bx bxs-check-circle'></i>";
        cadastral.readOnly = false;
        cadastral.style.cssText = 'background-color:white; color: black; transition: 0.15s linear;';
        flag--;
    } else {
        edit.innerHTML = "<i class='bx bxs-edit'></i>";
        cadastral.readOnly = true;
        cadastral.style.cssText = 'transition: 0.15s linear;';
        flag++;
    }
}

function ChangeCadastral(id) {
    let cadastral = document.getElementById(`cadastral_number${id}`)
    const regex = new RegExp('[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}')
    let edit = document.getElementById(`edit${id}`);

    if (regex.test(cadastral.value)) {
        edit.disabled = false;
    } else {
        edit.disabled = true;
    }
}


/* Лицензионное соглашение */
function Agreement() {
    let check = document.getElementById('agreement');
    let btn = document.getElementById('send-order');
    check.onchange = function () {
        (check.checked) ? btn.disabled = false : btn.disabled = true
    }
}

window.onload = Agreement()
window.onload = ValueReplace()


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


/* Маска на номер телефона */
$(document).ready(function () {
    const maskOptions = {
        placeholder: "+7(900)000-00-00"
    };

    $('#id_phone_number').mask('+7(999)999-99-99', maskOptions).on('input', function () {
        $(this).val($(this).val().replace(/[A-Za-zА-Яа-яЁё]/, ''))
    });
});


/* Маска на кадастровый номер */
$(document).ready(function () {
    const maskOptions = {
        placeholder: "__:__:_______:____"
    };

    $('input[id^="cadastral_number"]').mask('99:99:9999999:9999', maskOptions);
});


/* Добавление параграфа с кадастровым номером и проверка номеров на уникальность */
function addParagraph() {
    const container = document.getElementById("container");
    const div = document.createElement("div");
    div.className = "input-group mb-3";
    div.classList.add("paragraph");
    const input = document.createElement("input");
    input.type = "text";
    input.onblur = function () {
        checkInputCadastral(input, input.id);
    }
    input.required = true;
    input.name = "new_cadastral_numbers";
    input.className = "form-control custom-form-control";
    input.style.maxWidth = "608px";
    input.style.margin = "5px 0 5px 0";
    const button = document.createElement("button");
    button.innerHTML = "<i class='bx bxs-x-circle'></i>";
    button.style.margin = "8px 0 0 10px"
    button.style.borderRadius = "7px";
    button.style.width = "43px";
    button.style.maxHeight = "32px";
    button.style.backgroundColor = "#012970";
    button.style.color = "#fff";
    button.onclick = function () {
        removeParagraph(button, input);
    };
    div.appendChild(input);
    div.appendChild(button);
    container.appendChild(div);

    const maskOptions = {
        placeholder: "__:__:_______:____"
    };

    $(input).mask('99:99:9999999:9999', maskOptions);
}

function removeParagraph(button, inputElement) {
    const paragraph = button.parentNode;
    paragraph.parentNode.removeChild(paragraph);
}


function checkInputCadastral(input, id) {
    const allInputs = document.querySelectorAll('input[name="cadastral_numbers"], input[name="new_cadastral_numbers"]');
    const values = Array.from(allInputs).map(function (input) {
        return input.value;
    });

    const regex = new RegExp('[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}')
    if (!regex.test(input.value)) {
        showMessageModal("error", 'Неверный формат кадастрового номера');
        return;
    }

    const isDuplicate = values.filter(function (value) {
        return value === input.value;
    }).length > 1;

    if (isDuplicate) {
        showMessageModal("error", "Данный кадастровый номер уже был добавлен");
    } else {
        input.style.cssText = 'background-color:lightgray';
    }
}