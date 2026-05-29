from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from audiofit.db import users_collection, MongoDBModel


class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        uid = getattr(user, 'uid', None)
        email = getattr(user, 'email', None)
        name = getattr(user, 'name', None) or email.split('@')[0] if email else 'User'

        # Check and auto-create user in MongoDB if users_collection is initialized
        if users_collection is not None and uid:
            mongo_user = users_collection.find_one({"firebase_uid": uid})
            if not mongo_user:
                new_user_doc = MongoDBModel.create_user(
                    firebase_uid=uid,
                    display_name=name,
                    fitness_level='beginner'
                )
                users_collection.insert_one(new_user_doc)

        return Response({
            'uid': uid,
            'email': email,
            'name': name,
        })
