document.addEventListener('DOMContentLoaded', function () {

    var mapInitialized = false;
    var map; 
    var markersAdded = false; // Flag to track whether markers have been added

    // Initialize date range picker
    var dateRangePicker = flatpickr("#date-range-picker", {
        mode: "range"
    });
    // Setting the Map view to Calgary
    map = L.map('map').setView([51.0447, -114.0719], 10.5);

    

    L.tileLayer('https://api.mapbox.com/styles/v1/juliancramb/cltnnyzty01ao01ptfh5gdmjs/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianVsaWFuY3JhbWIiLCJhIjoiY2x0bmF0azdsMDU2cTJqbnducHFqeTRoeSJ9.aJG8OsIR1dszOe3A-ZvVkQ', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
    }).addTo(map);


    // const proxyUrl = 'https://corsproxy.io/?'; 
    const mapboxUrl = 'https://api.mapbox.com/styles/v1/juliancramb/cltnc0k33019b01oi2tmy5ov0/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianVsaWFuY3JhbWIiLCJhIjoiY2x0bmF0azdsMDU2cTJqbnducHFqeTRoeSJ9.aJG8OsIR1dszOe3A-ZvVkQ';
    
    let mapboxLayerAdded = false;
    let mapboxLayer; // Declare mapboxLayer outside the event listener

    // mapbox://styles/juliancramb/cltnnyzty01ao01ptfh5gdmjs
    const mapboxLayerToggle = document.getElementById('mapbox-layer-toggle');
    mapboxLayerToggle.addEventListener('change', function() {
        if (this.checked && !mapboxLayerAdded) { 
            mapboxLayer = L.tileLayer(mapboxUrl, { // Create the layer
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
            });
            map.addLayer(mapboxLayer);
            mapboxLayerAdded = true; 
        } else if (!this.checked && mapboxLayerAdded) { 
            map.removeLayer(mapboxLayer); // Remove the existing layer
            mapboxLayerAdded = false; 
        }
    });

    // console.log("Final Mapbox Layer URL: " + proxyUrl + mapboxUrl);


    function initializeMap() {
        return new Promise((resolve, reject) => {
            if (!mapInitialized) { // Initialize only if not done before
                mapInitialized = true; // Set the flag
                resolve(map);
            } else {
                console.warn("Map already initialized, skipping...");
                resolve(map); // Resolve with the existing map object 
            }
        });
    }

        // Search button event handler
        document.getElementById('searchButton').addEventListener('click', function () {
            const dates = dateRangePicker.selectedDates;
            if (dates.length !== 2) {
                console.error("Please select a valid date range");
                return;
            }
    
            const startDate = dates[0].toISOString().split('T')[0];
            const endDate = dates[1].toISOString().split('T')[0];
    
            const apiUrl = 'https://data.calgary.ca/resource/c2es-76ed.geojson?' +
                `$where=issueddate >= '${startDate}' AND issueddate <= '${endDate}'`;
    
            // Clear old markers and refetch data with new dates
            clearMap();
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(newData => initializeMap()  // Wait for map initialization
                    .then(map => processBuildingPermits(newData, map))
                )
                .catch(error => {
                    console.error('Error fetching data or initializing map:', error);
                });
        });
    
        function clearMap() {
            if (map) {
                map.eachLayer(layer => {
                    if (layer instanceof L.MarkerClusterGroup || layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });
                markersAdded = false; // Reset the flag when clearing the map
            }
        }
    
        function processBuildingPermits(geojsonData, map) {
            console.log("Map Object:", map); // Log the 'map' object 
            console.log("GeoJSON Data:", geojsonData); // Log the GeoJSON data
    
            // Initialize the cluster group
            var markers = L.markerClusterGroup();
    
            // Initialize the spiderfier 
            var oms = new OverlappingMarkerSpiderfier(map);
    
            // Add new markers from geojsonData  
            geojsonData.features.forEach(feature => {
                const lat = feature.geometry.coordinates[1];
                const lng = feature.geometry.coordinates[0];
                const popupContent = createPermitPopup(feature);
                console.log("Latitude:", lat);
                console.log("Longitude:", lng);
    
                const marker = L.marker([lat, lng]);
                console.log("Marker:", marker);
    
                marker.bindPopup(popupContent);
    
                // Add to both cluster group and spiderfier
                markers.addLayer(marker);
                oms.addMarker(marker);
            });
    
            // Add cluster group to the map only if markers haven't been added yet
            if (!markersAdded) {
                map.addLayer(markers);
                markersAdded = true; // Set the flag to true after adding markers
            }
        }
    
        function createPermitPopup(feature) {
            const properties = feature.properties;
            return `
                <div>
                    <b>Issued Date:</b> ${properties.issueddate}<br>
                    <b>Work Class Group:</b> ${properties.workclassgroup}<br>
                    <b>Contractor Name:</b> ${properties.contractorname}<br>
                    <b>Community Name:</b> ${properties.communityname}<br>
                    <b>Original Address:</b> ${properties.originaladdress}
                </div>
            `;
        }
});
