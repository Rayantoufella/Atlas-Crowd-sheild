import os

SQLALCHEMY_DATABASE_URI = os.getenv(
    "DATABASE_URL",
    f"postgresql://{os.getenv('DB_USER','postgres')}:{os.getenv('DB_PASS','password')}@{os.getenv('DB_HOST','localhost')}/{os.getenv('DB_NAME','atlas_db')}"
)

# Render/Heroku exposent parfois l'URL en "postgres://" — SQLAlchemy 2.x exige
# "postgresql://". On normalise pour éviter un échec au démarrage en prod.
if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace(
        "postgres://", "postgresql://", 1
    )

SQLALCHEMY_TRACK_MODIFICATIONS = False
