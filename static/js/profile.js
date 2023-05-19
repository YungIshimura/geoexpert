const fileInput = document.querySelector('#id_image');
const saveButton = document.querySelector('#addImage');

saveButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    document.querySelector('#save_button').click();
});

function deleteImage() {
    document.getElementById("image-clear_id").checked = true;
    document.querySelector('#save_button').click();
}