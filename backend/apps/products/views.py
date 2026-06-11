from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Product, ProductImage, ProductVariant
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    ProductWriteSerializer, ProductImageSerializer,
    ProductVariantSerializer, ProductVariantWriteSerializer,
)
from apps.vendors.models import Vendor
from utils.storage import upload_to_supabase


# ── Public ───────────────────────────────────────────────────────────

class PublicProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Product.objects
            .filter(status=Product.Status.PUBLISHED)
            .select_related('vendor', 'category')
            .prefetch_related('images')
        )
        if cat := request.query_params.get('category'):
            qs = qs.filter(category__slug=cat)
        if vendor := request.query_params.get('vendor'):
            qs = qs.filter(vendor__slug=vendor)
        if min_p := request.query_params.get('min_price'):
            qs = qs.filter(price__gte=min_p)
        if max_p := request.query_params.get('max_price'):
            qs = qs.filter(price__lte=max_p)
        return Response(ProductListSerializer(qs, many=True).data)


class PublicProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            product = (
                Product.objects
                .filter(status=Product.Status.PUBLISHED)
                .select_related('vendor', 'category')
                .prefetch_related('images', 'variants')
                .get(slug=slug)
            )
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductDetailSerializer(product).data)


# ── Vendor helpers ────────────────────────────────────────────────────

def _get_vendor(user):
    try:
        return user.vendor, None
    except Vendor.DoesNotExist:
        return None, Response(
            {'error': "Vous n'avez pas de boutique."},
            status=status.HTTP_404_NOT_FOUND,
        )


def _get_product(vendor, pk):
    try:
        return (
            Product.objects
            .prefetch_related('images', 'variants')
            .get(pk=pk, vendor=vendor)
        ), None
    except Product.DoesNotExist:
        return None, Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)


# ── Vendor products ───────────────────────────────────────────────────

class VendorProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        qs = (
            Product.objects
            .filter(vendor=vendor)
            .select_related('category')
            .prefetch_related('images', 'variants')
        )
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s.upper())
        return Response(ProductListSerializer(qs, many=True).data)

    def post(self, request):
        vendor, err = _get_vendor(request.user)
        if err:
            return err

        if vendor.status != Vendor.Status.APPROVED:
            return Response(
                {'error': 'Votre boutique doit être approuvée pour ajouter des produits.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if vendor.plan and vendor.plan.max_products is not None:
            count = Product.objects.filter(vendor=vendor).exclude(status=Product.Status.ARCHIVED).count()
            if count >= vendor.plan.max_products:
                return Response(
                    {'error': f"Limite de {vendor.plan.max_products} produits atteinte. Passez au plan supérieur."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save(vendor=vendor)
        return Response(
            ProductDetailSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )


class VendorProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        product, err = _get_product(vendor, pk)
        if err:
            return err
        return Response(ProductDetailSerializer(product).data)

    def patch(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        product, err = _get_product(vendor, pk)
        if err:
            return err
        serializer = ProductWriteSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        product.refresh_from_db()
        return Response(ProductDetailSerializer(product).data)

    def delete(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        product, err = _get_product(vendor, pk)
        if err:
            return err
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Product images ────────────────────────────────────────────────────

class ProductImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        try:
            product = Product.objects.get(pk=pk, vendor=vendor)
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if product.images.count() >= 5:
            return Response({'error': 'Maximum 5 images par produit.'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)
        if file.content_type not in ['image/jpeg', 'image/png', 'image/webp']:
            return Response({'error': 'Format non supporté (JPG, PNG, WebP).'}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > 5 * 1024 * 1024:
            return Response({'error': 'Fichier trop volumineux (max 5 Mo).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = upload_to_supabase(file, bucket='product-images', folder=str(product.id))
        except Exception:
            return Response({'error': "Erreur lors de l'upload."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        is_first = not product.images.exists()
        image = ProductImage.objects.create(
            product=product,
            image_url=url,
            order=product.images.count(),
            is_cover=is_first,
        )
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


class ProductImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, image_id):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        try:
            product = Product.objects.get(pk=pk, vendor=vendor)
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            image = product.images.get(pk=image_id)
        except ProductImage.DoesNotExist:
            return Response({'error': 'Image introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        was_cover = image.is_cover
        image.delete()

        if was_cover:
            first = product.images.order_by('order').first()
            if first:
                first.is_cover = True
                first.save(update_fields=['is_cover'])

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageSetCoverView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, image_id):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        try:
            product = Product.objects.get(pk=pk, vendor=vendor)
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            image = product.images.get(pk=image_id)
        except ProductImage.DoesNotExist:
            return Response({'error': 'Image introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        product.images.filter(is_cover=True).update(is_cover=False)
        image.is_cover = True
        image.save(update_fields=['is_cover'])
        return Response(ProductImageSerializer(image).data)


class ProductImageReorderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        try:
            product = Product.objects.get(pk=pk, vendor=vendor)
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        items = request.data
        if not isinstance(items, list):
            return Response({'error': 'Format invalide : liste [{id, order}] attendue.'}, status=status.HTTP_400_BAD_REQUEST)

        for item in items:
            try:
                img = product.images.get(pk=item['id'])
                img.order = item['order']
                img.save(update_fields=['order'])
            except (ProductImage.DoesNotExist, KeyError, TypeError):
                pass

        return Response(ProductImageSerializer(product.images.all(), many=True).data)


# ── Product variants ──────────────────────────────────────────────────

class ProductVariantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        product, err = _get_product(vendor, pk)
        if err:
            return err
        return Response(ProductVariantSerializer(product.variants.all(), many=True).data)

    def post(self, request, pk):
        vendor, err = _get_vendor(request.user)
        if err:
            return err
        product, err = _get_product(vendor, pk)
        if err:
            return err
        serializer = ProductVariantWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.save(product=product)
        return Response(ProductVariantSerializer(variant).data, status=status.HTTP_201_CREATED)


class ProductVariantDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk, variant_id):
        vendor, err = _get_vendor(request.user)
        if err:
            return None, err
        product, err = _get_product(vendor, pk)
        if err:
            return None, err
        try:
            return product.variants.get(pk=variant_id), None
        except ProductVariant.DoesNotExist:
            return None, Response({'error': 'Variante introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk, variant_id):
        variant, err = self._get(request, pk, variant_id)
        if err:
            return err
        serializer = ProductVariantWriteSerializer(variant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProductVariantSerializer(variant).data)

    def delete(self, request, pk, variant_id):
        variant, err = self._get(request, pk, variant_id)
        if err:
            return err
        variant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
