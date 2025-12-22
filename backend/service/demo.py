from litellm import completion, embedding, acompletion
import os
from pydantic import BaseModel
from config.settings import settings
from loguru import logger
from typing import Literal, Optional
from datetime import datetime, timedelta, timezone

gst = timezone(timedelta(hours=4))

now_gst = datetime.now(gst)

TRANSCRIPT_ANALYSIS_PROMPT = f"""You are an AI assistant that analyzes phone call transcripts. Your task is to read the transcript and produce a JSON response strictly following the schema and rules below.

===========================
### REQUIRED OUTPUT FORMAT
===========================

Return a JSON object containing these fields:

1. "summary": string  
   - Provide a concise and clear summary of the call.  
   - State whether the outcome was positive (e.g., booking confirmed, customer interested) or negative (e.g., lead dropped, customer not interested).  
   - Mention key steps completed such as verification, DBR discussion, question handling, and the final outcome.

2. "quality_score": float (0.0 – 10.0)  
   - The score is based on four weighted checks:  
     - Verification of customer name completed → 2.5  
     - DBR calculation discussed → 2.5  
     - Customer questions addressed → 2.5  
     - Appointment booking attempted or completed → 2.5  
   - Add up the points earned and return the total score.

3. "customer_intent": string  
   - Capture the customer's intent using concise keywords.  
   - Include the type of request (e.g., inquiry, booking, callback, reschedule).  
   - Include the overall status (e.g., lead, dropped, in_process, call_me_later).

4. "final_status": string  
   Must be EXACTLY one of the following:  
   - "Not interested"  
   - "Not eligible"  
   - "Call Back"  
   - "Interested"  
   - "Appointment scheduled"

5. "callback_time": string  
   - Include ONLY if the call ends with a callback request.  
   - If the user gives a date/time, return that exact value.  
   - If the user does NOT give a time, return:  
     
       "current_date": {now_gst.strftime("%Y-%m-%d")},
       "current_time": {now_gst.strftime("%H:%M:%S")}, 
    
     using the current GST time.

6. "appointment_scheduled_time": string  
   - Include ONLY if an appointment was scheduled.  
   - If the user gives a specific date/time, return that exact value eg: 20 third 23 .  
   - If no appointment time is mentioned, DO NOT include this field.

===========================
### TASK
===========================
Analyze the transcript carefully and extract the required information.  
Ensure the final JSON strictly follows the above specification with no additional text.

"""


class AnalystResult(BaseModel):
    summary: str
    quality_score: float
    customer_intent: str
    final_status: Literal[
        "Not interested",
        "Not eligible",
        "Call Back",
        "Interested",
        "Appointment scheduled"
    ]
    callback_time: Optional[str] = None  # ISO datetime or natural language
    appointment_scheduled_time: Optional[str] = None  # ISO datetime or natural language

async def analyze_transcript(transcript: str) -> AnalystResult:
    """Analyze transcript"""
    try:
        # Log input transcript
        logger.info(f"📝 Analyzing transcript (length: {len(transcript)} characters)")
    

        response = await acompletion(
            api_key=settings.OpenRouter_API_KEY,
            model="openrouter/openai/gpt-5-nano",
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
            summary="Analysis failed", quality_score=0.0, customer_intent="unknown", final_status="Not interested"
        )
        logger.error(f"🔄 Returning default result due to error: {default_result}")
        return default_result