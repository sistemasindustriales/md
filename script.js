// Variables globales
let map;
let busMarkers = {};
let updateInterval;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadBuses();
    setupEventListeners();
    
    // Actualizar cada 10 segundos
    updateInterval = setInterval(loadBuses, 10000);
});

// Inicializar el mapa
function initMap() {
    map = L.map('map').setView([-42.767510, -65.037263], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(map);
    
    // Añadir leyenda
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background-color: #34A853;"></span>
                <span>En circulación</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background-color: #EA4335;"></span>
                <span>Desconectado</span>
            </div>
        `;
        return div;
    };
    legend.addTo(map);
}

// Configurar event listeners
// Configurar event listeners
function setupEventListeners() {
    // Búsqueda de colectivos
    document.getElementById('searchBus').addEventListener('input', function(e) {
        let searchTerm = e.target.value.toLowerCase().trim();

        // Normalizar el término de búsqueda (ignorar "línea")
        searchTerm = searchTerm.replace(/^línea\s*/i, '').trim();

        const buses = document.querySelectorAll('.bus-card');

        buses.forEach(bus => {
            const titleElement = bus.querySelector('.card-title');
            if (!titleElement) return;

            // Obtener el texto del título y limpiar la palabra "línea"
            let busTitle = titleElement.textContent.toLowerCase().trim();
            busTitle = busTitle.replace(/^línea\s*/i, '').trim();

            // Mostrar si coincide con la búsqueda (en cualquier parte del texto)
            if (busTitle.includes(searchTerm)) {
                bus.style.display = 'block';
            } else {
                bus.style.display = 'none';
            }
        });
    });

    // Localizar usuario
    document.getElementById('locateMe').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                map.setView([position.coords.latitude, position.coords.longitude], 15);
                L.marker([position.coords.latitude, position.coords.longitude])
                    .addTo(map)
                    .bindPopup('Su ubicación actual')
                    .openPopup();
            });
        } else {
            alert('La geolocalización no es compatible con este navegador.');
        }
    });

    // Actualizar mapa
    document.getElementById('refreshMap').addEventListener('click', function() {
        loadBuses();
    });

    // Formularios
    document.getElementById('addBusForm').addEventListener('submit', handleAddBus);
    document.getElementById('addDriverForm').addEventListener('submit', handleAddDriver);
    document.getElementById('assignDriverForm').addEventListener('submit', handleAssignDriver);
}

    
    // Localizar usuario
    document.getElementById('locateMe').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                map.setView([position.coords.latitude, position.coords.longitude], 15);
                L.marker([position.coords.latitude, position.coords.longitude])
                    .addTo(map)
                    .bindPopup('Su ubicación actual')
                    .openPopup();
            });
        } else {
            alert('La geolocalización no es compatible con este navegador.');
        }
    });
    
    // Actualizar mapa
    document.getElementById('refreshMap').addEventListener('click', function() {
        loadBuses();
    });
    
    // Formularios
    document.getElementById('addBusForm').addEventListener('submit', handleAddBus);
    document.getElementById('addDriverForm').addEventListener('submit', handleAddDriver);
    document.getElementById('assignDriverForm').addEventListener('submit', handleAssignDriver);
}

// Cargar lista de colectivos
function loadBuses() {
    fetch('api/get_buses.php')
        .then(response => response.json())
        .then(data => {
            updateBusList(data.buses);
            updateMapMarkers(data.buses);
            updateStats(data.buses);
        })
        .catch(error => console.error('Error:', error));
}

// Actualizar lista de colectivos
function updateBusList(buses) {
    const busList = document.getElementById('busList');
    busList.innerHTML = '';
    
    buses.forEach(bus => {
        const status = bus.gps_enabled ? 'Activo' : 'Inactivo';
        const statusClass = bus.gps_enabled ? 'bg-success' : 'bg-warning';
        const speed = bus.speed ? `${bus.speed} km/h` : '0 km/h';
        
        const busCard = document.createElement('div');
        busCard.className = 'card bus-card';
        busCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <h5 class="card-title">Línea ${bus.line_number}</h5>
                    <span class="badge ${statusClass}">${status}</span>
                </div>
                <p hide class="hide card-text mb-1">Colectivo: ${bus.license_plate}</p>
                <p hide class="hide card-text mb-1">Conductor: ${bus.driver_name || 'No asignado'}</p>
                <p hide class="hide card-text mb-2">Velocidad: ${speed}</p>
                <div class="d-flex gap-2">

                    <a href="https://madrynapps.com/ceferino/${bus.line_number}.php" 
                       class="btn btn-sm btn-outline-primary d-flex align-items-center" >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock me-1" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                        </svg> Horarios</a>
                </div>
            </div>
        `;
        
        busList.appendChild(busCard);
    });
}

// Actualizar marcadores en el mapa
function updateMapMarkers(buses) {
    // Limpiar marcadores antiguos
    for (const id in busMarkers) {
        map.removeLayer(busMarkers[id]);
    }
    busMarkers = {};
    
    // Añadir nuevos marcadores
    buses.forEach(bus => {
        if (bus.latitude && bus.longitude) {
            const markerColor = bus.gps_enabled ? '#34A853' : '#EA4335';
            
            const busIcon = L.divIcon({
                className: 'bus-marker',
                html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
                iconSize: [26, 26]
            });
            
            const marker = L.marker([bus.latitude, bus.longitude], {icon: busIcon}).addTo(map);
            marker.bindPopup(`
                <b>Línea ${bus.line_number}</b><br>
                <b>Última actualización: ${bus.last_update || 'N/A'}</b>
            `);
            
            busMarkers[bus.id] = marker;
        }
    });
}

// Actualizar estadísticas
function updateStats(buses) {
    const totalBuses = buses.length;
    const activeBuses = buses.filter(bus => bus.gps_enabled).length;
    
    document.getElementById('totalBuses').textContent = totalBuses;
    document.getElementById('activeDrivers').textContent = activeBuses;
}

// Enfocar en un colectivo específico
function focusOnBus(busId) {
    if (busMarkers[busId]) {
        map.setView(busMarkers[busId].getLatLng(), 15);
        busMarkers[busId].openPopup();
    }
}

// Manejar envío de formulario para agregar colectivo
function handleAddBus(e) {
    e.preventDefault();
    
    const formData = {
        line_number: document.getElementById('lineNumber').value,
        license_plate: document.getElementById('licensePlate').value,
        model: document.getElementById('model').value,
        capacity: document.getElementById('capacity').value
    };
    
    fetch('api/add_bus.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes('correctamente')) {
            document.getElementById('addBusForm').reset();
            loadBuses(); // Recargar la lista
        }
    })
    .catch(error => console.error('Error:', error));
}

// Manejar envío de formulario para agregar conductor
function handleAddDriver(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('driverName').value,
        phone: document.getElementById('driverPhone').value,
        email: document.getElementById('driverEmail').value,
        license_number: document.getElementById('licenseNumber').value
    };
    
    fetch('api/add_driver.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes('correctamente')) {
            document.getElementById('addDriverForm').reset();
            // Recargar la página para actualizar los selectores
            location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
}

// Manejar envío de formulario para asignar conductor
function handleAssignDriver(e) {
    e.preventDefault();
    
    const formData = {
        bus_id: document.getElementById('selectBus').value,
        driver_id: document.getElementById('selectDriver').value
    };
    
    fetch('api/assign_driver.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes('correctamente')) {
            document.getElementById('assignDriverForm').reset();
            loadBuses(); // Recargar la lista de buses
        }
    })
    .catch(error => console.error('Error:', error));
}