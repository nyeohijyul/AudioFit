from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClipViewSet, RoutineViewSet

router = DefaultRouter()
router.register(r'clips', ClipViewSet, basename='clip')
router.register(r'routines', RoutineViewSet, basename='routine')

urlpatterns = [
    path('', include(router.urls)),
]
