"""Initial schema

Revision ID: 20260410_0001
Revises: 
Create Date: 2026-04-10 15:10:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260410_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("session_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("session_id"),
    )

    op.create_table(
        "responses",
        sa.Column("response_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.String(length=36), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(length=50), nullable=True),
        sa.Column("anxiety_level", sa.Float(), nullable=True),
        sa.Column("depression", sa.Float(), nullable=True),
        sa.Column("self_esteem", sa.Float(), nullable=True),
        sa.Column("mental_health_history", sa.Integer(), nullable=True),
        sa.Column("blood_pressure", sa.Integer(), nullable=True),
        sa.Column("sleep_quality", sa.Float(), nullable=True),
        sa.Column("headache", sa.Float(), nullable=True),
        sa.Column("breathing_problem", sa.Float(), nullable=True),
        sa.Column("study_load", sa.Float(), nullable=True),
        sa.Column("academic_performance", sa.Float(), nullable=True),
        sa.Column("teacher_student_relationship", sa.Float(), nullable=True),
        sa.Column("future_career_concerns", sa.Float(), nullable=True),
        sa.Column("social_support", sa.Float(), nullable=True),
        sa.Column("peer_pressure", sa.Float(), nullable=True),
        sa.Column("extracurricular_activities", sa.Float(), nullable=True),
        sa.Column("bullying", sa.Float(), nullable=True),
        sa.Column("noise_level", sa.Float(), nullable=True),
        sa.Column("living_conditions", sa.Float(), nullable=True),
        sa.Column("safety", sa.Float(), nullable=True),
        sa.Column("basic_needs", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.session_id"]),
        sa.PrimaryKeyConstraint("response_id"),
    )
    op.create_index(op.f("ix_responses_response_id"), "responses", ["response_id"], unique=False)

    op.create_table(
        "predictions",
        sa.Column("pred_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("response_id", sa.Integer(), nullable=True),
        sa.Column("stress_level", sa.Integer(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["response_id"], ["responses.response_id"]),
        sa.PrimaryKeyConstraint("pred_id"),
    )
    op.create_index(op.f("ix_predictions_pred_id"), "predictions", ["pred_id"], unique=False)

    op.create_table(
        "recommendations",
        sa.Column("reco_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pred_id", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["pred_id"], ["predictions.pred_id"]),
        sa.PrimaryKeyConstraint("reco_id"),
    )
    op.create_index(op.f("ix_recommendations_reco_id"), "recommendations", ["reco_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recommendations_reco_id"), table_name="recommendations")
    op.drop_table("recommendations")

    op.drop_index(op.f("ix_predictions_pred_id"), table_name="predictions")
    op.drop_table("predictions")

    op.drop_index(op.f("ix_responses_response_id"), table_name="responses")
    op.drop_table("responses")

    op.drop_table("sessions")
