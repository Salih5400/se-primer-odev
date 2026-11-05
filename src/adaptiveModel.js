const runtimeScript = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js";
const wasmDirectory = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

const expectedFeatureOrder = [
  "seviye_deneyimli",
  "karar_suresi_sn",
  "onceki_yanlis_sayisi",
  "onceki_ipucu_sayisi",
  "sahne_no",
];
let modelPromise;
let runtimePromise;

async function loadRuntime() {
  if (window.ort) return window.ort;
  if (!runtimePromise) {
    runtimePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = runtimeScript;
      script.async = true;
      script.onload = () => window.ort ? resolve(window.ort) : reject(new Error("ONNX Runtime global bulunamadı."));
      script.onerror = () => reject(new Error("ONNX Runtime Web CDN yüklenemedi."));
      document.head.append(script);
    }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  const ort = await runtimePromise;
  ort.env.wasm.wasmPaths = wasmDirectory;
  ort.env.wasm.numThreads = 1;
  return ort;
}

async function loadModel() {
  const manifestResponse = await fetch(`${import.meta.env.BASE_URL}model/release.json`, { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Model sürüm dosyası yüklenemedi.");
  const manifest = await manifestResponse.json();
  if (!manifest.enabled || !manifest.revision || !manifest.model_url || !manifest.config_url) {
    throw new Error(manifest.reason || "Uyarlama modeli henüz yayımlanmadı.");
  }
  if (!/^[0-9a-f]{40}$/i.test(manifest.revision)) throw new Error("Model revizyonu tam commit SHA olmalı.");
  const pinnedPath = `/resolve/${manifest.revision}/`;
  for (const url of [manifest.model_url, manifest.config_url]) {
    const parsed = new URL(url);
    if (parsed.hostname !== "huggingface.co" || !parsed.pathname.includes(pinnedPath)) {
      throw new Error("Model URL'si commit'e sabitlenmemiş.");
    }
  }
  const configResponse = await fetch(manifest.config_url, { cache: "force-cache" });
  if (!configResponse.ok) throw new Error("Model sözleşmesi yüklenemedi.");
  const config = await configResponse.json();
  const featureOrder = config.contract?.feature_order;
  if (JSON.stringify(featureOrder) !== JSON.stringify(expectedFeatureOrder)) {
    throw new Error("Model özellik sırası uygulama sözleşmesiyle uyuşmuyor.");
  }
  if (config.contract?.input_name !== "input" || config.contract?.output_name !== "probabilities" || config.contract?.positive_class !== 1) {
    throw new Error("Model girdi/çıktı sözleşmesi geçersiz.");
  }
  const ort = await loadRuntime();
  const session = await ort.InferenceSession.create(manifest.model_url, { executionProviders: ["wasm"] });
  return { ort, session, config, revision: manifest.revision };
}

export async function predictAdaptive(features) {
  if (!modelPromise) modelPromise = loadModel().catch((error) => {
    modelPromise = null;
    throw error;
  });
  const model = await modelPromise;
  const values = expectedFeatureOrder.map((name) => Number(features[name]));
  if (values.some((value) => !Number.isFinite(value))) throw new Error("Model girdisi sayısal değil.");
  const input = new model.ort.Tensor("float32", Float32Array.from(values), [1, expectedFeatureOrder.length]);
  const outputs = await model.session.run({ input });
  const probabilities = Array.from(outputs.probabilities.data, Number);
  if (probabilities.length !== 2 || probabilities.some((value) => !Number.isFinite(value))) {
    throw new Error("Model olasılık çıktısı geçersiz.");
  }
  return {
    probabilities,
    probability: probabilities[1],
    threshold: Number(model.config.decision_threshold),
    revision: model.revision,
  };
}
