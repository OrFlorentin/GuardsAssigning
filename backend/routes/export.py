import datetime

from fastapi import APIRouter, Depends
from icalendar import Calendar, Event
from starlette.responses import StreamingResponse

from models.shift_type import ShiftTypeModel
from models.structs import Date
from models.user import UserModel
from routes.shifts import get_shifts
from utils.authorization_utils import get_active_user

router = APIRouter(prefix="/export", tags=["Exports"], dependencies=[Depends(get_active_user)])


@router.get("/ics")
async def get_ics(start_date: Date,
                  end_date: Date,
                  user: UserModel = Depends(get_active_user)):
    guard_shifts = await get_shifts(start_date=start_date, end_date=end_date, user_id=user.id)

    # TODO: Filter only needed shift types based on guard's shifts
    shift_types_list = await ShiftTypeModel.find_all().to_list()
    shift_types = {shift_type.id: shift_type for shift_type in shift_types_list}

    calendar = Calendar()
    for shift in guard_shifts:
        event = Event()
        event.add('summary', shift_types[shift.shift_type].name)
        event.add('dtstart', shift.date)
        # TODO: Have better shift times
        event.add('dtend', shift.date + datetime.timedelta(hours=2))

        calendar.add_component(event)

    def get_response():
        yield calendar.to_ical()

    return StreamingResponse(get_response(), media_type="text/calendar")
