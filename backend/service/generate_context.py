import os
from loguru import logger
from google import genai
from google.genai import types

client = genai.Client()

async def summarize_conversation_with_llm(
    transcript_history: list[dict[str, str]],
) -> dict[str, any]:
    print("🥰🥰🥰🥰🥰🥰🥰🥰🥰🥰🥰")
    default_summary = {
        "summary_line": "Conversation summary unavailable.",
        "interest_percentage": 0,
    }

    if not transcript_history:
        return {
            "summary_line": "Call ended before any conversation occurred.",
            "interest_percentage": 0,
        }

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("Cannot summarize conversation without GOOGLE_API_KEY")
        return default_summary

    conversation_text = "\n".join(
        f"{entry['role'].capitalize()}: {entry['content']}"
        for entry in transcript_history
    )

    print("🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴")
    print(f"{conversation_text}")

    prompt = (
        """
            ROLE:
                You are an AI that analyzes a conversation between **Zara (AI assistant doctor)** and a **Human (patient)**.
                TASK:
                Based on the conversation:
                1. Give a very short summary of the human’s intention (2–3 lines).
                2. Identify if the human is interested in booking a doctor appointment.
                3. Provide an interest score percentage (0–100%).
                4. Give a final decision: Interested / Not Interested.
                5. Provide one short reason behind the decision.

                INTEREST SCORE GUIDELINES:
                - 0–30% → Not Interested
                - 31–60% → Slightly Interested
                - 61–90% → Highly Interested
                - 91–100% → Extremely Interested / Ready to Book

                OUTPUT FORMAT:
                Summary: <2–3 line summary here>
                Interest Score: <number>%
                Decision: Interested / Not Interested
                Reason: <one sentence reasoning>

                INPUT:
                Conversation:
                    f"{conversation_text}"
    """
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disables thinking
        ),
    )
    
    print("😁😁😁😁😁😁😁😁😁😁😁")
    print(response.text)
