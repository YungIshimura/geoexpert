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