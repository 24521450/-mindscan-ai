"""Add users table and link sessions to users

Revision ID: 20260410_0003
Revises: 20260410_0002
Create Date: 2026-04-10 16:35:00

"""
from alembic import op
import sqlalchemy as sa


revision = "20260410_0003"
down_revision = "20260410_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_user_id"), "users", ["user_id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    with op.batch_alter_table("sessions", recreate="auto") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_index(op.f("ix_sessions_user_id"), ["user_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_sessions_user_id_users",
            "users",
            ["user_id"],
            ["user_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("sessions", recreate="auto") as batch_op:
        batch_op.drop_constraint("fk_sessions_user_id_users", type_="foreignkey")
        batch_op.drop_index(op.f("ix_sessions_user_id"))
        batch_op.drop_column("user_id")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_user_id"), table_name="users")
    op.drop_table("users")
