const fileInput = document.querySelector('#id_image');
const saveButton = document.querySelector('#addImage');

saveButton.addEventListener('click', () => {
    fileInput.click();
});

function deleteImage() {
    var image = document.getElementById('avatar_id');
    image.style.display = "none";

    document.getElementById("image-clear_id").checked = true;
    var imageContainer = document.getElementById('imageContainer');
    var imgElement = document.createElement('img');
    var pathToImage = "{% static 'default_avatar.png' %}";
    imgElement.src = pathToImage;
    imgElement.className = "rounded-circle mt-5";
    imgElement.style.width = "200px";
    imageContainer.innerHTML = '';
    imageContainer.appendChild(imgElement);
    document.querySelector('#close_modal').click();

}


document.getElementById('id_image').addEventListener('change', function (event) {
    var file = event.target.files[0];

    if (file) {
        var reader = new FileReader();

        reader.onload = function (e) {
            var imageContainer = document.getElementById('imageContainer');
            var imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.className = "rounded-circle mt-5";
            imgElement.style.width = "200px";
            imageContainer.innerHTML = '';
            imageContainer.appendChild(imgElement);
            var image = document.getElementById('avatar_id');
            image.style.display = "none";
            document.querySelector('#close_modal_chg').click();
        };
        reader.readAsDataURL(file);
    }
});