import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

# Use an environment variable for the Database URL
# Example format: mysql+aiomysql://user:password@hostname:3306/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mindscan_ai.db")


def get_sync_database_url(url: str | None = None) -> str:
    """Map async driver URLs to sync URLs for Alembic migrations."""
    u = (url or DATABASE_URL).strip()
    if "+aiosqlite" in u:
        return u.replace("sqlite+aiosqlite", "sqlite", 1)
    if "+aiomysql" in u:
        return u.replace("+aiomysql", "+pymysql", 1)
    return u


engine = create_async_engine(DATABASE_URL, echo=True)

# Create a customized Session class
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

# Dependency to get DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
