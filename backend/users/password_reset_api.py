from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from .models import PasswordResetToken

User = get_user_model()
# Router without auth - password reset is public
router = Router(auth=None)


class PasswordResetRequestSchema(Schema):
    email: str
    source: str = 'web'  # 'web' or 'mobile'
    callback_url: str = None  # Optional dynamic callback URL


class PasswordResetConfirmSchema(Schema):
    token: str
    new_password: str


class MessageSchema(Schema):
    message: str


class ErrorSchema(Schema):
    error: str


@router.post('/password-reset')
def request_password_reset(request, payload: PasswordResetRequestSchema):
    """
    Request a password reset email
    For security, always return success even if email doesn't exist
    """
    try:
        user = User.objects.get(email=payload.email)
        
        # Invalidate old tokens
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        
        # Create new token
        reset_token = PasswordResetToken.objects.create(user=user)
        
        # Build reset URL based on source
        if payload.source == 'mobile':
             # Deep link via Redirect Bridge
             # We assume api is mounted at /api, so we construct the URL relative to the request
            base_url = request.build_absolute_uri('/api/auth/mobile-redirect')
            
            # Use dynamic callback URL if provided, otherwise fallback to default scheme
            mobile_target = payload.callback_url if payload.callback_url else "mobile://auth/reset-password"
            
            # Append token to the mobile target
            # Check if callback_url already has params
            separator = '&' if '?' in mobile_target else '?'
            final_mobile_target = f"{mobile_target}{separator}token={reset_token.token}"
            
            # Encode target for the redirect bridge
            import urllib.parse
            encoded_target = urllib.parse.quote(final_mobile_target)
            
            reset_url = f"{base_url}?target={encoded_target}"
        else:
            # Web link
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token.token}"
        
        subject = "Réinitialisation de votre mot de passe OurSpace"
        
        # Plain text version
        text_content = f"""
Bonjour {user.first_name or user.username},

Vous avez demandé la réinitialisation de votre mot de passe sur OurSpace.

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :

{reset_url}

Ce lien est valable pendant 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe OurSpace
        """
        
        # HTML version using template
        html_content = render_to_string('password_reset_email.html', {
            'reset_url': reset_url,
            'user': user,
        })
        
        email = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
    except User.DoesNotExist:
        # For security, don't reveal that email doesn't exist
        pass
    
    return {'message': 'Si cet email existe, un lien de réinitialisation a été envoyé'}


@router.get('/mobile-redirect', auth=None)
def mobile_redirect(request, target: str):
    """
    Serve a page that redirects to the custom scheme
    """
    # Simply redirect to the provided target
    html = render_to_string('mobile_redirect.html', {'mobile_url': target})
    return HttpResponse(html)


@router.post('/password-reset/confirm', response={200: MessageSchema, 400: ErrorSchema})
def confirm_password_reset(request, payload: PasswordResetConfirmSchema):
    """
    Reset password with token
    """
    try:
        reset_token = PasswordResetToken.objects.filter(token=payload.token).first()
        
        if not reset_token:
            return 400, {'error': 'Token invalide'}
        
        if not reset_token.is_valid():
            return 400, {'error': 'Ce lien de réinitialisation a expiré ou a déjà été utilisé'}
        
        # Update password
        user = reset_token.user
        user.password = make_password(payload.new_password)
        user.save()
        
        # Mark token as used
        reset_token.used = True
        reset_token.save()
        
        return 200, {'message': 'Mot de passe réinitialisé avec succès'}
        
    except Exception as e:
        return 400, {'error': f'Une erreur est survenue: {str(e)}'}
