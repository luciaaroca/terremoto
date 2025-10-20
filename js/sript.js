
///-------------------MAPA 1----------------------
//1) Pintamos el mapa
let map = L.map('map').setView([20, 0], 2);
var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
}).addTo(map);

//2)Obtenemos la info de la api
async function getData(){
    try{
        const res = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"); //API
        const data = await res.json();
        return data.features;
    }
    catch(e){
        console.log(e);
    }
}

//3)Función
getData().then(data => {
    
    console.log(data);//ver el array en consola
    //Agregar marcador

    data.forEach(terremoto => {
        //Guardar la latitud[1] y longitud[0] (la sacamos del array de la api)
        const coordenadas = [terremoto.geometry.coordinates[1], terremoto.geometry.coordinates[0]]; 

        //Constante para guardar la fecha
        const fecha = new Date(terremoto.properties.time);
        const fechaFormateada = fecha.toLocaleString();

        //Constante para guardar las magnitudes
        const magnitud = terremoto.properties.mag;

       //Función para asignar color segun maginitud
        function obtenerIcono(mag) {
        let color = 'green'; // magnitud baja
        if (mag >= 3 && mag < 5) color = 'yellow'; 
        else if (mag >= 5 && mag < 7) color = 'orange'; 
        else if (mag >=7) color = 'red';
  
        return L.icon({ //asi cambiamos el color del icono (luego lo ponemos abajo al marcador)
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
     }//cerramos función obtenericono


      //marcador
        const marker = L.marker(coordenadas,  { icon: obtenerIcono(terremoto.properties.mag) }) //creamos el marcador
            .bindPopup(`${terremoto.properties.title}<br>
                ${fechaFormateada}<br>
                ${terremoto.properties.place}
                <br>${terremoto.properties.code}
                <br>${magnitud}
                <br><a href="${terremoto.properties.url}">Más información</a><br>
                <button class='add'>Añadir terremoto a tu lista</button>`)
            .addTo(map);

        marker.on('popupopen', () => {//si se a abierto el maarcador
            const botonAdd = document.querySelector('.add'); //selecciona el botón
            if (botonAdd) { //si si
                botonAdd.addEventListener('click', () => { //si pulsa el botón de añadir ---sale una alerta 
                    Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "El terremoto ha sido añadido a tu lista",
                    showConfirmButton: false,
                    timer: 1500
                    });;
                });
            }
        });
    });

});//cerramos función






//-----------------------MAPA 2-----------------

//1) Pintamos el mapa ✔
let map2 = L.map('map2').setView([20, 0], 2);
var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
}).addTo(map2);



const botonBuscar = document.getElementById("botonBuscar");
const info = document.getElementById("info");

let markers = [];

// Función para limpiar marcadores anteriores
function clearMarkers() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
}


botonBuscar.addEventListener("click",async ()=>{
    const magMin = document.getElementById("minMag").value;
    const magMax = document.getElementById("maxMag").value;
    const magStart = document.getElementById("starttime").value;
    const magEnd = document.getElementById("endtime").value;

    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`; //filtros dinámicos
    if (magStart) url += `&starttime=${magStart}`;
    if (magEnd) url += `&minmagnitude=${magEnd}`;
    if (magMax) url += `&maxmagnitude=${magMax}`;
    if (magMin) url += `&minmagnitude=${magMin}`;
   
    console.log(url);//para ver
    info.innerText = "Cargando datos...";
    clearMarkers();

    try {
        const respuesta = await fetch(url);
        const data = await respuesta.json();
        
        console.log (data)

        const terremotos = data.features;

        if (!terremotos || terremotos.length === 0) {
        info.innerText = "No se encontraron terremotos con esos filtros.";
        return;
        }

        info.innerText = `Se encontraron ${terremotos.length} terremotos.`;


        //añadir al mapa
        terremotos.forEach((t)=>{
            const coordenadas = [t.geometry.coordinates[1], t.geometry.coordinates[0]]; 
            const mag = t.properties.mag;
            const lugar = t.properties.place;
            const fecha = new Date(t.properties.time).toLocaleString();
            
            const marker = L.marker(coordenadas,) //creamos el marcador
                .bindPopup(`${t.properties.title}<br>
                    ${fecha}<br>
                    ${lugar}
                    <br>${mag}
                    `)
                .addTo(map2);
            
            markers.push(marker);
    
    })

    }catch(error){
        info.innerText = `Error al obtener datos: ${error.message}`;
}
})















