document.addEventListener('DOMContentLoaded', function () {

    var mapInitialized = false; // Flag outside the function
    var map; // Declare map outside the function to make it accessible

    function initializeMap() {
        return new Promise((resolve, reject) => {
            if (!mapInitialized) { // Initialize only if not done before
                map = L.map('map').setView([51.0447, -114.0719], 11);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                mapInitialized = true; // Set the flag
                resolve(map);
            } else {
                console.warn("Map already initialized, skipping...");
                resolve(map); // Resolve with the existing map object (adjust if needed)
            }
        });
    }

    var oms;

    // Initialize date range picker
    var dateRangePicker = flatpickr("#date-range-picker", {
        mode: "range"
    });

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
        }
    }

    function processBuildingPermits(geojsonData, map) {
        console.log("Map Object:", map); // Log the 'map' object 
        console.log("GeoJSON Data:", geojsonData); // Log the GeoJSON data

        // Initialize the cluster group
        var markers = L.markerClusterGroup();

        // Initialize the spiderfier 
        oms = new OverlappingMarkerSpiderfier(map);

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

        // Add cluster group to the map
        map.addLayer(markers);
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