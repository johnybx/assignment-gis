var geomap = null;
var geojson = null;

function mapInit(map, options) {

        L.tileLayer('https://api.mapbox.com/styles/v1/brokolicka/cj8pp1l0o2lqo2slhn1wgrpzy/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJva29saWNrYSIsImEiOiJjaXoyenF1ZmcwMDJpMnhxdGVvZ3g2YXh3In0.QsZbHS7KdM1b_13YrdS-xw', {
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
        };

$(document).ready(function(){
    $("#coords_form").data("last_id","1");
    $("#coords_form").data("max_id",3);
    window.location.hash = "#home";
    $('html,body').animate({
            scrollTop: $(".home").offset().top},'slow');

    $(".add_coords_fields").click(function(){
        new_id = $("#coords_form").data("max_id")
        $("#coords_form").data("max_id", new_id+1);
        var element = "<div id='" + new_id.toString() + `' class='coords'>
        <label>Latitude: </label> <input class="input_coords form-control input-sm" type="text" name="Latitude" value="">
        <label>Longtitude: </label> <input class="input_coords form-control input-sm" type="text" name="Longtitude" value="">
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
        console.log(parrent);
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
                    $('.radiobutton_options_radius').prev().offset({"top":$('.checkbox_options_dist').prev().offset().top,"left":$('.radiobutton_options_radius').prev().offset().left});
                    $('.radiobutton_options_radius').offset({"top":$('.checkbox_options_dist').offset().top,"left":$('.radiobutton_options_radius').offset().left}); 
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
        if (feature.properties && feature.properties.popup_text && feature.properties.popup_text != "") {
            layer.bindPopup(feature.properties.popup_text);
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
        var data = {};
        var coords = $("#coords_form").children("div");
        for (var i = 0; i < coords.length; i++){
            data[i] = {};
            data[i]['lat'] = $('#' + coords[i].id).find("input[name=Latitude]").val();
            data[i]['lon'] = $('#' + coords[i].id).find("input[name=Longtitude]").val();
        }

        var options = {};

        var opt = $('.checkbox_options:checked');

        for (i = 0; i < opt.length; i++) {
            var name = opt[i].name;
            var value = opt[i].parentNode.innerText;
            if (!( name in options)) {
                options[name] = [];
            }
            options[name].push(value);
        }
        
        options['route'] = $('.radiobutton_options:checked').parent().text();
        options['distance'] = $('.checkbox_options_dist').val();
        options['radius'] = $('.radiobutton_options_radius').val();

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
            data: JSON.stringify({"data":data,"options":options}),

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
                    fillOpacity: 0.7
                };
                var collors = {'bar':"#ff7800",'caffe':"#bf8040", 'pub':"#66ff33", 'restaurant':"#ffff80",'fuel':"#1a75ff",'hotel':"#df80ff",'motel':"#ff5050",'information':"#f2f2f2",'viewpoint':"#b3ffb3",'camp_site':"#2eb82e"};
                if ("success" in json){
                    geojson = L.geoJSON(json["success"]["geojson"], {
                        onEachFeature: onEachFeature,
                        pointToLayer: function (feature, latlng) {
                            if (feature.properties && feature.properties.amenity && (feature.properties.amenity in collors)){
                                geojsonMarkerOptions.fillColor = collors[feature.properties.amenity];
                            }
                            else if (feature.properties && feature.properties.tourism && (feature.properties.tourism in collors)){
                                geojsonMarkerOptions.fillColor = collors[feature.properties.tourism];
                            }
                            return L.circleMarker(latlng, geojsonMarkerOptions);
                        },
                        style: function(feature) {
                            if (feature.properties && (feature.properties.name != 'route') && (feature.geometry.type == 'LineString')) {
                                return {color: "#ff0000",fillColor: '#ff0000'};
                            }
                        }
                    });
                    geomap.addLayer(geojson);
                }
                else if ("error" in json){
                    var warning_el = `<div class="alert alert-danger fade in">
                        <a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>
                        <strong>Error!</strong> ` + json['error']['message'] + `
                    </div>`;
                    $("#coords_form").before(warning_el);
                }
                $this.button('reset');
            },
            error: function(xhr,errmsg,err) {
                $this.button('reset');
                console.log(xhr.status + ": " + xhr.responseText + ", " + errmsg);
            }
        });
    });

});
