"""Python Oracle: run the exact model.onnx that the browser consumes."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "model" / "model.onnx"
CONFIG_PATH = ROOT / "model" / "config.json"
PARITY_PATH = ROOT / "tests" / "parite.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="rewrite expected probabilities using Python ONNX Runtime")
    args = parser.parse_args()
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    parity = json.loads(PARITY_PATH.read_text(encoding="utf-8"))
    if len(parity.get("cases", [])) != 5:
        raise SystemExit("Expected exactly five differential parity cases; run train.py after the eval gate passes.")
    feature_order = config["contract"]["feature_order"]
    tolerance = float(config["contract"]["tolerance"])
    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    outputs = []
    for case in parity["cases"]:
        values = np.array([[case["input"][name] for name in feature_order]], dtype=np.float32)
        probabilities = session.run(["probabilities"], {"input": values})[0][0]
        outputs.append([float(probability) for probability in probabilities])

    if args.refresh:
        for case, probabilities in zip(parity["cases"], outputs):
            case["probabilities"] = probabilities
        parity["oracle"] = "Python ONNX Runtime"
        parity["tolerance"] = tolerance
        PARITY_PATH.write_text(json.dumps(parity, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"✓ Python Oracle references updated: {PARITY_PATH}")
        return

    differences = []
    for case, actual in zip(parity["cases"], outputs):
        expected = case.get("probabilities")
        if not isinstance(expected, list) or len(expected) != len(actual):
            raise SystemExit(f"{case['id']}: missing/wrong expected probability vector; run train.py or --refresh.")
        difference = float(np.max(np.abs(np.asarray(actual) - np.asarray(expected))))
        differences.append(difference)
        if difference >= tolerance:
            raise SystemExit(f"{case['id']}: Python ONNX output differs from parite.json by {difference:.2e} >= {tolerance:.0e}.")
    print(f"✓ Python Oracle parite: {len(outputs)}/5 cases, max difference {max(differences):.2e} < {tolerance:.0e}")


if __name__ == "__main__":
    main()
