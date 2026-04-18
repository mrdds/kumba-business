from ninja_extra import api_controller, route
from ninja import Schema
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from typing import List, Optional
from datetime import date
from django.shortcuts import get_object_or_404
from .models import TontineGroup, TontineMember, Contribution
from django.db import transaction

class GroupCreateSchema(Schema):
    name: str
    contribution_amount: float
    frequency: str # 'WEEKLY' or 'MONTHLY'
    start_date: date

class GroupOutSchema(Schema):
    id: int
    name: str
    contribution_amount: float
    frequency: str
    start_date: date
    is_active: bool

class MemberCreateSchema(Schema):
    name: str
    phone: Optional[str] = None

class MemberOutSchema(Schema):
    id: int
    name: str
    phone: Optional[str] = None

class ContributionSchema(Schema):
    member_id: int
    date: date
    amount: float
    status: str # 'PAID' or 'MISSED'

@api_controller('/tontines', tags=['Tontines'], auth=KumbaJWTAuth())
class TontineController:
    # --- Groups ---
    @route.get('', response=List[GroupOutSchema])
    def list_groups(self, request):
        return TontineGroup.objects.filter(company=request.user.company, is_active=True)

    @route.post('', response={201: GroupOutSchema})
    def create_group(self, request, payload: GroupCreateSchema):
        group = TontineGroup.objects.create(
            company=request.user.company,
            **payload.dict()
        )
        return 201, group
    
    # --- Members ---
    @route.get('/{group_id}/members', response=List[MemberOutSchema])
    def list_members(self, request, group_id: int):
        group = get_object_or_404(TontineGroup, id=group_id, company=request.user.company)
        return group.members.all()

    @route.post('/{group_id}/members', response={201: MemberOutSchema})
    def add_member(self, request, group_id: int, payload: MemberCreateSchema):
        group = get_object_or_404(TontineGroup, id=group_id, company=request.user.company)
        member = TontineMember.objects.create(group=group, **payload.dict())
        return 201, member

    # --- Contributions ---
    @route.post('/{group_id}/contribute', response={201: dict})
    def record_contribution(self, request, group_id: int, payload: ContributionSchema):
        group = get_object_or_404(TontineGroup, id=group_id, company=request.user.company)
        member = get_object_or_404(TontineMember, id=payload.member_id, group=group)
        
        Contribution.objects.create(
            member=member,
            date=payload.date,
            amount=payload.amount,
            status=payload.status
        )
        return 201, {"message": "Contribution recorded"}
    
    @route.get('/{group_id}/contributions', response=List[dict])
    def list_contributions(self, request, group_id: int):
        # Returns a flat list of all contributions for the group
        # Real-world usage would likely pivot this data or paginate it
        group = get_object_or_404(TontineGroup, id=group_id, company=request.user.company)
        contribs = Contribution.objects.filter(member__group=group).order_by('-date')
        return [{"member": c.member.name, "amount": c.amount, "date": c.date, "status": c.status} for c in contribs]
