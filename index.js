const get_course_ingr = async (id) => {
    const response_1 = await fetch(`https://tarea-1.2023-1.tallerdeintegracion.cl/ingredients/${id}`)
    const ingredient = await response_1.json()
    if (ingredient.id){
        return ingredient
    }
    const response_2 = await fetch(`https://tarea-1.2023-1.tallerdeintegracion.cl/courses/${id}`)
    const course = await response_2.json()
    return course
}

var page = 1
var sort = "name"
var order = "asc"
const get_ingredients = async () => {
    const response = await fetch(`https://tarea-1.2023-1.tallerdeintegracion.cl/ingredients?page=${page}&size=50&sort=${sort}&order=${order}`)
    const api_ingredients = await response.json()
    return api_ingredients
}

const get_courses = async () => {
    const response = await fetch(`https://tarea-1.2023-1.tallerdeintegracion.cl/courses?page=${page}&size=50&sort=${sort}&order=${order}`)
    const api_courses = await response.json()
    return api_courses
}

const render_dishes = async () => {
    const select = document.getElementById("Dish");
    const courses = await get_courses()
    select.innerHTML += `<option value="Platos" disabled>Platos</option>`
    for (let course of courses.items){
        select.innerHTML  +=`<option value="${course.id}" >${course.name}</option>`
    }
    select.innerHTML += `<option value="Ingredientes" disabled>Ingredientes</option>`
    const ingredients = await get_ingredients()
    for (let ingredient of ingredients.items){
        select.innerHTML  += `<option value="${ingredient.id}" >${ingredient.name}</option>`
    }
}

render_dishes()

const time = (timestamp)=>{
    const date = new Date(timestamp);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`
}
var motoIcon = L.icon({
    iconUrl: 'moto.png',
    iconSize:     [20, 20], // size of the icon
});
var houseIcon = L.icon({
    iconUrl: 'house.png',
    iconSize:     [20, 20], // size of the icon
});
var restaurantIcon = L.icon({
    iconUrl: 'restaurant.png',
    iconSize:     [20, 20], // size of the icon
});

var restaurants = {}
var destinations = {}
var deliveries = {}
var positions = {}
var users = {}
var map = L.map('mapContainer').setView([-33.42742, -70.60366], 11);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {foo: 'bar'}).addTo(map);

let url = "wss://tarea2-2023-1-dev-z2fqxmm2ja-uc.a.run.app/connect"
const token = btoa("jaime.coloma@uc.cl:18639453")
const websocket = new WebSocket(url);
payload = {
    "type": "JOIN",
    "payload": {
        "authorization": `Basic ${token}`
    }
}
websocket.onopen = () => websocket.send(JSON.stringify(payload));
websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    if (event.type == 'RESTAURANTS') {
        const select = document.getElementById("Restaurant");
        if (select.value != "Restaurante"){
            select.innerHTML=`<select  id="Restaurant">
            <option value="${select.value}" >${select.selectedOptions[0].textContent}</option>
            </select>`
        } else {
            select.innerHTML=`<select  id="Restaurant">
            <option value="Restaurante" disabled selected>Restaurante</option>
            </select>`
        }
        Object.values(restaurants).forEach(r => {
            map.removeLayer(r.marker)
        })
        restaurants = event.payload.reduce((acc, r) => {
            acc[r.id] = r
            return acc
        }
        , {})
        Object.values(restaurants).forEach(r => {
                var marker = L.marker([r.position.lat, r.position.long], {icon: restaurantIcon})
                let str = `<b>${r.name}</b><br>ID: ${r.id}<br>lat: ${r.position.lat}, long: ${r.position.long}`
                marker.bindTooltip(str);
                marker.addTo(map);
                r.marker = marker;
                const select = document.getElementById("Restaurant");
                const option = document.createElement("option");
                option.text = r.name;
                option.value = r.id;
                select.appendChild(option);
        });
    } else if (event.type == 'DESTINATIONS') {
        const select = document.getElementById("Destination");
        if (select.value != "Destino"){
            select.innerHTML=`<select  id="Destination">
            <option value="${select.value}" >${select.selectedOptions[0].textContent}</option>
          </select>`
        } else {
            select.innerHTML=`<select  id="Destination">
            <option value="Destino" disabled selected>Destino</option>
            </select>`
        }
        Object.values(destinations).forEach(d => {
            map.removeLayer(d.marker)
        })
        destinations = event.payload.reduce((acc, d) => {
            acc[d.id] = d
            return acc
        }
        , {})
        Object.values(destinations).forEach(d => {
            var marker = L.marker([d.position.lat, d.position.long], {icon: houseIcon})
            let str = `<b>${d.name}</b><br>ID: ${d.id}<br>lat: ${d.position.lat}, long: ${d.position.long}`
            marker.bindTooltip(str);
            marker.addTo(map);
            d.marker = marker;
            const select = document.getElementById("Destination");
            const option = document.createElement("option");
            option.text = d.name;
            option.value = d.id;
            select.appendChild(option);
        });
    } else if (event.type == 'USERS') {
        users = event.payload.reduce((acc, u) => {
            acc[u.id] = u
            return acc
        }
        , {})
    } else if (event.type == 'DELIVERIES') {
        Object.values(deliveries).forEach(d => {
            if (d.polyline != null){
            map.removeLayer(d.polyline)
            }
        })
        deliveries = event.payload.reduce((acc, d) => {
            acc[d.id] = d
            return acc
        }
        , {})
        var color_index = 0
        Object.values(deliveries).forEach(async d => {
            deliveries[d.id] = d
            var checker = false
            // creamos un polyline para la ruta
            var latlngs = [[restaurants[d.restaurant_id]?.position.lat, restaurants[d.restaurant_id]?.position.long],
                            [destinations[d.destination_id]?.position.lat, destinations[d.destination_id]?.position.long]];
            latlngs.forEach(l => {
                if (l[0] == null || l[1] == null){
                    checker = false
                } else{
                    checker = true
                } 
                })
                if (checker == true){// guardar color en dict de deliveries
                    colors = ["#9A77CF", "#543884", "#262254", "#A13670", "#EC4176", "#FFA45E", "green", "yellow", "blue", "red"]
                    //const course_ingr = await get_course_ingr(d.product_id)
                    //d.object = course_ingr
                    d.color = colors[color_index]
                    var polyline = L.polyline(latlngs, {color: d.color, weight: 3, opacity: 0.5, smoothFactor: 1})
                    polyline.addTo(map);
                    d.polyline = polyline;
                    color_index += 1
                }
        });
    } else if (event.type == 'POSITION') {
        // lo mismo para los destinos
        var p = event?.payload
        if (positions[p.delivery_id]){
            if (typeof positions[p.delivery_id]?.polyline != 'undefined'){
            map.removeLayer(positions[p.delivery_id])
            map.removeLayer(positions[p.delivery_id].polyline)
            }
        }
        if (p != null){
            Object.values(deliveries).forEach(d => {
                if (d.id == p.delivery_id && deliveries[p.delivery_id] != null){
                    var marker = L.marker([p.position.lat, p.position.long], {icon: motoIcon})
                    d.product = null
                    marker.on('click', async function() {
                        // Inside the callback function, use await to make an asynchronous operation
                        const response = await get_course_ingr(d.product_id);                      
                        // Log the retrieved data to the console
                        const popup = L.popup().setContent(`Producto secreto: ${response.name}!`);
                        d.product = response.name
                        marker.bindPopup(popup).openPopup();
                    });
                    let str = `<b>Delivery ID: ${d.id}</b><br>Restaurante: ${restaurants[d.restaurant_id]?.name}<br>
                                Destino: ${destinations[d.destination_id]?.name}<br>User: ${users[d.user_id]?.name}<br>
                                lat: ${p.position.lat}, long: ${p.position.long}`
                    marker.bindTooltip(str);
                    marker.addTo(map);
                    positions[p.delivery_id] = marker
                    var latlngs = [[restaurants[d.restaurant_id]?.position.lat, restaurants[d.restaurant_id]?.position.long],
                                    [p.position.lat, p.position.long]];
                    var checker = false
                    latlngs.forEach(l => {
                        if (l[0] == null || l[1] == null){
                            checker = false
                        } else{
                            checker = true
                        } 
                    })
                    if (checker == true){
                        var polyline = L.polyline(latlngs, {color: d.color, weight: 3, opacity: 1, smoothFactor: 1})
                        polyline.addTo(map);
                        positions[p.delivery_id].polyline = polyline;
                    }
                    }
            })
        }
    } else if (event.type == 'CHAT') {
        const chatContainer = document.getElementById('chat-content');
        if (event.payload.name != "Jaime Andrés Coloma"){
            const messageTemplate = `<div class="media media-chat">
            <div class="media-body" style="align: justify;">
            <p style="color:green; background: white">${event.payload.name}</p> 
            <p>${event.payload.content}</p>
            <p class="meta">${time(event.payload.date)}</p>
            </div>
            </div>
            </div>`
            chatContainer.innerHTML += messageTemplate;
        }
        else {
            chatContainer.innerHTML += `<div class="media media-chat media-chat-reverse" ">
            <div class="media-body">
            <p style="color:blue; background: white">${event.payload.name}</p> 
            <p>${event.payload.content}</p>
            <p style="color:#9b9b9b;background: white">${time(event.payload.date)}</p>
            </div>
            </div>`
        }
    

    } else if (event.type == 'DELIVERY_STATUS') {
        var s = event?.payload
        if (s != null){
            if (positions[s.delivery_id]!= null){
                if (deliveries[s.delivery_id] != null){
                    if (typeof deliveries[s.delivery_id]?.status == 'undefined'){
                        deliveries[s.delivery_id].status = s.status
                // agregar notificar nuevo pedido, y eliminar moto cuando se entregue el pedido
                }else{
                    if (deliveries[s.delivery_id].status != s.status){
                        console.log("cambio de estado")
                    }
                    deliveries[s.delivery_id].status = s.status
                }
                //quizas que cuando no tenga pedido "picking_up, no se muestre la polyline"
                if (deliveries[s.delivery_id].status == "DELIVERED"){
                    if (typeof positions[s.delivery_id]?.polyline != 'undefined'){
                        map.removeLayer(positions[s.delivery_id].polyline)
                        map.removeLayer(positions[s.delivery_id])
                    }
                }
            }
            }
        }
    }
});

setTimeout(function () {
    window.dispatchEvent(new Event('resize'));
}, 500);

//funcion para enviar un mensaje a un socket
var btn = document.getElementById("MsgToSend");
btn.addEventListener('keydown', function(e) {
    if(e.keyCode==13) {
        if (e.target.value.length > 0){
            value = e.target.value
            send_message(value)
            e.target.value = ""
        }
     
    }
});

const orderButton = document.getElementById("orderButton");
      orderButton.addEventListener("click", placeOrder);

function placeOrder() {
  const restaurant = document.getElementById("Restaurant").value;
  const destination = document.getElementById("Destination").value;
  const meal = document.getElementById("Dish").value;
  if (restaurant == "Restaurante" || destination == "Destino" || meal == "Producto"){
    alert("Por favor, debe seleccionar un restaurante, destino y producto")
    return
    }
    send = {
        type: "ORDER",
        payload: {restaurant_id: restaurant,
                  product_id: meal,
                  destination: destination}
        }
    websocket.send(JSON.stringify(send));
    alert("Pedido creado correctamente! Que lo disfrutes :)")
    const select_1 = document.getElementById("Restaurant");
    select_1.innerHTML=`<select  id="Restaurant">
            <option value="Restaurante" disabled selected>Restaurante</option>
            </select>`
    const select_2 = document.getElementById("Destination");
    select_2.innerHTML=`<select  id="Destination">
            <option value="Destino" disabled selected>Destino</option>
            </select>`
    render_dishes()
}

function send_message(message){
    send = {
        type: "MESSAGE",
        payload: {content: message}
        }
    
    websocket.send(JSON.stringify(send));
}

//ORDEN PARA CONTINUAR:  ORDER, DELIVERY STATUS,
// PARA DEBUGGEAR, IR ELIMINANDO CADA EVENTO Y VER SI SE CAE O NO