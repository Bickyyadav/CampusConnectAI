# ==========================================
# Stage 1: Builder
# Use the official 'uv' image which comes with Python and uv pre-installed.
# We use the 'bookworm-slim' variant for a balance of stability and size.
# ==========================================
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

# Set environment variables for uv to ensure consistent behavior
# UV_COMPILE_BYTECODE=1: Compiles Python files to .pyc for faster startup
# UV_LINK_MODE=copy: Copies files instead of using hardlinks (safer for Docker)
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definition files first.
# This leverages Docker's layer caching: if these files don't change,
# Docker skips the installation step, speeding up builds.
# COPY pyproject.toml uv.lock ./

# Install dependencies into a virtual environment.
# --frozen: Ensures we install exactly what's in uv.lock
# --no-install-project: We only want dependencies for now, not our app code
# --no-dev: Exclude development dependencies (like testing tools) to keep image small
RUN uv sync --frozen --no-install-project --no-dev

# ==========================================
# Stage 2: Runner
# Use a lightweight standard Python image for the final runtime.
# This effectively discards all build tools (uv, compilers) from the previous stage.
# ==========================================
FROM python:3.12-slim-bookworm

# Set the working directory for the application
WORKDIR /app

# Copy the virtual environment created in the builder stage.
# This contains all our installed libraries.
COPY --from=builder /app/.venv /app/.venv

# Add the virtual environment's bin directory to the system PATH.
# This ensures that when we run 'python' or 'uvicorn', it uses the versions
# from our virtual environment automatically.
ENV PATH="/app/.venv/bin:$PATH"

# Copy the rest of the application source code into the container.
COPY . .

# Expose port 8000 to allow external access to the FastAPI app.
EXPOSE 8000

# Define the command to run the application.
# We run main.py directly because your code includes:
# if __name__ == "__main__": uvicorn.run(...)
CMD ["python", "main.py"]
