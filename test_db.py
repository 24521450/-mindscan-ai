import asyncio
import traceback
from backend.database import engine, Base
from backend.models import Session, Response
from backend.schemas import SurveyInput
from backend.tests.fixtures_loader import get_case

async def test():
    try:
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        
        async with async_session() as db:
            new_session = Session()
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)
            
            survey = SurveyInput(**get_case("baseline_medium")["input"])
            
            new_response = Response(
                session_id=new_session.session_id,
                age=survey.age,
                gender=survey.gender,
                anxiety_level=survey.anxiety_level,
                depression=survey.depression,
                self_esteem=survey.self_esteem,
                mental_health_history=survey.mental_health_history,
                blood_pressure=survey.blood_pressure,
                sleep_quality=survey.sleep_quality,
                headache=survey.headache,
                breathing_problem=survey.breathing_problem,
                study_load=survey.study_load,
                academic_performance=survey.academic_performance,
                teacher_student_relationship=survey.teacher_student_relationship,
                future_career_concerns=survey.future_career_concerns,
                social_support=survey.social_support,
                peer_pressure=survey.peer_pressure,
                extracurricular_activities=survey.extracurricular_activities,
                bullying=survey.bullying,
                noise_level=survey.noise_level,
                living_conditions=survey.living_conditions,
                safety=survey.safety,
                basic_needs=survey.basic_needs
            )
            db.add(new_response)
            await db.flush()
            print("DB INSERT SUCCESS!")
    except Exception as e:
        traceback.print_exc()

asyncio.run(test())
