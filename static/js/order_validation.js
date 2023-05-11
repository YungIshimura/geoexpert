const form = document.querySelector('#order-form');
const submitBtn = document.querySelector('#send-order');
const typeWork = form.querySelectorAll(`*[name="type_work"]`);

const namesArray = [
    "square",
    "city",
    "street",
    "house_number",
    "phone_number",
    "email",
    "name",
    "surname",
    "purpose_building",
    "length",
    "type_work",
    "work_objective"
];

submitBtn.addEventListener('click', (event) => {
    event.preventDefault();

    let errorMessage = "";

    for (let i = 0; i < namesArray.length; i++) {
        const field = form.querySelector(`*[name=${namesArray[i]}]`);

        if (field.name === 'type_work') {
            let uncheckedCount = 0;

            typeWork.forEach(type => {
                if (!type.checked) {
                    uncheckedCount++;
                }
            });

            if (uncheckedCount === typeWork.length) {
                errorMessage = "Укажите необходимые типы инженерных изысканий";
                break;
            }
        }

        if (!field.value) {
            const label = form.querySelector(`label[for=${field.id}]`);
            errorMessage = `Заполните поле ${label.innerText.toLowerCase()}`;
            break;
        }
    }

    if (errorMessage) {
        showMessageModal("error", errorMessage);
    } else {
        form.submit();
    }
});