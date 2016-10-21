/*jslint browser: true*/
/*global $, jQuery, alert, console, Observatorios, Nodos, Dptos, Mpios, Departamentos, Municipios, Sector, Tematicas, NivelTerritorial, L, GeoJSON, loadTematica, loadSector, loadTerritorial, loadDepartamentos, filtrarTodo, limpiarSeleccion, styleNodos, getColorNodos, highlightFeature, resetHighlightNodos, renderMarkersBase */
/*jslint plusplus: true */

// Variables globales
var map, cartodbAttribution, positron, positronLabels;
// Controles
var info, legend;

// Datos Totales
var filtroData, filtroLayer;
var NodosLayer, DptosLayer, MpiosLayer;

// Seleccion
var NodoSeleccionado, DptoSeleccionado, MpioSeleccionado;
var NodoSur, NodoCentro, NodoCaribe;
var NodosSur, NodosCentro, NodosCaribe;

var NodosSurPutumayo, NodosSurNarino, NodosSurValleCauca, NodosSurCauca;
var NodosCentroBogota, NodosCentroMeta, NodosCentroBoyaca, NodosCentroSantander, NodosCentroNteSantander;
var NodosCaribeBolivar, NodosCaribeSucre, NodosCaribeMagdalena, NodosCaribeAtlantico;

// Funcion Principal
$(document).ready(function () {
    "use strict";

    var i;

    loadTematica();
    loadSector();
    loadTerritorial();
    loadDepartamentos();

    //Convierte el dato JSON en GeoJSON
    Observatorios = GeoJSON.parse(Observatorios, {
        Point: ['LAT', 'LONG']
    });

    /* ------------------- MAPA ------------------*/
    map = L.map('map', {
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

    cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>';

    positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        attribution: cartodbAttribution
    }).addTo(map);

    positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        attribution: cartodbAttribution,
        pane: 'labels'
    }).addTo(map);

    /* ------------------- CONTROLES ------------------*/
    legend = L.control({
        position: 'topright'
    });
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = ['Caribe', 'Centro', 'Sur'],
            labels = [],
            from, to;

        for (i = 0; i < grades.length; i++) {
            from = grades[i];
            labels.push('<i style="background:' + getColorNodos(from) + '"></i> Nodo ' + from + '<br />');
        }
        div.innerHTML = labels.join('<br>');
        return div;
    };
    legend.addTo(map);

    map.attributionControl.addAttribution('observaDHores &copy; <a href="http://pares.com.co/">Fundación Paz y Reconciliación</a>');

    // control that shows state info on hover
    info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info popup');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = (props ? props.TOTAL ? '<h4><center>ObservaDHores</center></h4><p align="right"><b>' + (props.NOMBRE ? 'Municipio ' + props.NOMBRE : props.DEPTO ? 'Departamento ' + props.DEPTO : props.NODO ? 'Nodo ' + props.NODO : '') + '</b><br /><br />' + (props.ACADEMIA ? 'Académicos: ' + props.ACADEMIA + '<br />' : '') + (props.GOBIERNO ? 'Gubernamentales: ' + props.GOBIERNO + '<br />' : '') + (props.PRIVADO ? 'Privados: ' + props.PRIVADO + '<br />' : '') + (props.SOCIEDAD ? 'Sociedad Civil: ' + props.SOCIEDAD + '<br />' : '') + (props.OTRO ? 'Otros: ' + props.OTRO + '<br />' : '') + (props.TOTAL ? '<br /><b>Total ' + props.TOTAL + '</p></b>' : '') : '' : 'Pase el cursor sobre un elemento');
    };

    info.addTo(map);
    $('[data-toggle="tooltip"]').tooltip();

    // Capa de NODOS
    NodosLayer = L.geoJson(undefined, {
        style: styleNodos,
        onEachFeature: function (feature, layer) {
            if (feature.properties.NODO !== "Resto") {
                layer.on('mouseover', highlightFeature);
                layer.on('mouseout', resetHighlightNodos);
                layer.on('click', zoomToFeatureNodos);
            }
        }
    });

    /// Carga de los nodos
    // Sur
    NodoSur = JSON.parse(JSON.stringify(Observatorios));
    NodoSur.features = NodoSur.features.filter(function (a) {
        return a.properties.NODO === 'Sur';
    });
    NodosSur = renderMarkersBase(NodoSur);

    // Centro
    NodoCentro = JSON.parse(JSON.stringify(Observatorios));
    NodoCentro.features = NodoCentro.features.filter(function (a) {
        return a.properties.NODO === 'Centro';
    });
    NodosCentro = renderMarkersBase(NodoCentro);

    // Caribe
    NodoCaribe = JSON.parse(JSON.stringify(Observatorios));
    NodoCaribe.features = NodoCaribe.features.filter(function (a) {
        return a.properties.NODO === 'Caribe';
    });
    NodosCaribe = renderMarkersBase(NodoCaribe);

    // Adiciona las capas
    NodosLayer.addData(Nodos);
    NodosLayer.addTo(map);

    map.addLayer(NodosSur);
    map.addLayer(NodosCentro);
    map.addLayer(NodosCaribe);
    console.log("Listo!");
});

/**
 * Carga la lista de departamentales
 */
function loadDepartamentos() {
    "use strict";

    var i, lista = "<option value='all'>Todos</option>";
    for (i = 0; i < Departamentos.length; i++) {
        lista += "<option value='" + Departamentos[i] + "'>" + Departamentos[i] + "</option>";
    }
    $("#selDepartamento").html(lista);
}


/**
 * Carga la lista de tipos de Observatorios
 */
function loadSector() {
    "use strict";
    var i, lista = "<option value='all'>Todos</option>";
    for (i = 0; i < Sector.length; i++) {
        lista += "<option value='" + Sector[i] + "'>" + Sector[i] + "</option>";
    }
    $("#selSector").html(lista);
}

/**
 * Carga la lista de Tematicas
 */
function loadTematica() {
    "use strict";
    var i, lista = "<option value='all'>Todas</option>";
    for (i = 0; i < Tematicas.length; i++) {
        lista += "<option value='" + Tematicas[i] + "'>" + Tematicas[i] + "</option>";
    }
    $("#selTematica").html(lista);
}

/**
 * carga la lista de niveles territoriales
 */
function loadTerritorial() {
    "use strict";
    var i, lista = "<option value='all'>Todos</option>";
    for (i = 0; i < NivelTerritorial.length; i++) {
        lista += "<option value='" + NivelTerritorial[i] + "'>" + NivelTerritorial[i] + "</option>";
    }
    $("#selTerritorial").html(lista);
}


/**
 * Recupera la seleccion del departamento y carga la lista de municipios asociados
 * @returns {string} la lista de municipios
 */
function filtrarDepartamento() {
    "use strict";

    //var myselect = document.getElementById("selDepartamento"),
    //var DPTO = myselect.options[myselect.selectedIndex].value;

    var i, Mpios, lista, html, DPTO = $('#selDepartamento').val();

    if (DPTO !== 'all') {
        Mpios = Municipios[DPTO] || [];
        lista = "<option value='all'>Todos</option>";
        html = lista + $.map(Mpios, function (Mpio) {
            return '<option value="' + Mpio + '">' + Mpio + '</option>';
        }).join('');

        $("#selMunicipio").html(html);

        filtrarTodo();

    } else {
        if (document.getElementById('selMunicipio').options.length > 1) {
            for (i = document.getElementById('selMunicipio').options.length - 1; i >= 1; i--) {
                document.getElementById('selMunicipio').remove(i);
            }
        }
    }

}

/**
 * filtra los observatorios por las opciones del sidebar
 * @returns {boolean} filtra la capa de observatorios 'filtroData'
 */
function filtrarTodo() {
    "use strict";

    var i, DPTO = document.getElementById('selDepartamento').value,
        Mpio = document.getElementById('selMunicipio').value,
        Sector = document.getElementById('selSector').value,
        Tematica = document.getElementById('selTematica').value,
        Territorial = document.getElementById('selTerritorial').value,
        FiltroTexto = document.getElementById('buscarPalabra').value.toUpperCase();

    if ((DPTO !== 'all') || (Mpio !== 'all') || (Sector !== 'all') || (Tematica !== 'all') || (Territorial !== 'all') || (FiltroTexto !== '')) {

        //map.hasLayer(NodosLayer) === true && map.removeLayer(NodosLayer);
        map.hasLayer(NodosSur) === true && map.removeLayer(NodosSur);
        map.hasLayer(NodosCentro) === true && map.removeLayer(NodosCentro);
        map.hasLayer(NodosCaribe) === true && map.removeLayer(NodosCaribe);
        map.hasLayer(filtroLayer) === true && map.removeLayer(filtroLayer);

        filtroData = JSON.parse(JSON.stringify(Observatorios));

        if (DPTO !== 'all') {
            filtroData.features = filtroData.features.filter(function (a) {
                return a.properties.DEPARTAMENTO === DPTO;
            });
        }

        if (Mpio !== 'all') {

            filtroData.features = filtroData.features.filter(function (a) {
                return a.properties.MUNICIPIO === Mpio;
            });
        }

        if (Sector !== 'all') {
            filtroData.features = filtroData.features.filter(function (a) {
                return a.properties.SECTOR === Sector;
            });
        }

        if (Tematica !== 'all') {

            filtroData.features = filtroData.features.filter(function (a) {
                if (a.properties.TEMATICA.length > 0) {
                    for (i = 0; i < a.properties.TEMATICA.length; i++) {
                        if (a.properties.TEMATICA[i] === Tematica) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }

        if (Territorial !== 'all') {

            filtroData.features = filtroData.features.filter(function (a) {
                if (a.properties.NIVEL_TERRITORIAL.length > 0) {
                    for (i = 0; i < a.properties.NIVEL_TERRITORIAL.length; i++) {
                        if (a.properties.NIVEL_TERRITORIAL[i] === Territorial) {
                            return true;
                        }
                    }
                }
                return false;
            });

        }

        if (FiltroTexto.toUpperCase() !== '') {
            filtroData.features = filtroData.features.filter(function (a) {

                var k1 = a.properties.DEPARTAMENTO.toUpperCase(),
                    k2 = a.properties.MUNICIPIO.toUpperCase(),
                    k3 = a.properties.OBSERVATORIO.toUpperCase(),
                    k4 = a.properties.NODO.toUpperCase(),
                    k5 = a.properties.ALIADOS.toUpperCase(),
                    k6 = a.properties.PRODUCTOS.toUpperCase();

                if ((k1.includes(FiltroTexto)) || (k2.includes(FiltroTexto)) || (k3.includes(FiltroTexto)) || (k4.includes(FiltroTexto)) || (k5.includes(FiltroTexto)) || (k6.includes(FiltroTexto))) {
                    return true;
                } else {
                    return false;
                }
            });

        }

        if (filtroData.features.length > 0) {
            filtroLayer = renderMarkersData(filtroData, 15);
            map.addLayer(filtroLayer);
            map.fitBounds(filtroLayer.getBounds());
        }

        $("#total_places").text(filtroData.features.length);
    } else {
        limpiarSeleccion();
    }

}

/**
 * Limpia la seleccion actual y muestra el mapa vacio
 */
function limpiarSeleccion() {
    "use strict";

    var i;

    map.setView(new L.LatLng(4.5, -73.0), 6);
    map.eachLayer(function (layer) {
        map.removeLayer(layer);
    });
    map.addLayer(positron);
    map.addLayer(positronLabels);
    map.addLayer(NodosLayer);
    map.addLayer(NodosSur);
    map.addLayer(NodosCentro);
    map.addLayer(NodosCaribe);

    document.getElementById('selDepartamento').value = 'all';
    document.getElementById('selMunicipio').value = 'all';
    document.getElementById('selSector').value = 'all';
    document.getElementById('selTematica').value = 'all';
    document.getElementById('selTerritorial').value = 'all';
    document.getElementById('buscarPalabra').value = '';

    if (document.getElementById('selMunicipio').options.length > 1) {
        for (i = document.getElementById('selMunicipio').options.length - 1; i >= 1; i--) {
            document.getElementById('selMunicipio').remove(i);
        }
    }

    // Recupera el listado inicial
    filtroData = JSON.parse(JSON.stringify(Observatorios));
    $("#total_places").text(0);

}

/**
 * Asigna colores por el nodo
 * @param   {[[Type]]} d valor del nodo
 * @returns {[[Type]]} color asignado al nodo
 */
function getColorNodos(d) {
    "use strict";

    return d === 'Caribe' ? '#b2df8a' :
        d === 'Centro' ? '#fdcb7b' :
        d === 'Sur' ? '#a5bfdd' : '#f1f4c7';
}

/**
 * Ajusta la simbologia de los nodos
 * @param   {object} feature Elemento geográfico
 * @returns {object} simbologia
 */
function styleNodos(feature) {
    "use strict";

    return {
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.8,
        fillColor: getColorNodos(feature.properties.NODO)
    };
}

/**
 * Resalta el elemento
 * @param {object} e Vector sobre el que pasa el mouse
 */
function highlightFeature(e) {
    "use strict";

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
    info.update(layer.feature.properties);
}

/**
 * Quita el resaltado a los nodos deseleccionados
 * @param {object} e Vector deseleccionado
 */
function resetHighlightNodos(e) {
    "use strict";

    NodosLayer.resetStyle(e.target);
    NodosLayer.setStyle(styleNodos);
    info.update();
}

/**
 * Zoom al Nodo
 * @param   {object}   e Vector seleccionado
 * @returns {[[Type]]} [[Description]]
 */
function zoomToFeatureNodos(e) {
    "use strict";

    var layer = e.target;
    map.fitBounds(e.target.getBounds());

    NodoSeleccionado = layer.feature.properties.NODO;

    map.hasLayer(NodosLayer) === true && map.removeLayer(NodosLayer);
    map.hasLayer(NodosSur) === true && map.removeLayer(NodosSur);
    map.hasLayer(NodosCentro) === true && map.removeLayer(NodosCentro);
    map.hasLayer(NodosCaribe) === true && map.removeLayer(NodosCaribe);
    map.hasLayer(positronLabels) === true && map.removeLayer(positronLabels);

    // Capa de DEPARTAMENTOS
    DptosLayer = L.geoJson(undefined, {
        filter: function (feature) {
            return (feature.properties.NODO === NodoSeleccionado);
        },
        style: styleNodos,
        onEachFeature: function (feature, layer) {
            layer.bindTooltip(feature.properties.DEPTO, {
                permanent: false,
                direction: "auto"
            });
            layer.on('mouseover', highlightFeature);
            //layer.on('mouseout', resetHighlightDptos);
            //layer.on('click', zoomToFeatureDptos);
        }
    });

    // Adiciona los Departamentos
    DptosLayer.addData(Dptos);
    map.addLayer(DptosLayer);

    if (NodoSeleccionado === 'Sur') {
        NodosSurPutumayo = renderMarkersData(NodoSurPutumayo);
        NodosSurNarino = renderMarkersData(NodoSurNarino);
        NodosSurValleCauca = renderMarkersData(NodoSurValleCauca);
        NodosSurCauca = renderMarkersData(NodoSurCauca, 300);
        map.addLayer(NodosSurPutumayo);
        map.addLayer(NodosSurNarino);
        map.addLayer(NodosSurValleCauca);
        map.addLayer(NodosSurCauca);
    } else if (NodoSeleccionado === 'Centro') {
        NodosCentroBogota = renderMarkersData(NodoCentroBogota);
        NodosCentroMeta = renderMarkersData(NodoCentroMeta);
        NodosCentroBoyaca = renderMarkersData(NodoCentroBoyaca);
        NodosCentroSantander = renderMarkersData(NodoCentroSantander);
        NodosCentroNteSantander = renderMarkersData(NodoCentroNteSantander);
        map.addLayer(NodosCentroBogota);
        map.addLayer(NodosCentroMeta);
        map.addLayer(NodosCentroBoyaca);
        map.addLayer(NodosCentroSantander);
        map.addLayer(NodosCentroNteSantander);
    } else if (NodoSeleccionado === 'Caribe') {
        NodosCaribeAtlantico = renderMarkersData(NodoCaribeAtlantico);
        NodosCaribeMagdalena = renderMarkersData(NodoCaribeMagdalena);
        NodosCaribeSucre = renderMarkersData(NodoCaribeSucre);
        NodosCaribeBolivar = renderMarkersData(NodoCaribeBolivar, 1500);
        map.addLayer(NodosCaribeAtlantico);
        map.addLayer(NodosCaribeMagdalena);
        map.addLayer(NodosCaribeSucre);
        map.addLayer(NodosCaribeBolivar);
    }
}

/**
 * Quita resaltado en Departamentos
 * @param {object} e [[Description]]
 */
function resetHighlightDptos(e) {
    "use strict";
    DptosLayer.resetStyle(e.target);
    DptosLayer.setStyle(styleNodos);
}

/**
 * Genera Cluster Inicial
 * @param   {[[Type]]} data             Informacion a usar
 * @param   {[[Type]]} distancia = 1500 Distancia para unificar
 * @returns {[[Type]]} [[Description]]
 */
function renderMarkersBase(data, distancia = 1500) {

    var cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: distancia
    });

    var layer = L.geoJson(data);
    layer.setZIndex(700);
    cluster.addLayer(layer);
    return cluster;
}

// OBSERVATORIOS
/**
 * Cluster con Ventana Modal
 * @param   {[[Type]]} data            Datos a clusterizar
 * @param   {[[Type]]} distancia = 100 Distancia para unificar
 * @returns {boolean}  [[Description]]
 */
function renderMarkersData(data, distancia = 100) {
    var cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: distancia
    });

    var layer = L.geoJson(data, {
        onEachFeature: function (feature, layer) {
            if (feature.properties) {

                var Telefono = feature.properties.TELEFONO;
                var TelefonoStr = '';
                if (Telefono.length > 0) {
                    Telefono.forEach(function (entry) {
                        TelefonoStr += entry + '<br />';
                    });
                }

                var Correo = feature.properties.CORREO;
                var CorreoStr = '';
                if (Correo.length > 0) {
                    Correo.forEach(function (entry) {
                        CorreoStr += entry + '<br />';
                    });
                }

                var logo = "<center><img class='imgLogo' src='images/" + feature.properties.IDENTIFICADOR + ".png' alt='" + feature.properties.OBSERVATORIO + "' style='height:100px;'></center>";
                var logo = "<center><img class='imgLogo' src='images/" + feature.properties.IDENTIFICADOR + ".png' alt='" + feature.properties.OBSERVATORIO + "' style='height:100px;'></center>";
                var infobasica = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Tipo Observatorio</th><td>" + feature.properties.SECTOR + "</td></tr>" + "<tr><th>Dirección</th><td>" + feature.properties.DIRECCION + ', ' + feature.properties.MUNICIPIO + ', ' + feature.properties.DEPARTAMENTO + "</td></tr>" + (TelefonoStr == '' ? '' : "<tr><th>Teléfono</th><td>" + TelefonoStr + "</td></tr>") + (CorreoStr == '' ? '' : "<tr><th>Correo Electrónico</th><td>" + CorreoStr + "</td></tr>") + (feature.properties.SITIO_WEB == '' ? '' : "<tr><th>Web</th><td><a class='url-break' href='" + feature.properties.SITIO_WEB + "' target='_blank'>" + feature.properties.SITIO_WEB + "</a></td></tr>") + (feature.properties.FACEBOOK == '' ? '' : "<tr><th>Facebook</th><td>" + feature.properties.FACEBOOK + "</td></tr>") + (feature.properties.TWITER == '' ? '' : "<tr><th>Twitter</th><td>" + feature.properties.TWITER + "</td></tr>") + "<table>";

                var tematicas = feature.properties.TEMATICA;
                var tematicasStr = '';
                if (tematicas.length > 0) {
                    tematicas.forEach(function (entry) {
                        tematicasStr += entry + '<br />';
                    });
                }

                var territorial = feature.properties.NIVEL_TERRITORIAL;
                var territorialStr = '';
                if (territorial.length > 0) {
                    territorial.forEach(function (entry) {
                        territorialStr += entry + '<br />';
                    });
                }

                var tipoinformacion = feature.properties.TIPO_INFORMACION;
                var tipoinformacionStr = '';
                if (tipoinformacion.length > 0) {
                    tipoinformacion.forEach(function (entry) {
                        tipoinformacionStr += entry + '<br />';
                    });
                }

                var productos = feature.properties.PRODUCTOS;
                var productosStr = productos;

                layer.on({
                    click: function (e) {
                        $("#feature-title").html('<center>' + feature.properties.OBSERVATORIO + '</center>');
                        $("#logoObservatorio").html(logo);
                        $("#feature-info").html(infobasica);

                        $("#tematicas").html(tematicasStr);
                        tematicasStr == '' || tematicasStr == '<br>' ? $('#tematicasTab').attr('class', 'disabled') : $('#tematicasTab').attr('class', '');
                        $('#tematicasTab').click(function (event) {
                            if ($(this).hasClass('disabled')) {
                                return false;
                            }
                        });

                        $("#territorial").html(territorialStr);
                        territorialStr == '' || territorialStr == '<br>' ? $('#territorialTab').attr('class', 'disabled') : $('#territorialTab').attr('class', '');
                        $('#territorialTab').click(function (event) {
                            if ($(this).hasClass('disabled')) {
                                return false;
                            }
                        });

                        $("#tipoinformacion").html(tipoinformacionStr);
                        tipoinformacionStr == '' || tipoinformacionStr == '<br>' ? $('#tipoinformacionTab').attr('class', 'disabled') : $('#tipoinformacionTab').attr('class', '');
                        $('#tipoinformacionTab').click(function (event) {
                            if ($(this).hasClass('disabled')) {
                                return false;
                            }
                        });

                        $("#productos").html(productosStr);
                        productosStr == '' || productosStr == '<br>' ? $('#productosTab').attr('class', 'disabled') : $('#productosTab').attr('class', '');
                        $('#productosTab').click(function (event) {
                            if ($(this).hasClass('disabled')) {
                                return false;
                            }
                        });

                        $('.nav-tabs a[href="#feature-info"]').tab('show');
                        $("#featureModal").modal("show");
                    }
                });
            }
        }
    });
    layer.setZIndex(750);
    cluster.addLayer(layer);
    return cluster;
}
