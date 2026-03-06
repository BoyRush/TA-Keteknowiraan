import torch
import os
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel 

MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"
LORA_PATH = os.path.join(os.path.dirname(__file__), "..", "lora_model_herbal") 

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)

base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config, 
    device_map="auto",
    trust_remote_code=True
)


if os.path.exists(LORA_PATH):
    model = PeftModel.from_pretrained(
        base_model, 
        LORA_PATH, 
        device_map="auto"
    )
    print(" LoRA Adapter (Otak Pakar) Berhasil Terpasang!")
else:
    model = base_model
    print(" Menggunakan Model Standar (Adapter tidak ditemukan)")

model.eval()

def generate_qwen(system_prompt, user_prompt):
    # --- DEBUG UNTUK MELIHAT DATA MASUK ---
    print("\n" + "="*40)
    print("📥 AI SEDANG BERPIKIR (Mohon Tunggu)...")
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    # Memproses template chat
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    # PROSES GENERASI YANG LEBIH RINGAN
    with torch.no_grad():
        outputs = model.generate(
            **inputs, 
            max_new_tokens=64,   # Kita kecilkan karena hanya butuh 1 kalimat
            do_sample=False,     # Greedy search: Lebih cepat dan tidak plin-plan
            # HAPUS temperature=0.1 jika do_sample=False untuk menghindari warning/stuck
            repetition_penalty=1.1, # Mencegah AI mengulang kata yang sama
            pad_token_id=tokenizer.eos_token_id
        )

    # 1. Ambil jawaban murni dari AI
    response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True).strip()
    
    # 2. DEBUG UNTUK MELIHAT JAWABAN AI
    print(f"JAWABAN AI SELESAI: '{response}'")
    print("="*40 + "\n")

    return response