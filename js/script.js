 const firebaseConfig = {
    apiKey: "AIzaSyBTLcUzPjMWysHsfBc_X6dyp3aI58zjcMw",
    authDomain: "fir-web-37d16.firebaseapp.com",
    projectId: "fir-web-37d16",
    storageBucket: "fir-web-37d16.firebasestorage.app",
    messagingSenderId: "329997623369",
    appId: "1:329997623369:web:ac01341aee00c2ab7e5f98"
  }; //datos de conexión -> nuestro objeto de conexión


firebase.initializeApp(firebaseConfig);// Inicializaar app Firebase

const db = firebase.firestore();//(db) objeto que representa mi base de datos - BBDD //inicia Firestore





///-------------------MAPA 1----------------------
//1) Pintamos el mapa
// let map = L.map('map').setView([20, 0], 2);
// var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
// 	minZoom: 0,
// 	maxZoom: 20,
// 	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// 	ext: 'png'
// }).addTo(map);

var map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

//*****PARA FAVORITOS***
let todosLosMarcadores = [];   // ?????Array con todos los marcadores normales LO USAREMOS EN FAVORITOS
let favoritosMarcadores = [];  // ???????Array con los de favoritos LO USAREMOS EN FAVORITOS



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

        todosLosMarcadores.push(marker);

        marker.on('popupopen', () => {//si se a abierto el maarcador
            const botonAdd = document.querySelector('.add'); //selecciona el botón
            if (botonAdd) { //si si
                botonAdd.addEventListener('click', () => { //si pulsa el botón de añadir ---sale una alerta 
                 
                    //..FAVORITOS........(esto se ha hecho después)-->hacemos una función para cuando se pulse botonAdd
                    const addToFavorites = (terremoto) => {
                        const user = firebase.auth().currentUser;
                      
                        if (!user) {
                          alert('Debes estar logueado para añadir a favoritos.');
                          return;
                        }
                      
                        const userRef = db.collection("usuariosTerr").doc(user.uid); //Referencia al documento del usuario actual dentro de la colección "usuariosTerr"
                      
                        userRef.get()//obetener datos 
                          .then((doc) => {//promesa cumplida(get) -->pasas una función que recibe info doc
                            if (doc.exists) {
                              const favorites = doc.data().favorites || [];//nos devuelve los favoritos dentro del docDta de usuariosTerr
                              const updatedFavorites = [...favorites, terremoto]; // Añadir el nuevo terremoto al array  favoritos
                      
                              userRef.update({ favorites: updatedFavorites }) //update. actualiza campos especificados del doc (favorites).
                                .then(() => {
                                  // alert('Terremoto añadido a tu lista.');
                                  Swal.fire({
                                  position: "center",
                                  icon: "success",
                                  title: "El terremoto ha sido añadido a tu lista",
                                  showConfirmButton: false,
                                  timer: 1500
                                  });;
                                });
                            } else {
                              console.log('No se encontró el usuario.');
                            }
                          })
                          .catch((error) => {
                            console.error('Error añadiendo a tu lista: ', error);
                          });
                          // alert('Terremoto añadido a tu lista');
                      };//cierre addToFavorites
                      addToFavorites(terremoto);
                    //..............
                });//cierre addEventlistener de botonAdd
            }
        });
    });

});//cerramos función

//----------------------------------------------

//--------------------FAVORITOS(ver tu lista de terremotos)----------------
//1) función para limpiar mapa_____
function limpiarMapa() {
  todosLosMarcadores.forEach(m => map.removeLayer(m));//quita todos los marcadores
  favoritosMarcadores.forEach(m => map.removeLayer(m));//quita todos los marcadores
}
//2)función para ver los terremotos favoritos----------
const verFavoritos = () => {
    const user = firebase.auth().currentUser;
                      
    if (!user) {
    alert('ERROR: Debes haber iniciado sesión para poder tener tu lista de terremotos.');
    return;
    }

    limpiarMapa();
    
    const userRef = db.collection("usuariosTerr").doc(user.uid);   

    userRef.get()//obetener datos 
        .then((doc) => {//promesa cumplida(get) -->pasas una función que recibe info doc
        if (!doc.exists) {
          alert("No tienes favoritos guardados")
          return
          } 
          
          const favoritos = doc.data().favorites || [];//cogemos los favoritos de firebase
          
          
          favoritosMarcadores = favoritos.map(terremoto=>{
              //volvemos a capturar los datos
              const coordenadas = [terremoto.geometry.coordinates[1], terremoto.geometry.coordinates[0]]; 

              const fecha = new Date(terremoto.properties.time);
              const fechaFormateada = fecha.toLocaleString();

              const magnitud = terremoto.properties.mag;

              //volvemos a pintar los marcadores
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
                }

                const marker = L.marker(coordenadas,  { icon: obtenerIcono(terremoto.properties.mag) }) //creamos el marcador
                  .bindPopup(`${terremoto.properties.title}<br>
                      ${fechaFormateada}<br>
                      ${terremoto.properties.place}
                      <br>${terremoto.properties.code}
                      <br>${magnitud}
                      <br><a href="${terremoto.properties.url}">Más información</a><br>
                      <button class='delete'>Borrar terremoto de tu lista</button>`)
                  .addTo(map);

                
                 marker.on('popupopen', () => {
                 //aqui introducimos el addeventlistener de ----BORRAR FAV----
                   const botonDelete = document.querySelector('.delete'); //selecciona el botón
                   if (botonDelete) { //si si
                   botonDelete.addEventListener('click', () => {
                    borrarFavoritos(terremoto.id);//llamamos a la función borrar
                    map.removeLayer(marker); //eliminamos el marker del mapa
                   })
                   }
                 })//cierre marker.on
                      
                 return marker

          })       
        })//cierre then
        .catch((error)=>{
            console.error('Error añadiendo a tu lista: ', error);
        })
  }//cierre verFavoritos

//3)función para ver todos los terremotos----------
function verTodos() {
  limpiarMapa();
  todosLosMarcadores.forEach(m => m.addTo(map));
}

//4)Botones de ver favoritos y ver todos (click html)----------
document.getElementById('verAdd').addEventListener('click',verFavoritos);
document.getElementById('verTodos').addEventListener('click', verTodos);

//-----------------------------------------------------------------------


//-------BOTÓN BORRAR--------
 const borrarFavoritos = (terremotoId) => { //hay que pasarle un parámetro a esta función (ya que el usuario es lo que nos pasará)
 const user = firebase.auth().currentUser;
                      
    if (!user) {
    alert('ERROR: Debes haber iniciado sesión para poder eliminar terremotos de tu lista.');
    return;
    }

    const userRef = db.collection("usuariosTerr").doc(user.uid);  
     userRef.get()//obetener datos 
        .then((doc) => {//promesa cumplida(get) -->pasas una función que recibe info doc
        if (doc.exists) {
        const favorites = doc.data().favorites || [];//busca la clave favorites(queremos ese array)
        const updatedFavorites = favorites.filter(fav => fav.id !== terremotoId); //sirve para dejar los que no se hayan seleccionado
         
         return userRef.update({ favorites: updatedFavorites }) //llamamos al metodo de firestore para hacer update sobre ese usuario
      }else{
         console.log('No se encontró el usuario.');
      }
       }).then(() => {
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Terremoto eliminado de tu lista",
        showConfirmButton: false,
        timer: 1500
      });
      // verFavoritos(); // recarga la vista
    })
      .catch((error) => {
      console.error('Error eliminando de favoritos: ', error);
    });

};//cierre borrarFavoritos----->llamamos a esta función en el marker.on de verFavoritos(igual que cuando tuvimos que hacer favoritos lo añadimos al marker.on de creación del mapa(1º))
//------------------





//-----------------------MAPA 2-----------------

//1) Pintamos el mapa ✔
// let map2 = L.map('map2').setView([20, 0], 2);
// var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
// 	minZoom: 0,
// 	maxZoom: 20,
// 	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// 	ext: 'png'
// }).addTo(map2);

var map2 = L.map('map2').setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

    
   ///AQUI CREO QUE PODRIA METER UN GIFT
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
        console.log( `Error al obtener datos: ${error.message}`);
}
})
//----------------------------------------------










//Sobre MAPA1
//---------------------CREACIÓN DE usuariosTERR-------------------------
const createUser = (user) => { //->luego lo utilizaremos en sign up
  db.collection("usuariosTerr") //CREAMOS COLECCIÓN: usuariosTerr---->de cada usuario voy a almacenar: id, email y fav.
    .doc(user.id) // Usar el UID del usuario como ID del documento en Firestore
    .set({//guarda email
      email: user.email,
      favorites: [] // Crear array de favoritos vacío del usuario
    })
    .then(() => console.log("Usuario creado con ID: ", user.id))
    .catch((error) => console.error("Error creando usuario: ", error));
};
//----------------------------------------------

/******************************************************************************/ 

//---------------------AUTENTICIDAD(Sign up -> registro)-------------------------

//1)Creamos la función (lo que nos dice la docFirebase + creando un usuario(por nuestra cuenta))

const signUpUser = (email, password) => {
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password) //pasamos los textos que necesitamos para crear usuario
    .then((userCredential) => {
      // Signed in
      let user = userCredential.user;
      console.log(`se ha registrado ${user.email} ID:${user.uid}`)//para que tu por consola sepas que esta bien
      Swal.fire(`Se ha registrado ${user.email}`);

      // Saves user in firestore 
      createUser({//hay una función que crea usuario ->queremos que tenga id y email
        id: user.uid, //uid es el nombre FIJO del id
        email: user.email
      });

    })
    .catch((error) => {
      console.log("Error en el sistema" + error.message, "Error: " + error.code);
    });
};//cierre signUpUser

//2) LLamamos a la función con el botón del form1

document.getElementById("form1").addEventListener("submit", function (event) {
  event.preventDefault();
  let email = event.target.elements.email.value;
  let pass = event.target.elements.pass.value;
  let pass2 = event.target.elements.pass2.value;
//event.target.elemets(event=evento submit /target =htm form /elements=controles del formulario )

//   console.log(pass)
//   console.log(email)

  //--- regex ----
   const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
   if (!passwordRegex.test(pass)) {
    alert("La contraseña debe tener al menos 6 caracteres, una mayúscula y un número.");
    return;
  }
  if (pass !== pass2) {
    alert("Las contraseñas no coinciden.");
    return;
  }
  signUpUser(email, pass);
  //pass === pass2 && pass.length>= 6 ? signUpUser(email, pass) : alert("La contraseña tiene que tener más de 6 dígitos/letras"); //condición ? expresiónSiVerdadero : expresiónSiFalso;

  document.getElementById("form1").reset()//reset formulario
  document.getElementById("logup").remove()//se elimina el formulario de la pantalla al darle a enviar
})//cierre addEventListener form1

//----------------------------------------------

//---------------------AUTENTICIDAD(Sign in -> iniciar sesion)-------------------------
//1)Creamos función sign in (dada por firebase, solo hemos personalizado alertas )
const signInUser = (email, password) => {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      let user = userCredential.user;
      console.log(`se ha logado ${user.email} ID:${user.uid}`)
      document.getElementById("message").innerText = `Está en el sistema: ${user.email}`//????????
    //   alert(`se ha logado ${user.email} ID:${user.uid}`)
     Swal.fire(`El usuario: ${user.email} ha iniciado sesión`);
      console.log("USER", user);
    })
    .catch((error) => {
      let errorCode = error.code;
      let errorMessage = error.message;
      console.log(errorCode)
      console.log(errorMessage)
      Swal.fire(`ERROR: Antes debes registrate!`);
    });
}//cierre signUser

//2)LLamamos a la función con el botón del form2
document.getElementById("form2").addEventListener("submit", function(event) {
event.preventDefault();
  let email= event.target.elements.email2.value;
  let pass=event.target.elements.pass3.value;
  signInUser(email, pass)//verificamos que tienen que estar previamente registrados
//   console.log(email2)
//   console.log(pass3)
  document.getElementById("form2").reset()//reset formulario
   document.getElementById("login").remove()
})//cierre addEventListener form2

//----------------------------------------------

//---------------------AUTENTICIDAD(Sign out -> cerrar sesión)-------------------------
//1)funcion 
const signOut = () => {
  let user = firebase.auth().currentUser;

  firebase.auth().signOut().then(() => {
    console.log("Sale del sistema: " + user.email)
  }).catch((error) => {
    console.log("hubo un error: " + error);
  });
}//cierre signOut

//2)LLamamos a la función al puslar el botón

document.getElementById("salir").addEventListener("click",()=>{
  signOut(); //cerrar sesión
  document.getElementById("message").innerText = `No hay usuarios en el sistema` //mensaje de info
})

//----------------------------------------------
