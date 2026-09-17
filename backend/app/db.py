from collections.abc import Iterator

from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "sqlite:///./data/infopay.db"

# check_same_thread=False : nécessaire car FastAPI peut appeler depuis
# différents threads (workers async)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_db() -> None:
    # Import explicite pour que SQLModel connaisse la table avant create_all
    from app.models.payslip import Payslip  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
