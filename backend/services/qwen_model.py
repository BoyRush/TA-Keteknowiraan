import torch
import os
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel 

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
LORA_PATH = os.path.join(os.path.dirname(__file__), "..", "lora_model_herbal") 

# 1. Load Tokenizer & Model Dasar
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    torch_dtype=torch.float32,
    device_map="auto"
)

# 2. Tempelkan Adapter LoRA hasil training Colab
if os.path.exists(LORA_PATH):
    model = PeftModel.from_pretrained(base_model, LORA_PATH)
    print("✅ LoRA Adapter (Otak Pakar) Berhasil Terpasang!")
    print(f"📊 Tipe Model: {type(model)}")
else:
    model = base_model
    print("⚠️ Menggunakan Model Standar (Adapter tidak ditemukan)")

model.eval()

def generate_qwen(system_prompt, user_prompt):
    # --- BAGIAN UNTUK MELIHAT DATA RAG ---
    print("\n" + "="*50)
    print("📥 DEBUG: DATA RAG DARI CHROMADB MASUK KE PROMPT AI:")
    print(user_prompt) 
    print("="*50 + "\n")
    # -------------------------------------

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs, 
            max_new_tokens=512,
            temperature=0.1, # Rendah agar AI disiplin pada data
            do_sample=True
        )

    return tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)