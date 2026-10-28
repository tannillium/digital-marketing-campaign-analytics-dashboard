import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from .database import Base, SessionLocal, engine
from .routers import analytics, campaigns, keywords, reports
from .seed import seed_database

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(title="Marketing Analytics Dashboard API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")], allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type"])
app.include_router(campaigns.router)
app.include_router(keywords.router)
app.include_router(analytics.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "source": "Sample data, local database"}


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = [{"field": ".".join(str(part) for part in error["loc"]), "message": error["msg"]} for error in exc.errors()]
    logger.info("Validation failed for %s: %s", request.url.path, errors)
    return JSONResponse(status_code=422, content={"error": "Validation failed", "details": errors})


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        message = exc.detail.get("message", "Request failed")
        details = exc.detail.get("errors", [])
    else:
        message, details = str(exc.detail), []
    return JSONResponse(status_code=exc.status_code, content={"error": message, "details": details}, headers=exc.headers)


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled request error for %s", request.url.path)
    return JSONResponse(status_code=500, content={"error": "Internal server error", "details": []})


frontend_build = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend_build.exists():
    class SpaStaticFiles(StaticFiles):
        async def get_response(self, path: str, scope):
            try:
                return await super().get_response(path, scope)
            except StarletteHTTPException as exc:
                if exc.status_code == 404 and "." not in Path(path).name:
                    return await super().get_response("index.html", scope)
                raise

    app.mount("/", SpaStaticFiles(directory=frontend_build, html=True), name="frontend")
