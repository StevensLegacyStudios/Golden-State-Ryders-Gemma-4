"""
Golden State Ryders — Goldie AI Demo
Powered by Gemma 4 via Google AI Studio
Stevens Legacy Studios | Sacramento, CA

Hugging Face Spaces deployment.
Gemma is a trademark of Google LLC.
"""

import os
import gradio as gr
from google import genai
from google.genai import types
from haylie import HAYLIEDispatch
from bnb_fund import BNBFund

# Initialize
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
GEMMA_MODEL = "gemma-3-27b-it"
haylie = HAYLIEDispatch()
bnb = BNBFund(balance=22500.00)

GOLDIE_SYSTEM = """
You are Goldie — the front-of-house AI concierge for Golden State Ryders (GSR),
a California 501(c)(3) nonprofit. Your mission: dignity-centered transportation.

GSR's promise: "Every paid ryde funds a free one."
Commercial rides fund the Bent Not Broken (BNB) Fund.
The BNB Fund covers 100% of medical transportation costs — cancer patients,
dialysis patients, families, nurses, medical staff. No cost. No questions. Ever.

YOUR VOICE:
- Warm California-sunshine energy. Never clinical. Never cold.
- Use the rider's name when you have it.
- Always confirm before booking. No exceptions.
- Dignified — especially with medical riders. Never make them feel like charity.
- Clear, efficient. No filler words.

MEDICAL RIDE PROTOCOL:
When someone mentions a medical need:
1. Acknowledge warmly — not with pity, with dignity
2. Confirm: pickup location, destination, date/time, any mobility needs
3. Tell them the ride is fully covered at no cost — matter-of-factly
4. Ask if they need a companion seat
5. Confirm everything before closing

WHAT YOU NEVER DO:
- Never share fund balances or driver pay details
- Never deny a medical ride for any reason
- Never make a rider feel judged or like a burden
- Never skip confirmation before booking
- Never improvise on pricing

H.A.Y.L.I.E. is your intelligence layer. You never say that name to users.
You are simply Goldie. Warm. Reliable. Always there.
"""


def chat(message: str, history: list) -> tuple:
    dispatch = haylie.classify(message)
    fare_info = ""

    if dispatch["category"] == "COMMERCIAL":
        fare = haylie.estimate_fare(miles=5.0)
        breakdown = bnb.process_commercial_fare(fare)
        fare_info = (
            f"[H.A.Y.L.I.E. internal — not shown to rider]: "
            f"COMMERCIAL | Fare: ${fare} | "
            f"Driver: ${breakdown['driver_pay']} ({breakdown['driver_pct']}%) | "
            f"Fund: +${breakdown['fund_contribution']} ({breakdown['fund_pct']}%) | "
            f"Tier: {breakdown['tier']}"
        )
    elif dispatch["category"] == "MEDICAL_FREE":
        cost = haylie.estimate_fare(miles=5.0)
        medical = bnb.process_medical_ride(cost=cost, miles=5.0)
        fare_info = (
            f"[H.A.Y.L.I.E. internal — not shown to rider]: "
            f"MEDICAL FREE | Patient cost: $0.00 | "
            f"Fund absorbed: ${medical['fund_absorbed']} | "
            f"Free rides completed: {medical['total_free_rides']}"
        )

    context = f"{fare_info}\n\nRider message: {message}" if fare_info else message

    messages = []
    for h in history:
        messages.append({"role": "user", "parts": [{"text": h[0]}]})
        if h[1]:
            messages.append({"role": "model", "parts": [{"text": h[1]}]})
    messages.append({"role": "user", "parts": [{"text": context}]})

    response = client.models.generate_content(
        model=GEMMA_MODEL,
        contents=messages,
        config=types.GenerateContentConfig(
            system_instruction=GOLDIE_SYSTEM,
            max_output_tokens=512,
            temperature=0.75,
        )
    )
    reply = response.text
    history.append((message, reply))
    return "", history


def get_fund_status() -> str:
    s = bnb.status()
    return (
        f"BNB Fund Balance: {s['balance']}\n"
        f"Tier: {s['tier']}  |  Driver Rate: {s['driver_rate']}  |  Fund Rate: {s['fund_rate']}\n"
        f"Free Rides Completed: {s['free_rides_completed']}\n"
        f"Funded Miles: {s['funded_miles']}\n"
        f"Commercial Rides Processed: {s['commercial_rides']}"
    )


with gr.Blocks(theme=gr.themes.Base(), title="Golden State Ryders — Goldie AI") as demo:

    gr.HTML("""
    <div style="text-align:center; padding:20px; background:#0B1F3A;
                border-radius:12px; margin-bottom:20px">
        <h1 style="color:#F5A623; font-size:2em; margin:0">Golden State Ryders</h1>
        <p style="color:#FFFFFF; margin:6px 0 0 0; font-size:1.1em">
            Powered by Gemma 4 &middot; H.A.Y.L.I.E. OS &middot; Sacramento, CA
        </p>
        <p style="color:#B0B8C1; margin:6px 0 0 0; font-style:italic">
            "Every paid ryde funds a free one."
        </p>
    </div>
    """)

    with gr.Row():
        with gr.Column(scale=3):
            gr.Markdown("### Chat with Goldie")
            gr.Markdown(
                "Try: *'I need a ride to Kaiser'* "
                "or *'I have chemo tomorrow at UC Davis'*"
            )
            chatbot = gr.Chatbot(height=420, label="Goldie")
            msg_input = gr.Textbox(
                placeholder="Type your message here...",
                label="You"
            )
            with gr.Row():
                send_btn = gr.Button("Send", variant="primary")
                clear_btn = gr.Button("Clear")

        with gr.Column(scale=1):
            gr.Markdown("### Bent Not Broken Fund")
            fund_display = gr.Textbox(
                value=get_fund_status(),
                label="Live Fund Status",
                lines=8,
                interactive=False
            )
            refresh_btn = gr.Button("Refresh Fund Status")

    send_btn.click(chat, [msg_input, chatbot], [msg_input, chatbot])
    msg_input.submit(chat, [msg_input, chatbot], [msg_input, chatbot])
    clear_btn.click(lambda: ([], ""), outputs=[chatbot, msg_input])
    refresh_btn.click(get_fund_status, outputs=fund_display)

    gr.HTML("""
    <div style="text-align:center; margin-top:20px; color:#666; font-size:0.85em">
        Golden State Ryders &middot; Stevens Legacy Studios &middot; Sacramento, CA<br>
        Powered by Gemma 4 &middot; Gemma is a trademark of Google LLC.<br>
        goldenstateryders.skipsites.com &middot; StevensLegacyStudios@gmail.com
    </div>
    """)


if __name__ == "__main__":
    demo.launch()

