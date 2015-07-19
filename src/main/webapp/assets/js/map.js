//From examples
L.mapbox.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q';

var WeatherBrowser = WeatherBrowser || {

        states: {},

        buildFeatureLayer: function() {
            return L.mapbox.featureLayer(turf.featurecollection([]), {
                pointToLayer: function (feature, latlon) {
                    return L.polyline([latlon]);
                }
            });
        },

        setupMap: function () {

            var filteredYear = 1955;

            var map = L.mapbox.map('turfMap', 'mapbox.light', {
                // These options apply to the tile layer in the map.
                tileLayer: {
                    // Disable world wrapping.
                    continuousWorld: false,
                    // Disable loading tiles outside of the world bounds.
                    noWrap: true
                }
            }).setView([39.37, -96.33], 3);

            var stateLayer = L.mapbox.featureLayer().addTo(map);
            var incidenceHeatLayer = L.heatLayer([], {radius: 60, maxZoom: 12});
            var overallHeatLayer = L.heatLayer([], {radius: 10, maxZoom: 12});
            var tornadoLayer = WeatherBrowser.buildFeatureLayer();

            //Define a function to update the annual heatmap. This gets called once on initial load
            //to create the heatmap for 1955 then again anytime the slider moves backwards or forwards
            //to a different year.
            WeatherBrowser.updateHeatMap = function(tornadoLayer) {
                var latLngs = [];
                tornadoLayer.eachLayer(function (l) {
                    for (var a = 0; a < l.getLatLngs().length; a++) {
                        latLngs.push(l.getLatLngs()[a]);
                    }
                });
                incidenceHeatLayer.setLatLngs(latLngs);
            };

            var buildTornadoTooltips = function() {
                tornadoLayer.eachLayer(function (layer) {
                    //Build a tooltip for each tornado on the map
                    var content = '<h2>' + layer.feature.properties['sev'] + ' Tornado</h2><br/>' +
                        '<p>' + layer.feature.properties['date'] + '</p>' +
                        '<p>Fatalities: ' + layer.feature.properties['ftl'] + '</p>' +
                        '<p>Injuries: ' + layer.feature.properties['inj'] + '</p>';

                    if( layer.feature.geometry.type === 'LineString' ) {
                        content += '<p>Length: '+turf.lineDistance(layer.feature).toFixed(2)+' miles</p>';
                    }

                    layer.bindPopup(content);
                });
            };

            //Limit display of data to a given year to improve performance.
            //This is called once on initial map load then again anytime the year
            //slider moves to a new year (backwards or forwards).
            WeatherBrowser.applyDateFilter = function (year) {
                tornadoLayer.setFilter(function (f) {
                    //Attempt to simplify any complex lines - this helps performance in a small way
                    if(!f.properties['simplified'] && f.geometry.type === 'LineString' && f.geometry.coordinates.length > 2 ) {
                        f.geometry = turf.simplify(f).geometry;
                        f.properties['simplified'] = true;
                    }
                    return f.properties['year'] === year;
                });
                WeatherBrowser.updateHeatMap(tornadoLayer);
                buildTornadoTooltips();
            };

            //Set the initial filter on the map to only display data from 1955
            var start = 1955;
            WeatherBrowser.applyDateFilter(start);

            tornadoLayer.on('ready', function () {
                //When the tornado data layer has reported it is ready then add it to the map after building
                //initial tooltips
                buildTornadoTooltips();
                map.addLayer(tornadoLayer);
                //Calculate the annual heat map for the first year that we display by default (1955)
                WeatherBrowser.updateHeatMap(tornadoLayer);

                //Run through all tornado data in the layer and calculate the overall heat map.
                var latLngs = [];
                var tornadoes = tornadoLayer.getGeoJSON();
                for( var i = 0; i < tornadoes.features.length; i++ ) {
                    var item = tornadoes.features[i];
                    if( item.geometry.type === 'Point' ) {
                        var point = item.geometry.coordinates;
                        latLngs.push(L.latLng(point[1], point[0]))
                    } else {
                        for( var j = 0; j < item.geometry.coordinates.length; j++ ) {
                            var firstPoint = item.geometry.coordinates[j];
                            latLngs.push(L.latLng(firstPoint[1], firstPoint[0]))
                        }
                    }
                }

                overallHeatLayer.setLatLngs(latLngs);
            }).on('error', function (err) {
                    console.log(err);
            }).loadURL('http://localhost:7777/WeatherBrowser/assets/data/tornadoData.json');

            //Build the tabs that will be displayed on the year slider. Label every 10 years to reduce clutter.
            var tabs = [];
            for (var i = 0; i < 60; i++) {
                var year = 1955 + i;
                var textVal = (year % 10 == 0) ? year.toString() : '';
                tabs.push({text: textVal, date: new Date(year + '-01-01')});
            }
            // Create the year slider.
            var slider = new Razorfish.Slider({
                width: 420,
                handleWidth: 12,
                tabs: tabs
            }).prependTo($("#slider")).bind('range', function (ev, min, max) {
                //Anytime the slider changes this function is fired. We evaluate if the slider has changed enough
                //from the previous value to warrant updating the map to a new year's data.
                var year = 1955 + min;
                if( Math.abs(year - filteredYear) > 1.4 ) {
                    //User has moved slider to a new year. Reset map filter to display tornadoes from new year.
                    filteredYear = 1955 + Math.round(min);
                    WeatherBrowser.applyDateFilter(filteredYear);
                }
            }).setRange(0, 0);

            /*
             * Setup controls to allow map to be toggled
             */
            var controls = L.control.layers({}, {
                "Tornadoes": tornadoLayer,
                "Yearly Heat Map": incidenceHeatLayer,
                "Overall Heat Map": overallHeatLayer
            });
            controls.setPosition('bottomleft');
            controls.addTo(map);

            /*
             * Load GeoJSON data for state borders
             */
            //Source: https://raw.githubusercontent.com/datasets/geo-boundaries-us-110m/master/json/ne_110m_admin_1_states_provinces_shp_scale_rank.geojson
            // - Updated to add state names
            $.ajax({
                url: 'http://localhost:7777/WeatherBrowser/assets/data/states.json'
            }).success(function(data){
                states = JSON.parse(data);
            });

            /*
             * Establish a click listener on the map that will handle displaying states.
             */
            map.on('click', function(e){
                //Grab the point on the map that the user clicked
                var clickPoint = turf.point([e.latlng.lng, e.latlng.lat]);
                var containingState;
                //Iterate the each state...
                for(var i=0; i < states.features.length; i++) {
                    var state = states.features[i];
                    //...and use Turf to determine if the click point is bounded by one of them
                    if( turf.inside(clickPoint, state) ) {
                        containingState = state;
                        break;
                    }
                }
                //If another state is currently being displayed then remove it regardless of whether
                //this click was inside another state. This allows the user to 'clear' display by
                //selecting a point outside the United States.
                if( stateLayer != null ) {
                    map.removeLayer(stateLayer);
                }
                //If the click wasn't inside a state then we're done.
                if( !containingState ) {
                    return;
                } else {
                    //User clicked inside a state. Setup the aggregations we need to calculate for this state.
                    //Aggregations are performed against ALL data (not just the displayed year).
                    var aggregations = [
                        {
                            //Count all points (total tornadoes) within this state
                            aggregation: 'count',
                            inField: '',
                            outField: 'point_count'
                        },
                        {
                            //Summation of fatalities
                            aggregation: 'sum',
                            inField: 'ftl',
                            outField: 'fatalities'
                        },
                        {
                            //Summation of injuries
                            aggregation: 'sum',
                            inField: 'inj',
                            outField: 'injuries'
                        },
                        {
                            //Find the largest number of fatalities in a single tornado
                            aggregation: 'max',
                            inField: 'ftl',
                            outField: 'max_fatalities'
                        },
                        {
                            //Find the largest number of injuries in a single tornado
                            aggregation: 'max',
                            inField: 'inj',
                            outField: 'max_injuries'
                        }
                    ];
                    var tornadoes = tornadoLayer.getGeoJSON();
                    var tornadoPoints = [];
                    //Since Turf's aggregation features only work on a set of Points we need to
                    //simplify our data from PolyLines to Points. For any PolyLine just take the first
                    //point on the line for simplicity since it's relatively rare for a tornado to
                    //cross state lines
                    for( var k = 0; k < tornadoes.features.length; k++ ) {
                        var item = tornadoes.features[k];

                        if( item.geometry.type === 'Point' ) {
                            var point = item.geometry.coordinates;
                            tornadoPoints.push(turf.point(point, item.properties))
                        } else {
                            for( var l = 0; l < item.geometry.coordinates.length; l++ ) {
                                var firstPoint = item.geometry.coordinates[l];
                                tornadoPoints.push(turf.point(firstPoint, item.properties))
                            }
                        }
                    }
                    var stateFeatureCollection = {
                        "type": "FeatureCollection",
                        "features": [containingState]
                    };
                    var tornadoPointsFeatureCollection = {
                        "type": "FeatureCollection",
                        "features": tornadoPoints
                    };
                    //Run the aggregation calculations
                    var result = turf.aggregate(stateFeatureCollection, tornadoPointsFeatureCollection, aggregations);

                    //Use Turf to calculate the square miles of a state
                    var stateAreaInMeters = turf.area(stateFeatureCollection);
                    //Divide calculated value by m^2 / mi ^2
                    var stateAreaInMiles = (stateAreaInMeters / 2589990).toFixed(2);

                    //Build a new layer to highlight the selected state and build a tooltip to display
                    //the aggregated values we just calculated.
                    stateLayer = L.mapbox.featureLayer(result.features).addTo(map);
                    stateLayer.eachLayer(function(layer) {

                        var content = '<h2>'+layer.feature.properties['NAME']+'</h2>' +
                            '<p>Square Miles: '+stateAreaInMiles+'<br/>' +
                            'Total Tornado Reports: '+layer.feature.properties['point_count']+'<br/>' +
                            'Tornado Reports per 1000 mi^2: '+(parseInt(layer.feature.properties['point_count']) * 1000 / stateAreaInMiles).toFixed(2) + '<br/>' +
                            'Total Fatalities: '+layer.feature.properties['fatalities']+'<br/>' +
                            'Total Injuries: '+layer.feature.properties['injuries']+'<br/>' +
                            'Maximum Injuries: '+layer.feature.properties['max_fatalities']+'<br/>' +
                            'Maximum Injuries: '+layer.feature.properties['max_injuries']+'</p>';
                        layer.bindPopup(content);
                    });
                }
            });
        }
    };
