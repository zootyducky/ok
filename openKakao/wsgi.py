"""
WSGI config for openKakao project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""
import os, sys, site, django.core.handlers.wsgi

from django.core.wsgi import get_wsgi_application

SITE_DIR = '/home/ubuntu/openKakao/'
site.addsitedir(SITE_DIR)
sys.path.append(SITE_DIR)


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "openKakao.settings")

application = get_wsgi_application()

