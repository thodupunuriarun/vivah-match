// Decorative shader (Paper Shaders, WebGL2): sunrise rays behind the home hero.
// No WebGL, save-data, or any failure → nothing is added and the plain page stays.
// Reduced motion → one still frame. ShaderMount pauses itself when the tab is hidden or the effect is off-screen.
import {
  ShaderMount,
  getShaderColorFromString as C,
  getShaderNoiseTexture,
  defaultObjectSizing,
  ShaderFitOptions,
  godRaysFragmentShader,
} from "./vendor/paper-shaders/fx.js?v=1";

var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

function sizing(base, scale, offsetY) {
  return {
    u_fit: ShaderFitOptions[base.fit], u_scale: scale, u_rotation: 0,
    u_offsetX: 0, u_offsetY: offsetY || 0, u_originX: base.originX, u_originY: base.originY,
    u_worldWidth: base.worldWidth, u_worldHeight: base.worldHeight,
  };
}

function mount(host, kind, frag, uniforms, speed) {
  if (!host) return;
  var fx = document.createElement("div");
  fx.className = "fx fx-" + kind;
  fx.setAttribute("aria-hidden", "true");
  host.classList.add("fx-host");
  host.prepend(fx);
  try {
    // 1x pixels: soft light needs no retina detail and it saves phone battery
    new ShaderMount(fx, frag, uniforms, { premultipliedAlpha: true }, still ? 0 : speed, still ? 3000 : 0, 1, 1280 * 720);
    requestAnimationFrame(function () { fx.classList.add("is-on"); });
  } catch (e) {
    fx.remove();
  }
}

if (!(navigator.connection && navigator.connection.saveData)) {
  var noise = getShaderNoiseTexture(); // god rays need it loaded before mounting
  noise.decode().then(function () {
    var hero = document.querySelector(".home-hero");
    if (hero) {
      mount(hero, "rays", godRaysFragmentShader, Object.assign({
        u_colorBack: C("#FBF4E6"), u_colorBloom: C("#F6D48C"),
        u_colors: ["#E9B54A99", "#F3C46E", "#FFF6DD", "#EFA9B8aa"].map(C), u_colorsCount: 4,
        u_density: 0.35, u_spotty: 0.25, u_midIntensity: 0.65, u_midSize: 0.3, u_intensity: 0.7, u_bloom: 0.5,
        u_noiseTexture: noise,
      }, sizing(defaultObjectSizing, 1.1, -0.9)), 0.25);
    }
  }, function () {});
}
