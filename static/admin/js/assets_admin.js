django.jQuery(document).ready(function(){
    django.jQuery(".field-length").css('display', 'none');
    django.jQuery(".field-square").css('display', 'block');
    django.jQuery('#id_is_liner').click(function() {
        if (django.jQuery('#id_is_liner').is(':checked')) {
            django.jQuery(".field-square").css('display', 'none');
            django.jQuery(".field-length").css('display', 'block');
        }
        else {
            django.jQuery(".field-length").css('display', 'none');
            django.jQuery(".field-square").css('display', 'block');
        }
    });
})