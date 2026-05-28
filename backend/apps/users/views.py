from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            'uid': getattr(user, 'uid', None),
            'email': getattr(user, 'email', None),
            'name': getattr(user, 'name', None),
        })
