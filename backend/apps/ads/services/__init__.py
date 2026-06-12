from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import F
from django.utils import timezone

from apps.wallet.models import Transaction, Wallet
from apps.ads.models import AdCampaign


def active_campaigns_queryset():
    today = timezone.localdate()
    return (
        AdCampaign.objects
        .filter(
            status=AdCampaign.Status.ACTIVE,
            start_date__lte=today,
            end_date__gte=today,
            product__status='PUBLISHED',
            spent__lt=F('budget'),
        )
        .select_related('vendor', 'product', 'product__category')
        .prefetch_related('product__images')
        .order_by('-budget', '-created_at')
    )


def fund_campaign(campaign):
    wallet, _ = Wallet.objects.select_for_update().get_or_create(vendor=campaign.vendor)
    if wallet.available_balance < campaign.budget:
        raise ValueError('Solde disponible insuffisant pour financer cette campagne.')

    Wallet.objects.filter(pk=wallet.pk).update(
        available_balance=F('available_balance') - campaign.budget,
    )
    Transaction.objects.create(
        wallet=wallet,
        type=Transaction.Type.AD_SPEND,
        amount=campaign.budget,
        description=f"Budget publicitaire campagne #{campaign.id}",
        reference=f"AD-{campaign.id}-BUDGET",
    )


def create_campaign(*, vendor, product, budget, cost_per_click, start_date, end_date):
    with db_transaction.atomic():
        campaign = AdCampaign.objects.create(
            vendor=vendor,
            product=product,
            budget=budget,
            cost_per_click=cost_per_click,
            start_date=start_date,
            end_date=end_date,
            status=AdCampaign.Status.ACTIVE,
        )
        fund_campaign(campaign)
        return campaign


def register_impressions(campaign_ids):
    ids = [campaign_id for campaign_id in campaign_ids if campaign_id]
    if ids:
        AdCampaign.objects.filter(id__in=ids).update(impressions=F('impressions') + 1)


def register_click(campaign):
    cost = campaign.cost_per_click or Decimal('0.00')
    update = {'clicks': F('clicks') + 1}
    if campaign.spent + cost <= campaign.budget:
        update['spent'] = F('spent') + cost
    AdCampaign.objects.filter(pk=campaign.pk).update(**update)
