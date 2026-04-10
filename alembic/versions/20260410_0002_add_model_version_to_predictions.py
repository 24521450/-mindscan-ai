"""Add model_version to predictions

Revision ID: 20260410_0002
Revises: 20260410_0001
Create Date: 2026-04-10 16:05:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260410_0002"
down_revision = "20260410_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "predictions",
        sa.Column("model_version", sa.String(length=64), nullable=False, server_default="v1.0.0-legacy"),
    )


def downgrade() -> None:
    op.drop_column("predictions", "model_version")
