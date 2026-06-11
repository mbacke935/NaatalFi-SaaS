from django.core.cache import cache
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer, ProductDetailSerializer
from apps.vendors.models import Vendor
from apps.categories.models import Category
from apps.categories.serializers import CategoryTreeSerializer
from .serializers import MarketplaceVendorSerializer, MarketplaceVendorDetailSerializer


# ── Pagination helper ─────────────────────────────────────────────────

def paginate(queryset, request, serializer_class):
    try:
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(max(1, int(request.query_params.get('page_size', 20))), 100)
    except (ValueError, TypeError):
        page, page_size = 1, 20

    total  = queryset.count()
    start  = (page - 1) * page_size
    items  = serializer_class(queryset[start:start + page_size], many=True).data
    pages  = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        'count':       total,
        'total_pages': pages,
        'page':        page,
        'page_size':   page_size,
        'has_next':    page < pages,
        'has_prev':    page > 1,
        'results':     items,
    }


# ── Produits ──────────────────────────────────────────────────────────

class MarketplaceProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Cache key built from query params
        qs_hash = '_'.join(f"{k}={v}" for k, v in sorted(request.query_params.items()))
        cache_key = f"mp:products:{qs_hash}"

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = (
            Product.objects
            .filter(status=Product.Status.PUBLISHED)
            .select_related('vendor', 'category')
            .prefetch_related('images')
        )

        # Filters
        if cat := request.query_params.get('category'):
            qs = qs.filter(category__slug=cat)
        if vendor := request.query_params.get('vendor'):
            qs = qs.filter(vendor__slug=vendor)
        if min_p := request.query_params.get('min_price'):
            try:
                qs = qs.filter(price__gte=float(min_p))
            except ValueError:
                pass
        if max_p := request.query_params.get('max_price'):
            try:
                qs = qs.filter(price__lte=float(max_p))
            except ValueError:
                pass

        # Sort
        sort = request.query_params.get('sort', '-created_at')
        valid_sorts = {
            'recent':     '-created_at',
            '-recent':    'created_at',
            'price_asc':  'price',
            'price_desc': '-price',
            'trust':      '-trust_score',
        }
        qs = qs.order_by(valid_sorts.get(sort, '-created_at'))

        data = paginate(qs, request, ProductListSerializer)
        cache.set(cache_key, data, 300)
        return Response(data)


class MarketplaceProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        cache_key = f"mp:product:{slug}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

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

        data = ProductDetailSerializer(product).data

        # Related products (same category or same vendor)
        related = (
            Product.objects
            .filter(status=Product.Status.PUBLISHED)
            .exclude(pk=product.pk)
            .filter(
                Q(category=product.category) | Q(vendor=product.vendor)
            )
            .select_related('vendor', 'category')
            .prefetch_related('images')
            .order_by('-trust_score', '-created_at')[:6]
        )
        data = dict(data)
        data['related'] = ProductListSerializer(related, many=True).data

        cache.set(cache_key, data, 300)
        return Response(data)


# ── Vendeurs ──────────────────────────────────────────────────────────

class MarketplaceVendorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = f"mp:vendors:page={request.query_params.get('page', 1)}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = (
            Vendor.objects
            .filter(status=Vendor.Status.APPROVED)
            .select_related('plan')
            .order_by('-trust_score', '-created_at')
        )
        data = paginate(qs, request, MarketplaceVendorSerializer)
        cache.set(cache_key, data, 300)
        return Response(data)


class MarketplaceVendorDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        cache_key = f"mp:vendor:{slug}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            vendor = Vendor.objects.select_related('plan').get(slug=slug, status=Vendor.Status.APPROVED)
        except Vendor.DoesNotExist:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        data = MarketplaceVendorDetailSerializer(vendor).data
        cache.set(cache_key, data, 300)
        return Response(data)


# ── Catégories ────────────────────────────────────────────────────────

class MarketplaceCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = 'mp:categories'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        categories = (
            Category.objects
            .filter(is_active=True, parent__isnull=True)
            .prefetch_related('children')
            .order_by('order', 'name')
        )
        data = CategoryTreeSerializer(categories, many=True).data
        cache.set(cache_key, data, 600)  # 10 min — les catégories changent rarement
        return Response(data)


# ── Recherche ─────────────────────────────────────────────────────────

class MarketplaceSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({
                'count': 0, 'total_pages': 0, 'page': 1,
                'page_size': 20, 'has_next': False, 'has_prev': False, 'results': [],
            })

        # Full-text search via PostgreSQL icontains (compatible sans configuration)
        qs = (
            Product.objects
            .filter(status=Product.Status.PUBLISHED)
            .filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(vendor__name__icontains=q)
                | Q(category__name__icontains=q)
            )
            .select_related('vendor', 'category')
            .prefetch_related('images')
            .distinct()
            .order_by('-trust_score', '-created_at')
        )

        # Try to upgrade to PostgreSQL full-text search
        try:
            from django.contrib.postgres.search import SearchVector, SearchQuery
            fts_qs = (
                Product.objects
                .filter(status=Product.Status.PUBLISHED)
                .annotate(search=SearchVector('name', 'description', config='simple'))
                .filter(search=SearchQuery(q, config='simple'))
                .select_related('vendor', 'category')
                .prefetch_related('images')
                .order_by('-trust_score', '-created_at')
            )
            # Use FTS if it returns results, otherwise fall back
            if fts_qs.exists():
                qs = fts_qs
        except Exception:
            pass

        return Response(paginate(qs, request, ProductListSerializer))


# ── Produits vedettes ─────────────────────────────────────────────────

class MarketplaceFeaturedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = 'mp:featured'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        products = (
            Product.objects
            .filter(status=Product.Status.PUBLISHED)
            .select_related('vendor', 'category')
            .prefetch_related('images')
            .order_by('-trust_score', '-created_at')[:8]
        )
        data = ProductListSerializer(products, many=True).data
        cache.set(cache_key, data, 300)
        return Response(data)
