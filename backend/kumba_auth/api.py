from ninja_extra import api_controller, http_post, route, ControllerBase
from ninja import Schema
from ninja_jwt.schema import TokenObtainPairInputSchema, TokenRefreshInputSchema
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_extra.permissions import AllowAny
from .models import Presence
from datetime import date, datetime, time
import math
from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from typing import List, Optional

class CheckInSchema(Schema):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    device_id: Optional[str] = None
    is_mocked: Optional[bool] = False
    is_vpn: Optional[bool] = False

class PresenceOutSchema(Schema):
    id: int
    user_id: int
    date: date
    check_in: Optional[time]
    check_out: Optional[time]
    status: str
    work_site_name: Optional[str]
    last_active: datetime

@api_controller('/auth', tags=['Kumba Auth'], auth=None)
class KumbaAuthController(NinjaJWTDefaultController):
    pass

@api_controller('/presence', tags=['Presence'])
class PresenceController(ControllerBase):
    
    @route.post('/check-in', response=PresenceOutSchema)
    def check_in(self, request, payload: CheckInSchema):
        user = request.user
        
        # 1. Strict Geofencing & Employee Validation
        employee, site_found = self._validate_presence(user, payload)
        
        # 2. Device Binding Check (Only for check-in)
        if payload.device_id:
            if not employee.device_id:
                # Registering device on first login
                employee.device_id = payload.device_id
                employee.device_locked = True
                employee.save()
            elif employee.device_id != payload.device_id:
                # Unauthorized device
                raise HttpError(403, "Device non autorisé. Veuillez contacter votre administrateur.")

        presence, created = Presence.objects.get_or_create(
            user=user,
            date=date.today(),
            defaults={
                'check_in': datetime.now().time(), 
                'location_lat': payload.latitude, 
                'location_lng': payload.longitude,
                'device_id': payload.device_id,
                'status': 'PRESENT',
                'is_mocked': payload.is_mocked or False,
                'is_vpn': payload.is_vpn or False,
                'work_site_name': site_found.name if site_found else None
            }
        )
        if not created and not presence.check_in:
             presence.check_in = datetime.now().time()
             presence.location_lat = payload.latitude
             presence.location_lng = payload.longitude
             presence.device_id = payload.device_id
             presence.is_mocked = payload.is_mocked or False
             presence.is_vpn = payload.is_vpn or False
             if site_found:
                 presence.work_site_name = site_found.name
             presence.save()
             
        return presence

    def _validate_presence(self, user, payload):
        """Strictly validates if a user can clock in/out based on geofencing and company config."""
        from hr.models import Employee, WorkSite
        
        # 1. Coordinates are mandatory
        if not payload.latitude or not payload.longitude:
             raise HttpError(400, "Échec du clock – zone non reconnue.")

        # 2. Employee record must exist
        try:
            employee = Employee.objects.get(email=user.email)
        except Employee.DoesNotExist:
            raise HttpError(403, "Profil employé non trouvé. Le pointage est impossible.")

        # 3. Company must have at least one WorkSite
        site_found = None
        
        # Check specific site if assigned
        if employee.work_site:
            if self._is_within_radius(payload.latitude, payload.longitude, employee.work_site):
                site_found = employee.work_site
        else:
            # Check ALL company sites if none specifically assigned
            company_sites = WorkSite.objects.filter(company=employee.company)
            if not company_sites.exists():
                raise HttpError(400, "Échec du clock – zone non reconnue.")
            
            for site in company_sites:
                if self._is_within_radius(payload.latitude, payload.longitude, site):
                    site_found = site
                    break
        
        if not site_found:
            print(f"DEBUG: No site found within radius for {user.email} at ({payload.latitude}, {payload.longitude})")
            raise HttpError(400, "Échec du clock – zone non reconnue.")
            
        return employee, site_found

    def _is_within_radius(self, lat, lng, site):
        """Helper to calculate if a point is within a site radius."""
        if lat is None or lng is None or not site.latitude or not site.longitude:
            return False
        
        R = 6371000 # Earth radius in meters
        phi1 = math.radians(lat)
        phi2 = math.radians(float(site.latitude))
        delta_phi = math.radians(float(site.latitude) - lat)
        delta_lambda = math.radians(float(site.longitude) - lng)
        
        a = math.sin(delta_phi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        print(f"DEBUG: Distance to {site.name}: {distance:.2f}m (Radius: {site.radius}m)")
        return distance <= (site.radius or 200)

    @route.post('/check-out', response=PresenceOutSchema)
    def check_out(self, request, payload: CheckInSchema):
        user = request.user
        
        # Strict validation for check-out as well
        employee, site_found = self._validate_presence(user, payload)
        
        presence, created = Presence.objects.get_or_create(
            user=user,
            date=date.today(),
            defaults={
                'status': 'PRESENT',
                'device_id': payload.device_id
            }
        )
        # Update check_out and location
        presence.check_out = datetime.now().time()
        presence.location_lat = payload.latitude
        presence.location_lng = payload.longitude
        if site_found:
             presence.work_site_name = site_found.name
            
        presence.save()
        return presence

    @route.get('/me', response=List[PresenceOutSchema])
    def my_presence(self, request):
        return Presence.objects.filter(user=request.user).order_by('-date')

    @route.get('/', response=List[PresenceOutSchema])
    def list_presence(self, request):
        return Presence.objects.filter(user__company=request.user.company).order_by('-date')
