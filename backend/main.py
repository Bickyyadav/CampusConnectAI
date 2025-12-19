

import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from loguru import logger
from server_utils import (
    DialoutResponse,
    dialout_request_from_request,
    generate_twiml,
    make_twilio_call,
    parse_twiml_request,
    DialoutRequest,
)
from excel_utils import parse_excel_file

load_dotenv(override=True)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from core.database import init_db
from routers.user import router as user_router
from routers.health import health_router

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(health_router)
app.include_router(user_router)


@app.post("/start", response_model=DialoutResponse)
async def handle_dialout_request(request: Request) -> DialoutResponse:
    """Handle outbound call request and initiate call via Twilio.

    Args:
        request (Request): FastAPI request containing JSON with 'to_number' and 'from_number'.

    Returns:
        DialoutResponse: Response containing call_sid, status, and to_number.

    Raises:
        HTTPException: If request data is invalid or missing required fields.
    """
    logger.info("Received outbound call request")

    dialout_request = await dialout_request_from_request(request)

    call_result = await make_twilio_call(dialout_request)

    return DialoutResponse(
        call_sid=call_result.call_sid,
        status="call_initiated",
        to_number=call_result.to_number,
    )

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    """
    Upload an Excel file, parse content, and initiate calls.
    Expects columns: name, phoneno, email
    """
    logger.info(f"Received file upload: {file.filename}")
    
    # Read the file content
    content = await file.read()
    
    # Parse the excel file
    data = parse_excel_file(content)
    print("😉😉😉😉")
    print(f"Data: {data}")
    
    # Get from_number from env
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    if not from_number:
        logger.error("TWILIO_FROM_NUMBER not set in environment")
        return JSONResponse(
            status_code=500, 
            content={"message": "Server misconfiguration: TWILIO_FROM_NUMBER not set", "data": data}
        )
        
    results = []
    
    for row in data:
        to_number = row.get("phoneno")
        # Ensure number passes basic validity check (e.g. not None)
        # Detailed validation handled by Twilio or make_twilio_call logic
        
        if to_number:
            try:
                # Need to cast to string just in case pandas inferred int
                to_number = str(to_number).strip()
                
                if not to_number.startswith("+"):
                    to_number = f"+91{to_number}"
                
                dialout_req = DialoutRequest(to_number=to_number, from_number=from_number)
                call_result = await make_twilio_call(dialout_req)
                
                results.append({
                    "name": row.get("name"),
                    "phoneno": to_number,
                    "status": "initiated",
                    "call_sid": call_result.call_sid
                })
            except Exception as e:
                logger.error(f"Failed to initiate call to {to_number}: {e}")
                results.append({
                    "name": row.get("name"),
                    "phoneno": to_number,
                    "status": "failed",
                    "error": str(e)
                })
        else:
             results.append({
                    "name": row.get("name"),
                    "phoneno": None,
                    "status": "skipped",
                    "error": "No phone number"
                })

    return JSONResponse(content={"results": results, "data": data})



@app.post("/twiml")
async def get_twiml(request: Request) -> HTMLResponse:
    """Return TwiML instructions for connecting call to WebSocket.

    This endpoint is called by Twilio when a call is initiated. It returns TwiML
    that instructs Twilio to connect the call to our WebSocket endpoint with
    stream parameters containing call metadata.

    Args:
        request (Request): FastAPI request containing Twilio form data with 'To' and 'From'.

    Returns:
        HTMLResponse: TwiML XML response with Stream connection instructions.
    """
    logger.info("Serving TwiML for outbound call")

    twiml_request = await parse_twiml_request(request)

    twiml_content = generate_twiml(twiml_request)
    

    return HTMLResponse(content=twiml_content, media_type="application/xml")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connection from Twilio Media Streams.

    This endpoint receives the WebSocket connection from Twilio's Media Streams
    and runs the bot to handle the voice conversation. Stream parameters passed
    from TwiML are available to the bot for customization.

    Args:
        websocket (WebSocket): FastAPI WebSocket connection from Twilio.
    """
    from bot import bot
    from pipecat.runner.types import WebSocketRunnerArguments

    await websocket.accept()
    logger.info("WebSocket connection accepted for outbound call")

    try:
        runner_args = WebSocketRunnerArguments(websocket=websocket)
        await bot(runner_args)
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint: {e}")
        await websocket.close()


if __name__ == "__main__":
    # Run the server
    port = int(os.getenv("PORT", "7860"))
    logger.info(f"Starting Twilio outbound chatbot server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
