from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Category
from .serializers import CategoryTreeSerializer, CategoryWriteSerializer, ReorderSerializer
from apps.users.models import CustomUser
from utils.storage import upload_to_supabase


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


# ── Public ───────────────────────────────────────────────────────────

class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        roots = Category.objects.filter(parent=None, is_active=True).prefetch_related('children')
        return Response(CategoryTreeSerializer(roots, many=True).data)


class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            category = Category.objects.prefetch_related('children').get(slug=slug, is_active=True)
        except Category.DoesNotExist:
            return Response({"error": "Catégorie introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CategoryTreeSerializer(category).data)


# ── Admin ────────────────────────────────────────────────────────────

class AdminCategoryListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        roots = Category.objects.filter(parent=None).prefetch_related('children')
        return Response(CategoryTreeSerializer(roots, many=True).data)

    def post(self, request):
        serializer = CategoryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return Response(CategoryTreeSerializer(category).data, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Catégorie introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CategoryWriteSerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CategoryTreeSerializer(category).data)

    def delete(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Catégorie introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if category.children.exists():
            return Response(
                {"error": "Supprimez d'abord les sous-catégories."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryImageView(APIView):
    permission_classes = [IsAdmin]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Catégorie introuvable."}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('image')
        if not file:
            return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        if file.content_type not in ['image/jpeg', 'image/png', 'image/webp']:
            return Response({"error": "Format non supporté (JPG, PNG, WebP)."}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 5 * 1024 * 1024:
            return Response({"error": "Fichier trop volumineux (max 5 Mo)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = upload_to_supabase(file, bucket='category-images', folder=str(category.id))
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            return Response({"error": "Erreur lors de l'upload."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        category.image = url
        category.save(update_fields=['image'])
        return Response({"image": url})


class AdminCategoryReorderView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = ReorderSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        for item in serializer.validated_data:
            Category.objects.filter(pk=item['id']).update(order=item['order'])

        return Response({"message": "Ordre mis à jour."})
