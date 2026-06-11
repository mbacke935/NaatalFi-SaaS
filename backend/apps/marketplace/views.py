import base64
import json
from decimal import Decimal

from django.core.cache import cache
from django.db.models import Q
from django.utils.dateparse import parse_datetime
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

def _cursor_value(obj, field):
    value = getattr(obj, field)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return str(value)


def _encode_cursor(obj, ordering):
    payload = {field.lstrip('-'): _cursor_value(obj, field.lstrip('-')) for field in ordering}
    raw = json.dumps(payload, separators=(',', ':')).encode()
    return base64.urlsafe_b64encode(raw).decode()


def _decode_cursor(cursor):
    try:
        raw = base64.urlsafe_b64decode(cursor.encode()).decode()
        return json.loads(raw)
    except Exception:
        return None


def _coerce_cursor_value(field, value):
    if field == 'id':
        return int(value)
    if field == 'created_at':
        return parse_datetime(value)
    if field == 'price':
        return Decimal(value)
    if field == 'trust_score':
        return float(value)
    return value


def _cursor_q(ordering, values):
    query = Q()
    equals = Q()

    for raw_field in ordering:
        desc = raw_field.startswith('-')
        field = raw_field.lstrip('-')
        if field not in values:
            return Q()

        value = _coerce_cursor_value(field, values[field])
        op = 'lt' if desc else 'gt'
        query |= equals & Q(**{f'{field}__{op}': value})
        equals &= Q(**{field: value})

    return query


def cursor_paginate(queryset, request, serializer_class, ordering):
    try:
        page_size = min(max(1, int(request.query_params.get('page_size', 20))), 100)
    except (ValueError, TypeError):
        page_size = 20

    cursor = request.query_params.get('cursor', '').strip()
    cursor_values = _decode_cursor(cursor) if cursor else None
    if cursor and cursor_values is None:
        return {
            'count': 0,
            'page_size': page_size,
            'next_cursor': None,
            'has_next': False,
            'results': [],
        }

    total = queryset.count()
    if cursor_values:
        queryset = queryset.filter(_cursor_q(ordering, cursor_values))

    rows = list(queryset.order_by(*ordering)[:page_size + 1])
    page_rows = rows[:page_size]
    has_next = len(rows) > page_size

    return {
        'count': total,
        'page_size': page_size,
        'next_cursor': _encode_cursor(page_rows[-1], ordering) if has_next and page_rows else None,
        'has_next': has_next,
        'results': serializer_class(page_rows, many=True).data,
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
            'recent':     ['-created_at', '-id'],
            '-recent':    ['created_at', 'id'],
            'price_asc':  ['price', 'id'],
            'price_desc': ['-price', '-id'],
            'trust':      ['-trust_score', '-created_at', '-id'],
        }
        ordering = valid_sorts.get(sort, ['-created_at', '-id'])

        data = cursor_paginate(qs, request, ProductListSerializer, ordering)
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
        qs_hash = '_'.join(f"{k}={v}" for k, v in sorted(request.query_params.items()))
        cache_key = f"mp:vendors:{qs_hash}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = (
            Vendor.objects
            .filter(status=Vendor.Status.APPROVED)
            .select_related('plan')
        )
        data = cursor_paginate(
            qs,
            request,
            MarketplaceVendorSerializer,
            ['-trust_score', '-created_at', '-id'],
        )
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
                'count': 0, 'page_size': 20,
                'next_cursor': None, 'has_next': False, 'results': [],
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

        return Response(
            cursor_paginate(qs, request, ProductListSerializer, ['-trust_score', '-created_at', '-id'])
        )


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
