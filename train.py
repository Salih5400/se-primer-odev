"""Train the adaptive hint model, enforce the predeclared eval gate, and export ONNX."""
from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, recall_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "oturumlar.csv"
MODEL_PATH = ROOT / "model"
TEMP_PATH = ROOT / "_out" / "candidate-model"
PARITY_PATH = ROOT / "tests" / "parite.json"
PUBLIC_PARITY_PATH = ROOT / "public" / "tests" / "parite.json"

SEED = 13
MIN_REAL_SESSIONS = 15
N_SPLITS = 5
PROBABILITY_THRESHOLD = 0.55
MIN_BALANCED_ACCURACY = 0.65
MIN_POSITIVE_RECALL = 0.70
TOLERANCE = 1e-4
FEATURES = [
    "seviye_deneyimli",
    "karar_suresi_sn",
    "onceki_riskli_secim_sayisi",
    "onceki_ipucu_sayisi",
    "sahne_no",
]
TARGET = "riskli_secim"
REQUIRED_COLUMNS = ["session_id", "decision_id", *FEATURES, TARGET, "kaynak"]
LABELS = {"0": "Güvenli seçimi yaptı", "1": "Riskli seçimi yaptı"}
REFERENCE_INPUTS = [
    {"seviye_deneyimli": 0, "karar_suresi_sn": 8.0, "onceki_riskli_secim_sayisi": 0, "onceki_ipucu_sayisi": 0, "sahne_no": 1},
    {"seviye_deneyimli": 1, "karar_suresi_sn": 22.0, "onceki_riskli_secim_sayisi": 0, "onceki_ipucu_sayisi": 0, "sahne_no": 1},
    {"seviye_deneyimli": 0, "karar_suresi_sn": 41.0, "onceki_riskli_secim_sayisi": 1, "onceki_ipucu_sayisi": 1, "sahne_no": 2},
    {"seviye_deneyimli": 1, "karar_suresi_sn": 56.0, "onceki_riskli_secim_sayisi": 2, "onceki_ipucu_sayisi": 1, "sahne_no": 3},
    {"seviye_deneyimli": 0, "karar_suresi_sn": 13.5, "onceki_riskli_secim_sayisi": 1, "onceki_ipucu_sayisi": 2, "sahne_no": 3},
]


def stop(message: str) -> None:
    raise SystemExit(f"✗ {message}")


def load_real_data() -> pd.DataFrame:
    data = pd.read_csv(DATA_PATH)
    missing = [column for column in REQUIRED_COLUMNS if column not in data.columns]
    if missing:
        stop(f"CSV sütunları eksik: {', '.join(missing)}")
    if not set(data["kaynak"].dropna().unique()).issubset({"gercek", "sentetik"}):
        stop("kaynak yalnız 'gercek' veya 'sentetik' olabilir.")
    real = data.loc[data["kaynak"] == "gercek"].copy()
    session_count = real["session_id"].nunique()
    if session_count < MIN_REAL_SESSIONS:
        stop(f"Yayın kapısı kapalı: {session_count}/{MIN_REAL_SESSIONS} gerçek oturum var; sentetik satırlar sayılmaz.")
    if real[REQUIRED_COLUMNS].isna().any().any():
        stop("Gerçek oturum satırlarında boş alan var.")
    if not set(real[TARGET].unique()).issubset({0, 1}):
        stop("riskli_secim yalnızca 0 veya 1 olmalı.")
    if set(real[TARGET].unique()) != {0, 1}:
        stop("Eğitim için hem 0 hem 1 etiketli gerçek yanıt bulunmalı.")
    if real["session_id"].astype(str).str.strip().eq("").any():
        stop("session_id boş olamaz.")

    expected_decisions = {"architecture", "testing", "privacy"}
    incomplete = [session for session, group in real.groupby("session_id")
                  if set(group["decision_id"]) != expected_decisions or len(group) != 3]
    if incomplete:
        stop(f"Her gerçek oturum tam 3 farklı karar satırı içermeli; eksik/tekrarlı oturum sayısı: {len(incomplete)}.")
    if session_count < N_SPLITS:
        stop(f"GroupKFold için en az {N_SPLITS} farklı oturum gerekir.")

    for column in [*FEATURES, TARGET]:
        real[column] = pd.to_numeric(real[column], errors="coerce")
    if not np.isfinite(real[[*FEATURES, TARGET]].to_numpy(dtype=float)).all():
        stop("Özellikler ve etiketler sonlu sayısal değerler olmalı.")
    if not real["seviye_deneyimli"].isin([0, 1]).all() or not real[TARGET].isin([0, 1]).all():
        stop("seviye_deneyimli ve riskli_secim 0/1 olmalı.")
    if not real["sahne_no"].isin([1, 2, 3]).all():
        stop("sahne_no yalnızca 1, 2 veya 3 olabilir.")
    if not real["karar_suresi_sn"].between(0, 600).all():
        stop("karar_suresi_sn 0–600 saniye aralığında olmalı.")
    return real.sort_values(["session_id", "sahne_no"]).reset_index(drop=True)


def build_estimator() -> Pipeline:
    return Pipeline([
        ("scale", StandardScaler()),
        ("classifier", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=SEED)),
    ])


def evaluate_grouped(data: pd.DataFrame) -> dict[str, float]:
    features = data[FEATURES]
    target = data[TARGET].astype(int)
    groups = data["session_id"]
    oof_probabilities = np.full(len(data), np.nan, dtype=float)
    splitter = GroupKFold(n_splits=N_SPLITS)
    try:
        for train_indices, validation_indices in splitter.split(features, target, groups):
            fold_model = build_estimator()
            fold_model.fit(features.iloc[train_indices], target.iloc[train_indices])
            positive_index = list(fold_model.classes_).index(1)
            oof_probabilities[validation_indices] = fold_model.predict_proba(features.iloc[validation_indices])[:, positive_index]
    except ValueError as error:
        stop(f"Oturum bazlı doğrulama kurulamadı: {error}")
    if not np.isfinite(oof_probabilities).all():
        stop("GroupKFold tüm satırlar için doğrulama tahmini üretemedi.")

    predicted = (oof_probabilities >= PROBABILITY_THRESHOLD).astype(int)
    metrics = {
        "balanced_accuracy": float(balanced_accuracy_score(target, predicted)),
        "recall_riskli_secim": float(recall_score(target, predicted, pos_label=1, zero_division=0)),
        "probability_threshold": PROBABILITY_THRESHOLD,
        "validation": "5-fold GroupKFold grouped by session_id",
        "real_sessions": int(groups.nunique()),
        "real_decision_rows": int(len(data)),
    }
    if metrics["balanced_accuracy"] < MIN_BALANCED_ACCURACY:
        stop(f"Balanced accuracy {metrics['balanced_accuracy']:.3f} < {MIN_BALANCED_ACCURACY:.2f}; candidate model not published.")
    if metrics["recall_riskli_secim"] < MIN_POSITIVE_RECALL:
        stop(f"Riskli seçim sınıfı recall {metrics['recall_riskli_secim']:.3f} < {MIN_POSITIVE_RECALL:.2f}; candidate model not published.")
    return metrics


def convert_and_verify(model: Pipeline, sample: pd.DataFrame, destination: Path) -> tuple[np.ndarray, float]:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType

    onnx_model = convert_sklearn(
        model,
        initial_types=[("input", FloatTensorType([None, len(FEATURES)]))],
        options={id(model.named_steps["classifier"]): {"zipmap": False}},
        target_opset=17,
    )
    destination.write_bytes(onnx_model.SerializeToString())
    session = ort.InferenceSession(str(destination), providers=["CPUExecutionProvider"])
    output_names = [output.name for output in session.get_outputs()]
    if "probabilities" not in output_names:
        stop(f"ONNX sözleşmesinde probabilities çıktısı yok: {output_names}")
    onnx_probabilities = session.run(["probabilities"], {"input": sample.to_numpy(dtype=np.float32)})[0]
    positive_index = list(model.classes_).index(1)
    sklearn_probabilities = model.predict_proba(sample)[:, positive_index]
    onnx_positive = onnx_probabilities[:, list(model.classes_).index(1)]
    max_difference = float(np.max(np.abs(onnx_positive - sklearn_probabilities)))
    if max_difference > TOLERANCE:
        stop(f"ONNX ile sklearn en büyük farkı {max_difference:.2e} > {TOLERANCE:.0e}.")
    return onnx_probabilities, max_difference


def main() -> None:
    data = load_real_data()
    metrics = evaluate_grouped(data)
    estimator = build_estimator().fit(data[FEATURES], data[TARGET].astype(int))
    examples = [8.0, 22.0, 41.0, 56.0, 13.5]
    default_input = dict(zip(FEATURES, [0, examples[0], 0, 0, 1]))
    TEMP_PATH.parent.mkdir(parents=True, exist_ok=True)
    if TEMP_PATH.exists():
        shutil.rmtree(TEMP_PATH)
    TEMP_PATH.mkdir(parents=True)
    onnx_path = TEMP_PATH / "model.onnx"
    _, max_difference = convert_and_verify(estimator, data[FEATURES], onnx_path)
    metrics["sklearn_onnx_max_abs_difference"] = max_difference

    config = {
        "schema_version": 1,
        "title": "The Primer — davranıştan uyarlanan ipucu modeli",
        "description": "Karar öncesi oyun davranışından oyuncunun riskli seçeneği işaretleme olasılığını tahmin eder. Klinik veya ölçme-değerlendirme kararı değildir.",
        "target": TARGET,
        "classes": [0, 1],
        "class_labels": LABELS,
        "features": [
            {"name": name, "label": name, "example": default_input[name]}
            for name in FEATURES
        ],
        "contract": {
            "input_name": "input",
            "input_dtype": "float32",
            "input_shape": "[batch, feature_count]",
            "output_name": "probabilities",
            "positive_class": 1,
            "feature_order": FEATURES,
            "tolerance": TOLERANCE,
        },
        "decision_threshold": PROBABILITY_THRESHOLD,
        "metrics": metrics,
        "seed": SEED,
        "model": "StandardScaler + LogisticRegression(class_weight=balanced)",
        "sklearn_version": sklearn.__version__,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
    }
    (TEMP_PATH / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (TEMP_PATH / "README.md").write_text(model_card(config), encoding="utf-8")

    # Golden inputs are generic test values, never copied from participant records.
    canonical = pd.DataFrame(REFERENCE_INPUTS, columns=FEATURES)
    onnx_session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    expected = onnx_session.run(["probabilities"], {"input": canonical.to_numpy(dtype=np.float32)})[0]
    parity = {
        "model_contract": "model/config.json",
        "tolerance": TOLERANCE,
        "oracle": "Python ONNX Runtime",
        "cases": [
            {"id": f"P{i + 1}", "input": row, "probabilities": [float(value) for value in expected[i]]}
            for i, row in enumerate(REFERENCE_INPUTS)
        ],
    }

    backup = ROOT / "_out" / "previous-model"
    if backup.exists():
        shutil.rmtree(backup)
    if MODEL_PATH.exists():
        os.replace(MODEL_PATH, backup)
    try:
        os.replace(TEMP_PATH, MODEL_PATH)
        PARITY_PATH.parent.mkdir(parents=True, exist_ok=True)
        PARITY_PATH.write_text(json.dumps(parity, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        PUBLIC_PARITY_PATH.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC_PARITY_PATH.write_text(json.dumps(parity, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except Exception:
        if MODEL_PATH.exists():
            shutil.rmtree(MODEL_PATH)
        if backup.exists():
            os.replace(backup, MODEL_PATH)
        raise
    if backup.exists():
        shutil.rmtree(backup)

    print("✓ Eval kapısı geçti; model ve ONNX artefaktı üretildi.")
    print(json.dumps(metrics, indent=2, ensure_ascii=False))
    print(f"✓ model.onnx / config.json / model kartı → {MODEL_PATH}")
    print(f"✓ Python Oracle referansları → {PARITY_PATH}")


def model_card(config: dict) -> str:
    metrics = config["metrics"]
    return f"""# The Primer — davranıştan uyarlanan ipucu modeli

## Amaç
Bu küçük tablo modeli, aynı eğitim senaryosunda oyuncunun karar vermeden önce riskli seçeneği işaretleme olasılığını tahmin eder. Olasılık en az {config['decision_threshold']:.2f} ise web uygulaması karara özel koruyucu ipucunu gösterir; deneyimli moddaki sayaç o sahnede durur.

## Veri ve yöntem
- Kaynak: yalnızca açık rıza verilmiş, kimliksizleştirilmiş gerçek oyun oturumları (`kaynak=gercek`); sentetik satırlar eğitimden çıkarılır.
- Doğrulama: oturum sızıntısını önlemek için 5-fold GroupKFold (`session_id`). Sabit tohum: {config['seed']}.
- Model: {config['model']}.
- Özellik sırası: `{', '.join(FEATURES)}`.

## Eval
- Balanced accuracy: {metrics['balanced_accuracy']:.3f} (kabul alt sınırı {MIN_BALANCED_ACCURACY:.2f})
- Riskli seçim recall: {metrics['recall_riskli_secim']:.3f} (kabul alt sınırı {MIN_POSITIVE_RECALL:.2f})
- Gerçek oturum/karar satırı: {metrics['real_sessions']} / {metrics['real_decision_rows']}
- ONNX ↔ sklearn maksimum mutlak olasılık farkı: {metrics['sklearn_onnx_max_abs_difference']:.2e} (tolerans {TOLERANCE:.0e})

## Sınırlar ve kullanılmaması gereken durumlar
Bu model tek bir kısa, kurgusal yazılım mühendisliği senaryosundan gelen küçük bir örnekleme dayanır. Genel öğrenme yeteneği, not, işe alım, ruh sağlığı, tıbbi/klinik karar veya gerçek kişiye ilişkin değerlendirme için kullanılmamalıdır. Tahmin, kullanıcının kendi yanıtının yerine geçmez. Veri toplama, senaryo veya etiket yöntemi değiştiğinde yeniden değerlendirin.

## ONNX sözleşmesi
- Girdi: `input`, float32 `[batch, {len(FEATURES)}]`, sıra `config.json` → `contract.feature_order`.
- Çıktı: `probabilities`, float32 `[batch, 2]`, sınıf sırası `config.json` → `classes`.
- Uygulama eşiği: `{config['decision_threshold']:.2f}`; Python ve tarayıcı fark toleransı: `{TOLERANCE:.0e}`.
"""


if __name__ == "__main__":
    main()
