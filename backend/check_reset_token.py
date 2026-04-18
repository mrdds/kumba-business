#!/usr/bin/env python3
import os
import sys
import django

sys.path.insert(0, '/Users/mr.dds/.gemini/antigravity/scratch/kumba-business/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from users.models import PasswordResetToken

token = PasswordResetToken.objects.filter(user__email='sano.daouda96@gmail.com').order_by('-created_at').first()

if token:
    print(f'\n✅ Token créé avec succès !')
    print(f'Token: {token.token}')
    print(f'Valide: {token.is_valid()}')
    print(f'Expire: {token.expires_at}')
    print(f'\n🔗 Lien de réinitialisation:')
    print(f'http://localhost:3000/auth/reset-password?token={token.token}\n')
else:
    print('❌ Aucun token trouvé')
