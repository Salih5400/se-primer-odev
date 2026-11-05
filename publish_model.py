"""Publish only eval-gated ONNX artifacts to Hugging Face and pin the app manifest."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "model"
MANIFEST_PATH = ROOT / "public" / "model" / "release.json"
RELEASE_PATH = ROOT / "RELEASE.md"


def main() -> None:
    repo_id = os.environ.get("HF_REPO_ID", "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo_id):
        raise SystemExit("HF_REPO_ID ortam değişkenini 'kullanici/model-adi' biçiminde ayarla.")
    required = [MODEL_DIR / "model.onnx", MODEL_DIR / "config.json", MODEL_DIR / "README.md"]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.is_file()]
    if missing:
        raise SystemExit(f"Eval kapısından geçmiş model paketini bulamadım: {', '.join(missing)}. Önce python train.py çalıştır.")

    config = json.loads((MODEL_DIR / "config.json").read_text(encoding="utf-8"))
    metrics = config.get("metrics", {})
    if metrics.get("real_sessions", 0) < 15 or metrics.get("balanced_accuracy", 0) < 0.65 or metrics.get("recall_riskli_secim", 0) < 0.70:
        raise SystemExit("Model config önceden belirlenen gerçek oturum/eval kapısını göstermiyor; yayımlama durduruldu.")

    api = HfApi(token=os.environ.get("HF_TOKEN") or None)
    api.create_repo(repo_id=repo_id, repo_type="model", private=False, exist_ok=True)
    commit = api.upload_folder(
        folder_path=str(MODEL_DIR),
        path_in_repo="",
        repo_id=repo_id,
        repo_type="model",
        commit_message="Publish eval-gated The Primer v2 ONNX model",
    )
    revision = getattr(commit, "oid", None)
    if not isinstance(revision, str) or not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise SystemExit("Hugging Face commit SHA doğrulanamadı; canlı manifest değiştirilmedi.")

    root_url = f"https://huggingface.co/{repo_id}/resolve/{revision}"
    manifest = {
        "enabled": True,
        "reason": "Eval-gated model; pinned to an immutable Hugging Face commit.",
        "revision": revision,
        "model_url": f"{root_url}/model.onnx",
        "config_url": f"{root_url}/config.json",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Yayımlandı: https://huggingface.co/{repo_id}")
    print(f"Commit: {revision}")
    print("public/model/release.json güncellendi. Bu manifesti, model kartını ve release kaydını GitHub'a commit/push et; sonra Pages deployment ve Cypress'i doğrula.")


if __name__ == "__main__":
    main()
