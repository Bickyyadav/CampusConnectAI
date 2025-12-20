#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import os
import sys

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
)
from prompt_data import system_prompt
from pipecat.transcriptions.language import Language
from pipecat.frames.frames import (
    EndTaskFrame,
    LLMRunFrame,
    TTSSpeakFrame,
)
from pipecat.processors.transcript_processor import TranscriptProcessor
from deepgram import (
    LiveOptions,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer

from pipecat.services.deepgram.tts import DeepgramTTSService
# from pipecat.services.elevenlabs.tts import ElevenLabsTTSService

# from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.transports.base_transport import BaseTransport
from pipecat.services.openrouter.llm import OpenRouterLLMService

# from pipecat.services.google.llm import GoogleLLMService
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)
from starlette.websockets import WebSocketDisconnect
from pipecat.processors.audio.audio_buffer_processor import AudioBufferProcessor
from service.bot import save_recording
from service.generate_context import summarize_conversation_with_llm
from prompt_data import get_prompt
from models.user import User

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")

async def run_bot(transport: BaseTransport, handle_sigint: bool, call_data: dict):
    print("🔴🔴🔴🔴🔴🔴🔴🔴🔴👌👌👌👌💦💦")
    print(call_data)
    llm = OpenRouterLLMService(
        api_key=os.getenv("OPEN_ROUTER_API_KEY"),
        model="meta-llama/llama-3.3-70b-instruct:free",
        # model="meta-llama/llama-3.2-3b-instruct:free",
    )
    # llm = GoogleLLMService(
    #     api_key=os.getenv("GOOGLE_API_KEY"),
    # )

    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_api_key:
        raise RuntimeError(
            "Missing DEEPGRAM_API_KEY environment variable for Deepgram STT"
        )

    stt = DeepgramSTTService(
        api_key=deepgram_api_key,
        live_options=LiveOptions(language=Language.EN),
    )

    tts = DeepgramTTSService(
        api_key=deepgram_api_key,
        live_options=LiveOptions(language=Language.HI),
        voice_id="f91ab3e6-5071-4e15-b016-cde6f2bcd222",
    )

    # tts = ElevenLabsTTSService(
    #     api_key=os.getenv("ELEVEN_LABS_API_KEY"),
    #     live_options=LiveOptions(language=Language.EN),
    #     voice_id="FGY2WhTYpPnrIDTdsKH5",
    # )

    # tts = CartesiaTTSService(
    #     api_key=os.getenv("CARTESIA_API_KEY"),
    #     voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",  # British Reading Lady
    # )

    
    # Fetch user name from DB
    call_id = call_data.get("call_id")
    user_name = "bicky" # Default name
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

    context = LLMContext(messages)
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
            transport.output(),  # Websocket output to client
            audio_buffer,
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
    transcript_history: list[dict[str, str]] = []


    async def call_end_function():
        await task.cancel()
        print("🔴🔴🔴🔴🔴🔴")
        summary = await summarize_conversation_with_llm(transcript_history)
        logger.info("Call summary: %s", summary["summary_line"])
        logger.info(
            "Interest to book specialist: %s%%",
            summary["interest_percentage"],
        )
        print(
            f"Call summary → {summary['summary_line']} | Interest: {summary['interest_percentage']}%"
        )
        return summary

    @transcript.event_handler("on_transcript_update")
    async def on_transcript_update(processor, frame):
        for message in frame.messages:
            transcript_history.append({"role": message.role, "content": message.content})
   
    @audio_buffer.event_handler("on_audio_data")
    async def on_audio_data(buffer, audio: bytes, sample_rate: int, num_channels: int):
        # Buffer audio data for later upload
        await save_recording(buffer, audio, sample_rate, num_channels, call_id)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        # Kick off the outbound conversation, waiting for the user to speak first
        await audio_buffer.start_recording()
        await task.queue_frames([LLMRunFrame()])
        logger.info("Starting outbound call conversation")

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Outbound call ended")
        # this is for summarizing the text what is the conversation is happening between user and bot
        summary = await call_end_function()

        transcript_file = os.path.join(os.getcwd(), "transcript.txt")
        try:
            with open(transcript_file, "w", encoding="utf-8") as fp:
                for entry in transcript_history:
                    fp.write(f"{entry['role']}: {entry['content']}\n")
                fp.write(f"Summary: {summary['summary_line']}\n")
                fp.write(f"Interest Percentage: {summary['interest_percentage']}%\n")
            logger.info(f"Transcript saved to {transcript_file}")
            print(f"Transcript saved to {transcript_file}")
        except Exception as exc:
            logger.error(f"Failed to write transcript: {exc}")
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

    # Access custom stream parameters passed from TwiML
    # Use the body data to personalize the conversation
    # by loading customer data based on the to_number or from_number
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
