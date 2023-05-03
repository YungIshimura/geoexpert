$(function () {
    $(".cadastral_number").each(function () {
        let $span = $(this).find("span");
        if ($span.length <= 3) return;

        $span.slice(3).hide();
        $(this).append('<a class="js-show" style="cursor: pointer; opacity: 60%">...</a>');
    });
    const btn = document.querySelector(".js-show");
    const content = document.querySelector("span");
    btn.addEventListener("click", btnClick);

    function btnClick() {

        if (content.classList.contains("hidden")) {
            $(this).siblings("span").slice(3).hide();
        } else {
            $(this).siblings("span").show();
        }

        content.classList.toggle("hidden");
    }
});