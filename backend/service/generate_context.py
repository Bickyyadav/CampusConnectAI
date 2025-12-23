from litellm import completion, embedding, acompletion
import os
from pydantic import BaseModel

from loguru import logger
from typing import Literal, Optional


TRANSCRIPT_ANALYSIS_PROMPT = f"""You are an AI assistant that analyzes phone call transcripts. Your task is to read the transcript and produce a JSON response strictly following the schema and rules below.

                    ===========================
                    ### REQUIRED OUTPUT FORMAT
                    ===========================

                    Return a JSON object containing these fields:

                    1. "summary": string  
                    - Provide a concise and clear summary of the call.  
                    - Provide a **concise summary** of the call
                    - Clearly state whether the call outcome was:
                    - **Positive** (e.g., interest shown, appointment booked, follow-up agreed)
                    - **Negative** (e.g., not interested, call dropped, refused conversation)
                    - Mention key actions completed during the call such as:
                    - Verification
                    - Interest discussion
                    - Question handling
                    - Callback request
                    - Final decision

                    2. "quality_score": float (0.0 – 100.0)  
                        - The score is based on four weighted checks: 
                        - Score the overall call quality based on:
                        - Clarity of conversation
                        - User engagement
                        - Completion of conversation steps
                        - Smooth call handling 
                        
                    3. "intent": string
                        - Identify the primary intent or purpose of the user's call (e.g., "Inquiry about iPhone", "Scheduling an appointment").
                        - Examples:
                        - `"Inquiry about college admission"`
                        - `"Request for callback"`
                        - `"Seeking information"`
                        - `"Not interested"`
                    4. "outcome": string
                        - Describe the final result of the call (e.g., "Appointment blocked", "Information provided", "Call disconnected early").
                        - Describe the **final result** of the call
                        - Examples:
                        - `"Information provided"`
                        - `"Callback scheduled"`
                        - `"User not interested"`
                        - `"Call ended early"`
                    ===========================
                    ### TASK
                    ===========================
                    Analyze the transcript carefully and extract the required information.  
                    Ensure the final JSON strictly follows the above specification with no additional text.

"""


class AnalystResult(BaseModel):
    summary: str
    quality_score: float
    intent: str
    outcome: str


async def analyze_transcript(transcript: str) -> AnalystResult:
    """Analyze transcript"""
    try:
        # Log input transcript
        logger.info(f"📝 Analyzing transcript (length: {len(transcript)} characters)")

        response = await acompletion(
            api_key=os.getenv("GOOGLE_API_KEY"),
            model="gemini/gemini-2.5-flash",
            # model="groq/llama3-8b-8192",
            messages=[
                {"content": TRANSCRIPT_ANALYSIS_PROMPT, "role": "system"},
                {"content": transcript, "role": "user"},
            ],
            response_format=AnalystResult,
        )

        # Parse the response content as AnalystResult
        content = response.choices[0].message.content
        if isinstance(content, AnalystResult):
            result = content
        else:
            # If it's a string, try to parse it as JSON
            import json

            data = json.loads(content)
            result = AnalystResult(**data)

        # Log the generated response
        logger.info(f"✅ Transcript analysis completed successfully")
        logger.info(f"📊 Generated response: {result}")

        return result

    except Exception as e:
        logger.error(f"❌ Error analyzing transcript: {e}")
        # Return a default result if analysis fails
        default_result = AnalystResult(
            summary="Analysis failed",
            quality_score=0.0,
            intent="Unknown",
            outcome="Unknown",
        )
        logger.error(f"🔄 Returning default result due to error: {default_result}")
        return default_result


if __name__ == "__main__":
    import asyncio

    asyncio.run(
        analyze_transcript(
            "Hey do you guys sell the iphone i am interested to purchase"
        )
    )
