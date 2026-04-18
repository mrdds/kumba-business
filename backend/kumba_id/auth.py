from ninja_jwt.authentication import JWTAuth
from django.contrib.auth import get_user_model
from ninja.errors import HttpError

User = get_user_model()

class KumbaJWTAuth(JWTAuth):
    def authenticate(self, request, token):
        print(f"DEBUG: KumbaJWTAuth.authenticate called with token type: {type(token)}")
        user = None
        try:
            user = super().authenticate(request, token)
            print(f"DEBUG: super().authenticate returned: {user}")
        except Exception as e:
            print(f"DEBUG: super().authenticate failed: {e}")
            pass

        # Manual payload extraction for auto-provisioning OR synchronization
        try:
            from jwt import decode as jwt_decode
            from django.conf import settings
            
            # Note: We use the shared secret key to decode and verify
            payload = jwt_decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')]
            )
            print(f"DEBUG: Token payload decoded: {payload}")
            
            user_id_claim = settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id')
            user_id = payload.get(user_id_claim)
            print(f"DEBUG: user_id_claim ({user_id_claim}) => {user_id}")
            
            if user_id:
                # 1. Auto-provision if user doesn't exist
                if not user:
                    user = User.objects.filter(email=user_id).first()
                    print(f"DEBUG: Manual lookup by email found: {user}")
                
                if not user:
                    print(f"DEBUG: Auto-provisioning user from SSO token: {user_id}")
                    user = User.objects.create(
                        email=user_id,
                        username=user_id,
                        first_name=payload.get('first_name', ''),
                        last_name=payload.get('last_name', ''),
                        # Default role for new SSO users who aren't pre-registered as employees
                        role='SUPER_ADMIN' if not User.objects.exists() else 'STANDARD_USER' 
                    )
                
                # 2. Synchronize fields from token payload
                needs_save = False
                
                # Sync Kumba IDs
                kumba_id_claim = payload.get('kumba_id')
                if kumba_id_claim and user.kumba_id != kumba_id_claim:
                    user.kumba_id = kumba_id_claim
                    needs_save = True
                
                if kumba_id_claim and user.employee_id != kumba_id_claim:
                    user.employee_id = kumba_id_claim
                    needs_save = True
                
                # Sync Names (Only if currently empty in Business)
                fn_claim = payload.get('first_name')
                ln_claim = payload.get('last_name')
                
                if fn_claim and not user.first_name:
                    user.first_name = fn_claim
                    needs_save = True
                
                if ln_claim and not user.last_name:
                    user.last_name = ln_claim
                    needs_save = True
                
                if needs_save:
                    user.save(update_fields=['kumba_id', 'employee_id', 'first_name', 'last_name'])
                    print(f"DEBUG: User synced and saved.")
                    
                if request:
                    request.user = user
                print(f"DEBUG: KumbaJWTAuth returning user: {user}")
                return user
        except Exception as e:
            import traceback
            print(f"JWT Authentication/Sync Error: {e}")
            traceback.print_exc()
            return user # Return whatever super() found if sync failed
            
        print(f"DEBUG: KumbaJWTAuth returning: {user}")
        return user
