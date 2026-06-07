import os

SQLALCHEMY_DATABASE_URI = os.getenv(
    "DATABASE_URL",
    f"postgresql://{os.getenv('DB_USER','postgres')}:{os.getenv('DB_PASS','password')}@{os.getenv('DB_HOST','localhost')}/{os.getenv('DB_NAME','atlas_db')}"
)
SQLALCHEMY_TRACK_MODIFICATIONS = False
