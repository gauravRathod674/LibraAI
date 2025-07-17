# backend/AI_Features/xtts_test.py

import os, torch
from TTS.api import TTS

# ─── 0) cd into this folder so xtts_v2/* resolves correctly ────────────────
os.chdir(os.path.dirname(__file__))

# ─── 1) Monkey‑patch torch.load → force weights_only=False ─────────────────
_orig_load = torch.load
def _load_full(f, *args, **kwargs):
    kwargs["weights_only"] = False
    return _orig_load(f, *args, **kwargs)
torch.load = _load_full

# ─── 2) CUDA sanity check ────────────────────────────────────────────────────
print("PyTorch", torch.__version__)
print("CUDA available?", torch.cuda.is_available())
assert torch.cuda.is_available(), "CUDA not detected! Check drivers/PyTorch."
print("Using GPU device:", torch.cuda.current_device())

# ─── 3) Init TTS from your local folder ──────────────────────────────────────
tts = TTS(
    model_path="xtts_v2",              # directory with config.json + model.pth
    config_path="xtts_v2/config.json", # explicit so it’s never None
    progress_bar=True,
)
tts.to(torch.device("cuda:0"))

# ─── 4) Auto‑patch any GPT2InferenceModel instance → add generate() ────────
from TTS.tts.layers.xtts.gpt import GPT2InferenceModel

# Look through the synthesizer for GPT2InferenceModel instances
synth = tts.synthesizer
patched = False
for attr in dir(synth):
    obj = getattr(synth, attr)
    if isinstance(obj, GPT2InferenceModel):
        if not hasattr(obj, "generate"):
            print(f"[Patch] Adding .generate() to GPT2InferenceModel at synthesizer.{attr}")
            obj.generate = obj.forward
            patched = True

if not patched:
    print("[Patch] No GPT2InferenceModel found to patch (OK if none).")

# ─── 5) Define inputs & run synthesis ───────────────────────────────────────
text       = "Hello Gaurav! XTTS‑v2 is now running on GPU with no errors."
speaker_wav = "xtts_v2/samples/en_sample.wav"
language   = "en"
output_wav = "output_gpu.wav"

tts.tts_to_file(
    text=text,
    speaker_wav=speaker_wav,
    language=language,
    file_path=output_wav,
)

print("✅ Done — output written to", output_wav)
