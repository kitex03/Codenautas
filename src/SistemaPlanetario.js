import * as THREE from "three";
import {changeScene} from "../Controlador.js";
import { LoadArrayPreguntas } from "./Cuestionario.js";

//Loader
const loadertexture = new THREE.TextureLoader();
var scenePlanets, cameraPlanets, renderer;

var clock;
const planets = [];
const planetData = [
    { name:'AquaTerra',radius: 2,distance: 8,speed:0.12,  color: 0x2194ce, speedrotation: 0.5026,},//50 seg
    { name:'Zephyria',radius: 2, distance: 16, speed: 0.0739, color: 0x9b7653, speedrotation: 0.2957,},//1:25min
    { name:'Mechanon',radius: 2, distance: 22, speed: 0.0502, color: 0x3d9970, speedrotation: 0.201,},// 2:05min
    { name:'Nymboria',radius: 2, distance: 31, speed: 0.0374, color: 0xa5673f, speedrotation: 0.1496,}, // 2:48 mins
    { name:'Ignis',radius: 2, distance: 37, speed: 0.0292, color: 0xff0000, speedrotation: 0.1169,},//3:35 mins
    { name:'Alcyon',radius: 2, distance: 48, speed: 0.0246, color: 0x00ffff, speedrotation: 0.1117,},//4:15mins
];
var sun;

const moons = [];
const moonData = [
    { name:'Luna', namePlanet:'Mechanon', radius: 0.5, distance: 4, speed: 0.00748, speedrotation: 0.5,},
    { name:'Phobos', namePlanet:'Nymboria', radius: 0.5, distance: 4, speed: 0.005845, speedrotation: 0.5,},
    { name:'Deimos', namePlanet:'Ignis', radius: 0.5, distance: 4, speed:0.005585, speedrotation: 0.5,},
];


//Movimiento de la cámara
var camforward ;
var camspeed = 4;
var camCollisionSensitive = 60; //Suvidad con la que la camara colisiona con los planetas


let alreadyplayed = false;

const num_Stars = 3000;

const TexturePath = "./img/Planets/";

let checkedThisFrame = false;


// addEventsPlanets();
function CreateScenePlanets(globalrenderer) {
    //Clock
    clock = new THREE.Clock();

    // Escena
    scenePlanets = new THREE.Scene();

    // Cámara
    cameraPlanets = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        2,
        1000
    );
    cameraPlanets.position.set(0, 5, 8);

    renderer = globalrenderer;
   


    // Crear geometría
    StarsGeometry();
    SunGeometry();
    PlanetGeometry();
    MoonGeometry();
    //Iluminación
    light();

    return [scenePlanets,cameraPlanets];
}

// Luz
function light() {
    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(0, 0, 0);
    scenePlanets.add(light);
    const ambientLight = new THREE.AmbientLight(0x333333);
    scenePlanets.add(ambientLight);
}

// Fondo estrellado
function StarsGeometry() {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < num_Stars; i++) {
        starVertices.push((Math.random() - 0.5) * 2000);
        starVertices.push((Math.random() - 0.5) * 2000);
        starVertices.push((Math.random() - 0.5) * 2000);
    }
    starGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scenePlanets.add(stars);
}

// Sol
function SunGeometry() {
    const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sunTexture = loadertexture.load('./img/Sun.jpg' );  
    sunTexture.mapping = THREE.EquirectangularReflectionMapping;
    const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,        // Aplicar la textura
        emissive: new THREE.Color(0xFFFF00), // Color de emisión (puedes ajustarlo)
        emissiveIntensity: 1,    // Intensidad de la luz emitida
        toneMapped: false        // Evitar que se haga corrección de tono (si la textura tiene alta intensidad)
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sun = sunMesh;
    scenePlanets.add(sunMesh);
}
// Planetas
function PlanetGeometry() {
    planetData.forEach((data) => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const planettexture = loadertexture.load(
            TexturePath + data.name + ".jpg"
        );  
        planettexture.mapping = THREE.EquirectangularReflectionMapping;
        const material = new THREE.MeshStandardMaterial({ map: planettexture });
        const planet = new THREE.Mesh(geometry, material);
        const angle = Math.random() * Math.PI * 2;
        const initialX = data.distance * Math.cos(angle);
        const initialZ = data.distance * Math.sin(angle);
        planet.position.set(initialX, 0, initialZ);
        planet.userData = {
            distance: data.distance,
            angle: angle,
            speed: data.speed,
            speedrotation: data.speedrotation,
            initialX: initialX,  // Guardamos la posición inicial
            initialZ: initialZ
        };
        planet.name = data.name;
        scenePlanets.add(planet);
        planets.push(planet);
    });

}

function MoonGeometry() {
    moonData.forEach((data) => {
        const parentPlanet = planets.find(p => p.name === data.namePlanet);
        if (!parentPlanet) return; // Si no hay planeta con ese nombre, continuar

        const geometry = new THREE.SphereGeometry(data.radius, 16, 16);
        const moontexture = loadertexture.load(
            TexturePath + data.name + ".jpg"
        );  
        const material = new THREE.MeshStandardMaterial({ map: moontexture });
        const moon = new THREE.Mesh(geometry, material);

        moon.name = data.name;
        // Posición inicial relativa al planeta
        const angle = Math.random() * Math.PI * 2;
        moon.position.set(
            parentPlanet.position.x + data.distance * Math.cos(angle),
            0,
            parentPlanet.position.z + data.distance * Math.sin(angle)
        );

        moon.userData = {
            parent: parentPlanet,
            distance: data.distance,
            angle: angle,
            speed: data.speed,
            speedrotation: data.speedrotation,
        };

        scenePlanets.add(moon);
        moons.push(moon);

    });
}

// Animación
function animateScenePlanets() {
    

    if(alreadyplayed){
        alreadyplayed = false;
        rebootScene();
    }

    const dt = clock.getDelta();


    
    //Planet Movement
    planets.forEach((planet) => {
        planet.userData.angle += dt * planet.userData.speed;
        planet.position.x = planet.userData.distance * Math.sin(planet.userData.angle);
        planet.position.z = planet.userData.distance * Math.cos(planet.userData.angle);


        planet.rotation.y -= dt* planet.userData.speedrotation;
    });

    //Moon Movement
    moons.forEach((moon) => {
        moon.userData.angle += dt * moon.userData.speed;
    
        const parent = moon.userData.parent;
        

        moon.position.x = parent.position.x + moon.userData.distance * Math.sin(-moon.userData.angle);
        moon.position.z = parent.position.z + moon.userData.distance * Math.cos(-moon.userData.angle);
        moon.rotation.y += dt * moon.userData.speedrotation;
    });

    



    planets.forEach((planet) => planet.updateMatrixWorld(true));
    cameraPlanets.updateMatrixWorld(true);

    checkedThisFrame = false;
    // Colisiones
    CheckPlanetsCollisions();
    CheckSunCollision();
    CheckMoonCollision();
    


    renderer.render(scenePlanets, cameraPlanets);
}

//Collisions
function CheckPlanetsCollisions() {

    if(checkedThisFrame){
        return;
    }
    checkedThisFrame = true;


    //Check planet collisions
    planets.forEach((planet) => {
        
        const planetWorldPos = new THREE.Vector3();
        planet.getWorldPosition(planetWorldPos);

        const cameraWorldPos = new THREE.Vector3();
        cameraPlanets.getWorldPosition(cameraWorldPos);
        const distance = cameraWorldPos.distanceTo(planetWorldPos);

        if (distance < planet.geometry.parameters.radius + cameraPlanets.near +.2) {
            LoadArrayPreguntas(planet.name);
            document.exitPointerLock();
            alreadyplayed = true;
            changeScene("sceneCuestions");
        }
    });
}

function CheckSunCollision(){
    const distance = cameraPlanets.position.distanceTo(sun.position);
    if (distance < sun.geometry.parameters.radius + cameraPlanets.near + 0.2) {
        const dt = clock.getDelta();
        camforward = new THREE.Vector3();
        cameraPlanets.getWorldDirection(camforward);
        const newpos = cameraPlanets.position.clone().add(camforward.clone().multiplyScalar(-camspeed));
        cameraPlanets.position.lerp(newpos, dt * camCollisionSensitive);
    }
}

function CheckMoonCollision(){
    moons.forEach((moon) => {
        const moonWorldPos = new THREE.Vector3();
        moon.getWorldPosition(moonWorldPos);

        const cameraWorldPos = new THREE.Vector3();
        cameraPlanets.getWorldPosition(cameraWorldPos);
        const distance = cameraWorldPos.distanceTo(moonWorldPos);

        if (distance < moon.geometry.parameters.radius + cameraPlanets.near +.2) {
            alreadyplayed = true;
            const nuevascene ="scene"+moon.name;
            changeScene(nuevascene);
            document.exitPointerLock();
        }
    });
}

//reboot the escene
function rebootScene(){
    cameraPlanets.position.set(0, 5, 8);
    cameraPlanets.rotation.set(0, 0, 0);
    // resetMovimientoCamara();
}



export { CreateScenePlanets,animateScenePlanets};
