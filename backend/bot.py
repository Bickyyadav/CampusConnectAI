#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import os
import sys

from dotenv import load_dotenv
from loguru import logger
import asyncio
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
)
from pipecat.processors.frame_processor import FrameDirection
from pipecat.transcriptions.language import Language
from pipecat.frames.frames import (
    EndTaskFrame,
    LLMRunFrame,
    TTSSpeakFrame,
)
from pipecat.adapters.schemas.tools_schema import ToolsSchema, FunctionSchema
from pipecat.processors.transcript_processor import TranscriptProcessor
from deepgram import (
    LiveOptions,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer

from pipecat.services.deepgram.tts import DeepgramTTSService

# from pipecat.services.elevenlabs.tts import ElevenLabsTTSService

from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.transports.base_transport import BaseTransport

# from pipecat.services.openrouter.llm import OpenRouterLLMService
from pipecat.services.groq.llm import GroqLLMService

# from pipecat.services.google.llm import GoogleLLMService

from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)
from starlette.websockets import WebSocketDisconnect
from pipecat.processors.audio.audio_buffer_processor import AudioBufferProcessor
from service.bot import save_recording

from prompt_data import get_prompt
from models.user import User, CallStatus
from datetime import datetime, timedelta

load_dotenv(override=True)


try:
    logger.remove(0)
except ValueError:
    pass
logger.add(sys.stdout, level="DEBUG")


from pipecat.services.llm_service import FunctionCallParams


async def run_bot(transport: BaseTransport, handle_sigint: bool, call_data: dict):

    # llm = OpenRouterLLMService(
    #     api_key=os.getenv("OPEN_ROUTER_API_KEY"),
    #     model="meta-llama/llama-3.3-70b-instruct:free",
    #     # model="meta-llama/llama-3.2-3b-instruct:free",
    # )
    llm = GroqLLMService(api_key=os.getenv("GROQ_API_KEY"), model="openai/gpt-oss-120b")

    # llm = GoogleLLMService(
    #     api_key=os.getenv("GOOGLE_API_KEY"),
    # )

    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_api_key:
        raise RuntimeError(
            "Missing DEEPGRAM_API_KEY environment variable for Deepgram STT"
        )
    call_id = call_data["call_id"]
    transcript_history: list[dict[str, str]] = []

    stt = DeepgramSTTService(
        api_key=deepgram_api_key,
        live_options=LiveOptions(language=Language.EN_IN),
    )

    # tts = DeepgramTTSService(
    #     api_key=deepgram_api_key,
    #     live_options=LiveOptions(language=Language.EN_IN),
    #     voice_id="f91ab3e6-5071-4e15-b016-cde6f2bcd222",
    # )

    # tts = ElevenLabsTTSService(
    #     api_key=os.getenv("ELEVEN_LABS_API_KEY"),
    #     live_options=LiveOptions(language=Language.EN),
    #     voice_id="FGY2WhTYpPnrIDTdsKH5",
    # )

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="95d51f79-c397-46f9-b49a-23763d3eaa2d",  # British Reading Lady
    )

    from service.generate_context import analyze_transcript

    async def schedule_callback_function(params: FunctionCallParams):
        """Schedule a callback when user requests it."""
        try:
            delay = params.arguments.get("minutes_delay", 10)
            if isinstance(delay, str):
                delay = int(delay)

            future_time = datetime.utcnow() + timedelta(minutes=delay)

            if call_id:
                user = await User.find_one(User.call_sid == call_id)
                if user:
                    user.status = CallStatus.SCHEDULED
                    user.time_to_call = future_time
                    await user.save()
                    final_transcript = " ".join(transcript_history)
                    analyst_result = await analyze_transcript(final_transcript)
            if call_id:
                try:
                    user = await User.find_one(User.call_sid == call_id)
                    if user:
                        user.Transcript = final_transcript
                        user.Analysis = analyst_result.summary
                        # Cast float score to int to match model definition
                        user.Quality_Score = int(analyst_result.quality_score)
                        user.Intent = analyst_result.intent
                        user.Outcome = analyst_result.outcome
                        await user.save()
                        logger.info(
                            f"Saved analysis for call {call_id}: Score {user.Quality_Score}"
                        )
                    else:
                        logger.warning(
                            f"User not found for call {call_id} to save analysis"
                        )
                except Exception as e:
                    logger.error(f"Error saving analysis to DB: {e}")
                    logger.info(
                        f"Scheduled callback for {user.name} at {future_time} (delay: {delay} min)"
                    )

            # Simple heuristic for friendlier message
            if delay >= 1440:  # 1 day
                days = delay // 1440
                msg = f"Okay, I have scheduled a callback in {days} day{'s' if days > 1 else ''}."
            elif delay >= 60:
                hours = delay // 60
                msg = f"Okay, I have scheduled a callback in {hours} hour{'s' if hours > 1 else ''}."
            else:
                msg = f"Okay, I have scheduled a callback in {delay} minutes."

            await params.llm.push_frame(TTSSpeakFrame(f"{msg} Goodbye!"))
            await params.llm.push_frame(EndTaskFrame(), FrameDirection.UPSTREAM)
            await params.result_callback({"status": "scheduled"})
        except Exception as e:
            logger.error(f"Error scheduling callback: {e}")
            await params.result_callback({"status": "error", "error": str(e)})

    llm.register_function("schedule_callback", schedule_callback_function)

    schedule_callback_schema = FunctionSchema(
        name="schedule_callback",
        description="Schedule a callback invocation. If the user provides a natural language time (e.g., 'tomorrow', 'in 2 hours'), YOU MUST calculate and pass the total duration in MINUTES as the 'minutes_delay' argument. E.g., 'tomorrow' -> 1440, '2 hours' -> 120.",
        properties={
            "minutes_delay": {
                "type": "integer",
                "description": "The delay in minutes to wait before calling back. CALCULATED BY AI from user's request.",
            },
        },
        required=["minutes_delay"],
    )

    restaurant_function = FunctionSchema(
        name="get_restaurant_recommendation",
        description="Get a restaurant recommendation",
        properties={
            "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA",
            },
        },
        required=["location"],
    )

    end_call_schema = FunctionSchema(
        name="end_call",
        description="End the conversation and hang up the call when the user requests to end it",
        properties={},
        required=[],
    )

    tools = ToolsSchema(
        standard_tools=[restaurant_function, schedule_callback_schema, end_call_schema]
    )

    # Fetch user name from DB
    call_id = call_data.get("call_id")
    user_name = "abc"  # Default name
    if call_id:
        try:
            user = await User.find_one(User.call_sid == call_id)
            if user and user.name:
                user_name = user.name
                logger.info(f"Found user {user_name} for call {call_id}")
            else:
                logger.warning(f"No user found for call {call_id}, using default")
        except Exception as e:
            logger.error(f"Error fetching user for call {call_id}: {e}")

    messages = [
        {"role": "system", "content": get_prompt(user_name)},
    ]

    context = LLMContext(messages, tools)
    context_aggregator = LLMContextAggregatorPair(context)
    audio_buffer = AudioBufferProcessor(
        sample_rate=None,
        num_channels=2,
        buffer_size=0,
        enable_turn_audio=False,
    )

    transcript = TranscriptProcessor()

    pipeline = Pipeline(
        [
            transport.input(),  # Websocket input from client
            stt,  # Speech-To-Text
            transcript.user(),
            context_aggregator.user(),
            llm,  # LLM
            tts,  # Text-To-Speech
            transcript.assistant(),
            audio_buffer,
            transport.output(),  # Websocket output to client
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=8000,
            audio_out_sample_rate=8000,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    call_id = call_data["call_id"]

    async def call_end_function():
        await task.cancel()
        summary = await summarize_conversation_with_llm(transcript_history)
        logger.info("Call summary: %s", summary["summary_line"])
        logger.info(
            "Interest to book specialist: %s%%",
            summary["interest_percentage"],
        )
        return summary

    async def end_call_function(params: FunctionCallParams):
        await params.llm.push_frame(TTSSpeakFrame("Goodbye! Ending the call now."))
        await call_end_function()
        await params.result_callback({"status": "call_ended"})

    llm.register_function("end_call", end_call_function)

    @transcript.event_handler("on_transcript_update")
    async def on_transcript_update(processor, frame):
        for message in frame.messages:
            transcript_history.append(f"{message.role}: {message.content}")

    @audio_buffer.event_handler("on_audio_data")
    async def on_audio_data(buffer, audio: bytes, sample_rate: int, num_channels: int):
        # Buffer audio data for later upload
        await save_recording(buffer, audio, sample_rate, num_channels, call_id)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        # Kick off the outbound conversation, waiting for the user to speak first
        await audio_buffer.start_recording()
        await asyncio.sleep(1.0)
        await task.queue_frames([LLMRunFrame()])
        logger.info("Starting outbound call conversation")

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Outbound call ended")
        # this is for summarizing the text what is the conversation is happening between user and bot
        final_transcript = " ".join(transcript_history)
        from service.generate_context import analyze_transcript

        analyst_result = await analyze_transcript(final_transcript)

        if call_id:
            try:
                user = await User.find_one(User.call_sid == call_id)
                if user:
                    user.Transcript = final_transcript
                    user.Analysis = analyst_result.summary
                    # Cast float score to int to match model definition
                    user.Quality_Score = int(analyst_result.quality_score)
                    user.Intent = analyst_result.intent
                    user.Outcome = analyst_result.outcome
                    await user.save()
                    logger.info(
                        f"Saved analysis for call {call_id}: Score {user.Quality_Score}"
                    )
                else:
                    logger.warning(
                        f"User not found for call {call_id} to save analysis"
                    )
            except Exception as e:
                logger.error(f"Error saving analysis to DB: {e}")

        await task.cancel()

    runner = PipelineRunner(handle_sigint=handle_sigint)

    try:
        await runner.run(task)
    except WebSocketDisconnect:
        logger.info("Websocket disconnected; stopping pipeline cleanly")


async def bot(runner_args: RunnerArguments):
    """Main bot entry point compatible with Pipecat Cloud."""
    transport_type, call_data = await parse_telephony_websocket(runner_args.websocket)
    logger.info(f"Auto-detected transport: {transport_type}")

    body_data = call_data.get("body", {})
    to_number = body_data.get("to_number")
    from_number = body_data.get("from_number")

    logger.info(f"Call metadata - To: {to_number}, From: {from_number}")

    serializer = TwilioFrameSerializer(
        stream_sid=call_data["stream_id"],
        call_sid=call_data["call_id"],
        account_sid=os.getenv("TWILIO_ACCOUNT_SID", ""),
        auth_token=os.getenv("TWILIO_AUTH_TOKEN", ""),
    )

    transport = FastAPIWebsocketTransport(
        websocket=runner_args.websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            # vad_analyzer=_build_vad_analyzer(),
            vad_analyzer=SileroVADAnalyzer(),
            serializer=serializer,
        ),
    )

    handle_sigint = runner_args.handle_sigint

    await run_bot(transport, handle_sigint, call_data)
