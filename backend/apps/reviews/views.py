from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.users.models import CustomUser
from apps.vendors.models import Vendor
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from .models import Review
from .serializers import CreateReviewSerializer, ReviewSerializer
from .services import recalculate_review_scores


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


def _review_queryset():
    return (
        Review.objects
        .select_related('author', 'product', 'vendor', 'vendor_order')
        .order_by('-created_at')
    )


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateReviewSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        recalculate_review_scores(review.product, review.vendor)
        cache.clear()
        create_notification(
            user=review.vendor.user,
            type=Notification.Type.VENDOR,
            title=f"Nouvel avis {review.rating}/5",
            message=f"{review.author.get_full_name() or review.author.email} a laisse un avis sur {review.product.name}.",
            link_url="/dashboard",
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class MyReviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ReviewSerializer(_review_queryset().filter(author=request.user), many=True).data)


class ProductReviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, status=Product.Status.PUBLISHED)
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        reviews = _review_queryset().filter(product=product)
        return Response(ReviewSerializer(reviews[:100], many=True).data)


class VendorReviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            vendor = Vendor.objects.get(slug=slug, status=Vendor.Status.APPROVED)
        except Vendor.DoesNotExist:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        reviews = _review_queryset().filter(vendor=vendor)
        return Response(ReviewSerializer(reviews[:100], many=True).data)


class AdminReviewListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        reviews = _review_queryset()
        if rating := request.query_params.get('rating'):
            reviews = reviews.filter(rating=rating)
        return Response(ReviewSerializer(reviews[:200], many=True).data)


class AdminReviewDetailView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            review = Review.objects.select_related('product', 'vendor').get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        product = review.product
        vendor = review.vendor
        review.delete()
        recalculate_review_scores(product, vendor)
        cache.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)

