function showMessageModal(type, message) {
    const messageModal = $("#message-modal");
    const messageEl = $("#message");
    messageEl.removeClass().addClass("alert");

    if (type === "success") {
        messageEl.addClass("alert-success");
    } else if (type === "error") {
        messageEl.addClass("alert-danger");
    }

    messageEl.text(message);
    messageModal.modal("show");

    const closeButton = document.getElementById("close-icon");
    closeButton.addEventListener("click", hideModal);

    // Закрываем модальное окно по истечению времени
    setTimeout(hideModal, 2000);
}

function hideModal() {
    const messageModal = $("#message-modal");
    messageModal.modal("hide");
}

/* Системные сообщения с использованием библиотеки animate.css */
function showMessage(type, message) {
    const messageModal = $("#message-modal");
    const messageEl = $("#message");
    messageEl.removeClass().addClass("alert");

    const iconEl = messageEl.find('.alert-icon');
    iconEl.empty(); // Очищаем содержимое элемента

    if (type === "success") {
        messageEl.addClass("alert-success");
        iconEl.append('<svg class="bi flex-shrink-0 me-2" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill" id="success-icon" /></svg>');
    } else if (type === "error") {
        messageEl.addClass("alert-danger");
        iconEl.append('<svg class="bi flex-shrink-0 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill" id="error-icon" /></svg>');
    }

    const messageText = $("#message-text");
    messageText.text(message);

    messageModal.removeClass('hidden');
    messageModal.addClass('animate__animated animate__fadeInDown animate__faster');

    const closeButton = document.getElementById("close-icon");
    closeButton.addEventListener("click", hideMessage);

    // Закрываем модальное окно по истечению времени
    setTimeout(hideMessage, 1000);
}

function hideMessage() {
    const messageModal = $("#message-modal");
    messageModal.removeClass('animate__fadeInDown');
    messageModal.addClass('animate__fadeOutUp');

    setTimeout(function () {
        messageModal.addClass('hidden');
        messageModal.removeClass('animate__animated animate__fadeOutUp animate__faster');
    }, 1000);
}