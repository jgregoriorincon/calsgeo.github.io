var NodoSeleccionado, DptoSeleccionado, MpioSeleccionado;
var DptosLayer, MpiosLayer;

var NodosSurPutumayo, NodosSurNarino, NodosSurValleCauca, NodosSurCauca;
var NodosSur, NodosCentro, NodosCaribe;

/* Overlay Layers */
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#00FFFF",
  fillOpacity: 0.7,
  radius: 10
};


/* ------------------- MAPA ------------------*/
var map = L.map('map', {
    maxZoom: 18,
    minZoom: 5,
    zoomControl: false,
    scrollWheelZoom: false
});

map.setView([4.5, -73.0], 6);

map.createPane('labels');

// This pane is above markers but below popups
map.getPane('labels').style.zIndex = 650;

// Layers in this pane are non-interactive and do not obscure mouse/touch events
map.getPane('labels').style.pointerEvents = 'none';


var cartodbAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';

var positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: cartodbAttribution
}).addTo(map);

var positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    attribution: cartodbAttribution,
    pane: 'labels'
});

// Capa de NODOS
var NodosLayer = L.geoJson(undefined, {
    style: styleNodos,
    onEachFeature: function (feature, layer) {
        if (feature.properties.NODO !== "Resto") {
            layer.bindTooltip("Nodo " + feature.properties.NODO, {
                permanent: true,
                direction: "auto"
            });
            layer.on('mouseover', highlightFeature);
            layer.on('mouseout', resetHighlightNodos);
            layer.on('click', zoomToFeatureNodos);
        }
    }
})

// Resaltado
function highlightFeature(e) {

    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

// Quitar Resaltado NODOS
function resetHighlightNodos(e) {
    NodosLayer.resetStyle(e.target);
    NodosLayer.setStyle(styleNodos);
}

// Zoom al elemento
function zoomToFeatureNodos(e) {
    var layer = e.target;

    map.fitBounds(e.target.getBounds());

    NodoSeleccionado = layer.feature.properties.NODO;

    map.removeLayer(NodosLayer);
    map.removeLayer(NodosSur);
    map.removeLayer(NodosCentro);
    map.removeLayer(NodosCaribe);

    // Capa de DEPARTAMENTOS
    DptosLayer = L.geoJson(undefined, {
        filter: function (feature) {
            return (feature.properties.NODO === NodoSeleccionado)
        },
        style: styleNodos,
        onEachFeature: function (feature, layer) {

            layer.bindTooltip(feature.properties.DEPTO, {
                permanent: true,
                direction: "auto"
            });
            layer.on('mouseover', highlightFeature);
            layer.on('mouseout', resetHighlightDptos);
            layer.on('click', zoomToFeatureDptos);
        }

    })

    if (NodoSeleccionado == 'Sur') {
        NodosSurPutumayo = renderMarkersData(NodoSurPutumayo);
        NodosSurNarino = renderMarkersData(NodoSurNarino);
        NodosSurValleCauca = renderMarkersData(NodoSurValleCauca);
        NodosSurCauca = renderMarkersData(NodoSurCauca);

        map.addLayer(NodosSurPutumayo);
        map.addLayer(NodosSurNarino);
        map.addLayer(NodosSurValleCauca);
        map.addLayer(NodosSurCauca);
    }

    DptosLayer.addData(Dptos);
    map.addLayer(DptosLayer);
}

// Quitar Resaltado DEPARTAMENTOS
function resetHighlightDptos(e) {
    DptosLayer.resetStyle(e.target);
    DptosLayer.setStyle(styleNodos);
}

// Zoom al elemento
function zoomToFeatureDptos(e) {
    var layer = e.target;

    map.fitBounds(e.target.getBounds());

    DptoSeleccionado = layer.feature.properties.DEPTO;

    map.removeLayer(DptosLayer);

    map.removeLayer(NodosSurPutumayo);
    map.removeLayer(NodosSurNarino);
    map.removeLayer(NodosSurCauca);
    map.removeLayer(NodosSurValleCauca);

    // Capa de MUNICIPIOS
    MpiosLayer = L.geoJson(undefined, {
        filter: function (feature) {
            return (feature.properties.DEPTO === DptoSeleccionado)
        },
        style: styleNodos,
        onEachFeature: function (feature, layer) {
            layer.bindTooltip(feature.properties.NOMBRE, {
                permanent: false,
                direction: "auto"
            });
            layer.on('mouseover', highlightFeature);
            layer.on('mouseout', resetHighlightMpios);
            layer.on('click', zoomToFeatureMpios);
        }

    })

    switch (DptoSeleccionado) {
    case 'PUTUMAYO':
        NodosSurPutumayo = renderMarkersData(NodoSurPutumayo, 10);
        map.addLayer(NodosSurPutumayo);
        break;
    }

    MpiosLayer.addData(Mpios);
    map.addLayer(MpiosLayer);
}

// Quitar Resaltado DEPARTAMENTOS
function resetHighlightMpios(e) {
    DptosLayer.resetStyle(e.target);
    DptosLayer.setStyle(styleNodos);
}

// Zoom al elemento
function zoomToFeatureMpios(e) {
    var layer = e.target;

    map.fitBounds(e.target.getBounds());

    MpioSeleccionado = layer.feature.properties.COD_DANE;

    map.removeLayer(MpiosLayer);

    // Capa de MUNICIPIOS
    MpiosLayer = L.geoJson(undefined, {
        filter: function (feature) {
            return (feature.properties.COD_DANE === MpioSeleccionado)
        },
        style: styleNodos,
        onEachFeature: function (feature, layer) {
            layer.bindTooltip(feature.properties.NOMBRE, {
                permanent: true,
                direction: "auto"
            });
            layer.on('mouseover', highlightFeature);
            layer.on('mouseout', resetHighlightMpios);
            layer.on('click', zoomToFeatureMpios);
        }

    })

    MpiosLayer.addData(Mpios);
    map.addLayer(MpiosLayer);
}

NodosLayer.addData(Nodos);
NodosLayer.addTo(map);

NodosSur = renderMarkersBase(NodoSur);
NodosCentro = renderMarkersBase(NodoCentro);
NodosCaribe = renderMarkersBase(NodoCaribe);

map.addLayer(NodosSur);
map.addLayer(NodosCentro);
map.addLayer(NodosCaribe);
//markerLayer.ProcessView();

// OBSERVATORIOS
function renderMarkersBase(data, distancia = 1500) {
    var cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: distancia
    });

    var layer = L.geoJson(data);
    cluster.addLayer(layer);

    return cluster;
}

// OBSERVATORIOS
function renderMarkersData(data, distancia = 100) {
    var cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: distancia
    });

    var layer = L.geoJson(data, {
        onEachFeature: function (feature, layer) {

            if (feature.properties) {
                var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Nombre Contacto</th><td>" + feature.properties.CONTACTO + "</td></tr>" + "<tr><th>Telefono</th><td>" + feature.properties.TELEFONO + "</td></tr>" + "<tr><th>Direccion</th><td>" + feature.properties.DIRECCION + "</td></tr>" + "<tr><th>Web</th><td><a class='url-break' href='" + feature.properties.SITIO_WEB + "' target='_blank'>" + feature.properties.SITIO_WEB + "</a></td></tr>" + "<table>";
                layer.on({
                    click: function (e) {
                        $("#feature-title").html(feature.properties.OBSERVATORIO);
                        $("#feature-info").html(content);
                        $("#featureModal").modal("show");
                        highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
                    }
                });
            }
        }
    });
    cluster.addLayer(layer);

    return cluster;
}

// ZOOM
map.on('zoomend', function () {
    if (map.getZoom() == 6) // && map.hasLayer(NodosLayer))
    {
        map.hasLayer(MpiosLayer) === true && map.removeLayer(MpiosLayer);
        map.hasLayer(DptosLayer) === true && map.removeLayer(DptosLayer);

        map.hasLayer(NodosSurPutumayo) === true && map.removeLayer(NodosSurPutumayo);
        map.hasLayer(NodosSurValleCauca) === true && map.removeLayer(NodosSurValleCauca);
        map.hasLayer(NodosSurCauca) === true && map.removeLayer(NodosSurCauca);
        map.hasLayer(NodosSurNarino) === true && map.removeLayer(NodosSurNarino);

        map.hasLayer(NodosLayer) === false && map.addLayer(NodosLayer);

        map.hasLayer(NodosSur) === false && map.addLayer(NodosSur);
        map.hasLayer(NodosCentro) === false && map.addLayer(NodosCentro);
        map.hasLayer(NodosCaribe) === false && map.addLayer(NodosCaribe);
    }
});

/* ------------------- CONTROLES ------------------*/
L.control.defaultExtent().addTo(map);

var legend = L.control({
    position: 'topright'
});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = ['Caribe', 'Centro', 'Sur'],
        labels = ['<strong> observaDHores <br /> </strong>'],
        from, to;

    for (var i = 0; i < grades.length; i++) {
        from = grades[i];

        labels.push(
            '<i style="background:' + getColorNodos(from) + '"></i> Nodo ' +
            from + '<br />');
    }
    div.innerHTML = labels.join('<br>');
    return div;

};

legend.addTo(map);

map.attributionControl.addAttribution('observaDHores &copy; <a href="http://pares.com.co/">Fundación Paz y Reconciliación</a>');