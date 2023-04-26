let id = 1
let flag = 1
let array = []
let dt = new DataTransfer();
let all_files = 0 

function GetSelectOption () {
    let button = document.getElementById('btn')
    button.disabled = true;
};

function AddCadastralNumber() {
    GetSelectOption();
    UndisabledButton();
    let cadatral_number = document.getElementById('id_cadastral_number')
    if (array.includes(cadatral_number.value) == false) {
        array.push(cadatral_number.value);
        let div = document.createElement("div");
        div.style.cssText = 'display:flex;';
        div.className='input-group';
        div.id = id;
        div.innerHTML = `<input id='cadastral_number${id}' pattern='[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}' type='text' name='cadastral_numbers' class='form-control' onchange='VaidateCadastralNumbers(${id});' oninput='VaidateCadastral(${id});' readonly value='${cadatral_number.value}' style='border-radius:8px; text-align:center; font-size: 15px'>
        <button id='edit${id}' type='button' onClick='EditCadastral(${id})' style='margin:auto 5px auto 5px;'><i class='bx bxs-edit btn btn-outline-secondary btn-lg'></i></button>
        <button id='delete${id}' type='button' onClick='DeleteCadastral(${id});'><i class='bx bxs-x-circle btn btn-outline-secondary btn-lg' id='test_test'></i></button>`
    
        my_div = document.getElementById("cadastal_numbers");
        my_div.parentNode.insertBefore(div, my_div);
        cadatral_number.value='';
        id ++;
    }
    else {
        alert('Данный кадастровый номер уже добавлен')
    }
};

function UndisabledButton() {
    document.getElementById('order-btn').disabled = false;
}

function DeleteCadastral(id) {
    let cadastral_number = document.getElementById(`cadastral_number${id}`);
    let index = array.indexOf(cadastral_number.value);
    document.getElementById(id).remove();
    array.splice(index, 1);
}


function EditCadastral(id) {
    let cadastral = document.getElementById(`cadastral_number${id}`);
    let edit = document.getElementById(`edit${id}`)
    let delete_button = document.getElementById(`delete${id}`)

    if (flag) {
        edit.innerHTML = "<i class='bx bxs-check-circle btn btn-outline-secondary btn-lg'></i>";
        cadastral.readOnly = false;
        cadastral.style.cssText = 'background-color:lightgray';
        delete_button.style.cssText='background-color:lightgray; border-radius:10px;'
        delete_button.disabled = true;
        let index = array.indexOf(cadastral.value);
        array.splice(index);
        flag--;
    }
    else {
        let [validate_flag, new_cadastral] = VaidateCadastralNumbers(id);
        if (validate_flag) {
            edit.innerHTML = "<i class='bx bxs-edit btn btn-outline-secondary btn-lg'></i>";
            cadastral.readOnly = true;
            cadastral.style.cssText = 'border-radius:8px; text-align:center;'
            delete_button.disabled = false;
            delete_button.style.cssText='background-color:transparent; border-radius:10px;'
            let index = array.indexOf(cadastral.value);
            array.splice(index);
            array.push(new_cadastral);
            flag++;
        }
    }
}


function VaidateCadastral(id){
    let cadastral = document.getElementById(`cadastral_number${id}`);
    let button = document.getElementById(`edit${id}`)
    if (cadastral.checkValidity() && cadastral.value) {
        button.disabled=false;
        button.style.cssText+='background-color:transparent;'
    }
    else {
        button.disabled=true;
        button.style.cssText+='background-color:lightgray; border-radius:10px;'
    }
}


function VaidateCadastralNumbers(id) {
    let cadastral = document.getElementById(`cadastral_number${id}`);
    
    if (array.includes(cadastral.value)) {
        alert('Данный кадастровый номер уже добавлен')

        return false
    }
    else {
        return [true, cadastral.value]
    }
}

function removeFilesItem(index){
    const dt = new DataTransfer()
    const input = document.getElementById('file-input')
    const { files } = input

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (index !== i) {
        dt.items.add(file) 
      }    
    }
    input.files = dt.files
    document.getElementById(`custom${index}`).style.cssText='display:none;'
}

window.onload = function UploadFiles() {
    let $fileInput = $('.file-input');
    let $droparea = $('.drop-area');

    $fileInput.on('dragenter focus click', function() {
    $droparea.addClass('is-active');
    });

    $fileInput.on('dragleave blur drop', function() {
    $droparea.removeClass('is-active');
    });

    $fileInput.on('change', function() {
    let filesCount = $(this)[0].files.length;

    
    if (filesCount) {
        document.getElementById('order-btn').disabled = false;
        document.getElementById('form-div').style.cssText = 'display:none';
        let div = document.getElementsByClassName('file-input-list')[0]
        let files = document.getElementById('file-input').files
        
        for(let i = 0; i < filesCount; i++){
            div.innerHTML += `<div class="input-file-list-item" style="margin-top:5px;" id='custom${all_files}'>` +
                '<span class="input-file-list-name"> <svg width="28" height="33" viewBox="0 0 28 33" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M17.8501 1L27.1176 9.72913M27.1176 9.72913H19.5351C19.0882 9.72913 18.6596 9.56192 18.3436 9.26428C18.0276 8.96663 17.8501 8.56295 17.8501 8.14202V1H2.68501C2.23812 1 1.80953 1.16721 1.49353 1.46486C1.17753 1.7625 1 2.16619 1 2.58711V30.3616C1 30.7826 1.17753 31.1862 1.49353 31.4839C1.80953 31.7815 2.23812 31.9487 2.68501 31.9487H25.4326C25.8795 31.9487 26.3081 31.7815 26.6241 31.4839C26.9401 31.1862 27.1176 30.7826 27.1176 30.3616V9.72913Z" stroke="#2D9CDB" stroke-linecap="round" stroke-linejoin="round"/> </svg>' + files[i].name + '</span>' +
                `<a href="#" onclick="removeFilesItem(${all_files});" class="input-file-list-remove">        x</a>` +
                '</div>'          
            all_files += 1
        }
    }
    });
}