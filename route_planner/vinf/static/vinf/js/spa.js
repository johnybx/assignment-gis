var geomap = null;
var geojson = null;

function mapInit(map, options) {

        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJva29saWNrYSIsImEiOiJjaXoyenF1ZmcwMDJpMnhxdGVvZ3g2YXh3In0.QsZbHS7KdM1b_13YrdS-xw', {
            attribution: '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            }).addTo(map);

        map.setView([48.148280, 17.107380], 9);

        map.locate({setView: true, maxZoom: 15});

        var popup = L.popup();
        
        function onMapClick(e) {
            popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);
            var coords_id = '#' + $("#coords_form").data("last_id");

            $(coords_id).find("input[name=Latitude]").val(e.latlng.toString().split(",")[0].split("(")[1]);
            $(coords_id).find("input[name=Longtitude]").val( e.latlng.toString().split(",")[1].split(")")[0]);
            var next_id = $(coords_id).next("div.coords").attr('id')
            if (next_id == null) {
                next_id = $(coords_id).siblings("div.coords").first().attr('id')
                }
            $("#coords_form").data("last_id", next_id);
        }
        map.on('click', onMapClick);
        geomap = map;

        function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
            if (feature.properties && feature.properties.name) {
                layer.bindPopup(feature.properties.name);
            }
        }
        var geojsonMarkerOptions = {
                        radius: 8,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };
        geojson = L.geoJSON(geojson1, {
            onEachFeature: onEachFeature,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        });
        geomap.addLayer(geojson);

        
        };

$(document).ready(function(){
    $("#coords_form").data("last_id","1");
    $("#coords_form").data("max_id",3);
    window.location.hash = "#application";
    $('html,body').animate({
            scrollTop: $(".application").offset().top},'slow');

    $('[data-toggle="popover"]').popover({container: 'body'});

    $('.a_submit').click(function(){
        $('.form_field').attr('value', $(this).attr('name') );
        $('.form_field_value').attr('value', $(this).text().split('(')[0].trim() );
        $('.search_filter_form').submit(); 

    });

    $('#autocomplete_form').keypress(function(){
            console.log("keypress");
            console.log($('#autocomplete_form')[0].value.length);
        if ($('#autocomplete_form')[0].value.length > 3){
            var csrftoken = Cookies.get('csrftoken');
            //var csrftoken = $("[name=csrfmiddlewaretoken]").val(); if sessions enabled.
            function csrfSafeMethod(method) {
                return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
            }
            $.ajaxSetup({
                 beforeSend: function(xhr, settings) {
                    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                }
            });
            data = {'field_value':$('#autocomplete_form')[0].value,'query': $('#query').attr('value')}
            $.ajax({
                url: "/vinf/autocomplete",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
    
                success: function(json) {
                    console.log(json);
                    element = '<datalist id="autocomplete"> ';
                    for (i=0 ; i< json.length;i++){
                        element += '<option value="'+ json[i]['_source']['nazov'] +'">  ';
                        }
                    element += ' </datalist>';
                    $('#autocomplete').remove();
                    $('#autocomplete_form').after(element);
               } 
            });
            }
        });

    $(".add_coords_fields").click(function(){
        new_id = $("#coords_form").data("max_id")
        $("#coords_form").data("max_id", new_id+1);
        var element = "<div id='" + new_id.toString() + `' class='coords'>
        Latitude: <input class="input_coords" type="text" name="Latitude" value="">
        Longtitude: <input class="input_coords" type="text" name="Longtitude" value="">
        <button class="remove_coords_fields btn btn-primary btn-xs" type="button">-</button><br><br>
        </div>`
        $(".last_appended").after(element);
        $(".last_appended").removeClass("last_appended");
        $("#"+ new_id.toString()).addClass("last_appended");
        $("#"+ new_id.toString()).children(".input_coords").click(parrent_id);
        $("#"+ new_id.toString()).children(".remove_coords_fields").click(removeElement);
        
    });

    function removeElement(){
        var parrent = $(this).parent();
        if (parrent.hasClass("last_appended")){
            parrent.prev().addClass("last_appended");
        }
        if (parrent.attr("id").toString() == $("#coords_form").data("last_id")) {
            $("#coords_form").data("last_id", parrent.next().attr("id"));
        }
        parrent.remove();
    }

    function parrent_id(e){
        $("#coords_form").data("last_id",$(this).parent().attr("id").toString());
    }
    
    $(".input_coords").click(parrent_id);

    $(window).on('hashchange', function(){
        var hash = window.location.hash.replace("#","");
        pages = ["home", "application", "tutorial"];
        if (pages.indexOf(hash) > -1) {
            $(".pages").addClass("invisible");
            $("." + hash).removeClass("invisible");
            if (hash == "application") {
                geomap.invalidateSize();
            }
        }
    });
    
    $(".nav a").on("click", function(){
        $(".nav").find(".active").removeClass("active");
        $(this).parent().addClass("active");
    });

    $(".carousel-inner a").on("click", function(){
        $(".nav").find(".active").removeClass("active");
        $(".nav a[href='"+ $(this).attr("href") +"']").parent().addClass("active");
    });
    
    $(".scroll-down").click(function(){
        $('html,body').animate({
            scrollTop: $(".featurette-pannels").offset().top},'slow');
    });

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name);
        }
    }

    $("#find_route_btn").click(function(){
        var $this = $(this);
        $this.button('loading');
        var csrftoken = Cookies.get('csrftoken');
        //var csrftoken = $("[name=csrfmiddlewaretoken]").val(); if sessions enabled.
        function csrfSafeMethod(method) {
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }
        data = {};
        var coords = $("#coords_form").children("div");
        for (var i = 0; i < coords.length; i++){
            data[i] = {};
            data[i]['lat'] = $('#' + coords[i].id).find("input[name=Latitude]").val();
            data[i]['lon'] = $('#' + coords[i].id).find("input[name=Longtitude]").val();
        }
        $.ajaxSetup({
             beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
        $.ajax({
            url: "find_route",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),

            success: function(json) {
                if (geojson !== null) {
                    geomap.removeLayer(geojson);
                    }
                var geojsonMarkerOptions = {
                    radius: 8,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                };
                if ("success" in json){
                    geojson = L.geoJSON(json["success"]["geojson"], {
                        onEachFeature: onEachFeature,
                        pointToLayer: function (feature, latlng) {
                            return L.circleMarker(latlng, geojsonMarkerOptions);
                        }
                    });
                    geomap.addLayer(geojson);
                }
                else if ("error" in json){
                    var warning_el = `<div class="alert alert-danger fade in">
                        <a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>
                        <strong>Error!</strong> Less than two coordinates given! Need at least two coordinates.
                    </div>`;
                    $("#1").before(warning_el);
                }
                $this.button('reset');
            },
            error: function(xhr,errmsg,err) {
                console.log(xhr.status + ": " + xhr.responseText + ", " + errmsg);
            }
        });
    });

});
