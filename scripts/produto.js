// ====== Imports ======
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ====== Cena e Renderer ======
const cena = new THREE.Scene();
const canvas = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth * 0.6, window.innerHeight * 0.8);
renderer.setClearColor(0xf5f5f5);
renderer.shadowMap.enabled = true;

// ====== Câmera e Controles ======
const camera = new THREE.PerspectiveCamera(
    60,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
);
camera.position.set(1, 0.5, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ====== Luzes ======
const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.3);
const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.8);
luzDirecional.position.set(2, 2, 2);
luzDirecional.castShadow = true;
cena.add(luzAmbiente, luzDirecional);

// ====== Variáveis Globais ======
let modelo;
let mixer;
let acoes = {}; // Guarda as ações de animação
let pausado = false; // Estado de pausa global
let ultimaAnimacao = null;

// ====== Carregar Modelo GLTF ======
const loader = new GLTFLoader();
loader.load(
    "models/RecordPlayer.gltf",
    (gltf) => {
        modelo = gltf.scene;
        modelo.scale.set(1, 1, 1);
        cena.add(modelo);

        // ✅ Salvar cor original de cada material
        modelo.traverse((obj) => {
            if (obj.isMesh) {
                obj.material.colorOriginal = obj.material.color.clone();
            }
        });

        // Criar AnimationMixer
        mixer = new THREE.AnimationMixer(modelo);

        // Nomes das animações criadas no Blender
        const nomesAnimacoes = ["MexerBraco", "RodarDisco", "FecharTampa"];

        nomesAnimacoes.forEach((nome) => {
            const clip = THREE.AnimationClip.findByName(gltf.animations, nome);
            if (clip) {
                const acao = mixer.clipAction(clip);
                acao.clampWhenFinished = true;
                acao.loop = THREE.LoopOnce; // exceto o disco (ajustado abaixo)
                acoes[nome] = acao;
            }
        });

        console.log("✅ Modelo e animações carregados com sucesso!");
    },
    undefined,
    (erro) => console.error("❌ Erro ao carregar modelo:", erro)
);

// ====== Botões Individuais ======
document.getElementById("btn-braco").addEventListener("click", () => {
    ultimaAnimacao = "MexerBraco";

    if (acoes["RodarDisco"]) acoes["RodarDisco"].stop();
    if (acoes["FecharTampa"]) acoes["FecharTampa"].stop();
    if (acoes["MexerBraco"]) acoes["MexerBraco"].reset().play();
});


document.getElementById("btn-disco").addEventListener("click", () => {
    ultimaAnimacao = "RodarDisco";

    if (acoes["MexerBraco"]) acoes["MexerBraco"].stop();
    if (acoes["FecharTampa"]) acoes["FecharTampa"].stop();

    if (acoes["RodarDisco"]) {
        const disco = acoes["RodarDisco"];
        disco.reset();
        disco.loop = THREE.LoopRepeat;
        disco.play();
    }
});

document.getElementById("btn-tampa").addEventListener("click", () => {
    ultimaAnimacao = "FecharTampa";

    if (acoes["RodarDisco"]) acoes["RodarDisco"].stop();
    if (acoes["MexerBraco"]) acoes["MexerBraco"].stop();
    if (acoes["FecharTampa"]) acoes["FecharTampa"].reset().play();
});

// ====== Botão START: inicia todas as animações do zero ======
document.getElementById("btn-start-todas").addEventListener("click", () => {
    pausado = false;
    for (let nome in acoes) {
        acoes[nome].reset().play();
    }
    console.log("🎬 Todas as animações iniciadas do zero");
});

document.getElementById("btn-toggle-play").addEventListener("click", () => {
    pausado = !pausado; // alterna entre pausar e reproduzir

    // Atualiza o ícone do botão
    document.getElementById("btn-toggle-play").textContent = pausado ? "▶" : "⏸";

    console.log(pausado ? "⏸ Animações pausadas" : "▶ Animações retomadas");
});

// ====== Botão RESET: pára tudo e volta ao início ======
document.getElementById("btn-reset-todas").addEventListener("click", () => {
    pausado = false;
    for (let nome in acoes) {
        acoes[nome].stop();
    }
    console.log("⟲ Todas as animações resetadas");
});

// ====== Swatches de Cor ======
const coresSwatches = {
    "madeira-normal": null,
    "madeira-clara": 0xdeb887,
    "branco": 0xffffff,
};

const swatches = document.querySelectorAll(".swatches li");
swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
        if (!modelo) return;

        // Atualiza UI
        swatches.forEach((s) => s.classList.remove("active"));
        swatch.classList.add("active");

        const corSelecionada = swatch.getAttribute("data-cor");
        const novaCor = coresSwatches[corSelecionada];

        // Aplica a cor ou restaura a original
        modelo.traverse((obj) => {
            if (obj.isMesh) {
                if (novaCor !== null) {
                    obj.material.color.setHex(novaCor);
                } else if (obj.material.colorOriginal) {
                    obj.material.color.copy(obj.material.colorOriginal);
                }
                obj.material.needsUpdate = true;
            }
        });
    });
});

// ====== Loop de Renderização ======
const clock = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);

    const delta = clock.getDelta();
    if (mixer && !pausado) mixer.update(delta); // só atualiza se não estiver pausado

    controls.update();
    renderer.render(cena, camera);
}

animar();

// ====== Responsividade ======
window.addEventListener("resize", () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});
