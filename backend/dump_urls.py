import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()
from django.urls import get_resolver
def list_urls(lis, acc=None):
    if acc is None:
        acc = []
    if not lis:
        return
    l = lis[0]
    if hasattr(l, 'url_patterns'):
        yield from list_urls(l.url_patterns, acc + [str(l.pattern)])
    else:
        yield ''.join(acc) + str(l.pattern)
    yield from list_urls(lis[1:], acc)

for p in list_urls(get_resolver().url_patterns):
    if 'pair' in p:
        print(p)
