from .database import Base, SessionLocal, engine
from .seed import seed_database


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    print("Sample data is ready in the configured local database.")


if __name__ == "__main__":
    main()
