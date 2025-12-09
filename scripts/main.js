import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("three-canvas-produto1");

if (!canvas) {
    console.warn("Canvas do produto 1 não encontrado.");
} else {
    iniciarCena();
}

function iniciarCena() {
    const cena = new THREE.Scene();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff);

    // Câmara
    const camera = new THREE.PerspectiveCamera(
        50,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        100
    );
    // Posição mais próxima para aumentar o modelo na tela
    camera.position.set(1.5, 1.0, 1.5);

    // Luz
    const ambient = new THREE.AmbientLight(0xffffff, 2.2);
    cena.add(ambient);

    // Carregar modelo
    new GLTFLoader().load(
        "models/RecordPlayer.gltf",
        (gltf) => {
            const modelo = gltf.scene;
            // Escala maior
            modelo.scale.set(2.5, 2.5, 2.5);

            cena.add(modelo);

            // Centralizar câmara no modelo
            const box = new THREE.Box3().setFromObject(modelo);
            const center = new THREE.Vector3();
            box.getCenter(center);
            camera.lookAt(center);

            // Renderiza apenas uma vez
            renderer.render(cena, camera);
        },
        undefined,
        (err) => console.error("Erro ao carregar modelo 3D:", err)
    );

    // Responsividade
    window.addEventListener("resize", () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.render(cena, camera); // renderiza novamente se redimensionar
    });
}
