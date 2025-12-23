from litellm import completion, embedding, acompletion
import os
from pydantic import BaseModel

from loguru import logger
from typing import Literal, Optional


TRANSCRIPT_ANALYSIS_PROMPT = f"""#  Call Transcript Analysis Prompt

                            You are an **AI assistant specialized in analyzing phone call transcripts**.

                            Your task is to carefully read the provided transcript and generate a **JSON response** that strictly follows the rules and schema defined below.

                            ---

                            ##  IMPORTANT RULES (NON-NEGOTIABLE)

                            - Output **ONLY valid JSON**
                            - Do **NOT** add explanations, comments, or extra text
                            - Follow the schema **exactly**
                            - Do not change field names
                            - Do not include markdown, code blocks, or prose in the final output
                            - Values must be realistic and derived strictly from the transcript

                            ---

                            ##  REQUIRED OUTPUT FORMAT

                            Return a **single JSON object** with the following fields:

                            ### 1️ `summary` (string)
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

                            ---

                            ### 2️ `quality_score` (float: 0.0 – 100.0)
                            - Score the overall call quality based on:
                            - Clarity of conversation
                            - User engagement
                            - Completion of conversation steps
                            - Smooth call handling
                            - The score **must be a decimal number**
                            - Example: `72.5`

                            ---

                            ### 3️ `intent` (string)
                            - Identify the **primary intent** of the user
                            - Examples:
                            - `"Inquiry about college admission"`
                            - `"Request for callback"`
                            - `"Seeking information"`
                            - `"Not interested"`

                            ---

                            ### 4️ `outcome` (string)
                            - Describe the **final result** of the call
                            - Examples:
                            - `"Information provided"`
                            - `"Callback scheduled"`
                            - `"User not interested"`
                            - `"Call ended early"`

                            ---

                            ##  ANALYSIS TASK

                            - Read the transcript thoroughly
                            - Infer intent from user responses
                            - Determine engagement level
                            - Identify whether the conversation progressed or stopped early
                            - Assign a realistic quality score
                            - Produce a **clean, strict JSON output**

                            ---

                            ##  OUTPUT EXAMPLE (FORMAT ONLY)

                            {
                            "summary": "The call was positive. The user discussed interest in studying in India, asked about colleges, and agreed to a follow-up call.",
                            "quality_score": 78.5,
                            "intent": "Inquiry about college admission",
                            "outcome": "Information provided and follow-up agreed"
                            }

                            ---

                            ##  DO NOT
                            - Add markdown formatting in the output
                            - Include explanations
                            - Repeat the transcript
                            - Add fields not listed above

                            ---

                            **Now analyze the provided transcript and return the JSON output accordingly.**


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
