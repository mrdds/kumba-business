from ninja_extra import api_controller, route
from ninja import Schema
from typing import List, Optional
from decimal import Decimal
from django.shortcuts import get_object_or_404
from kumba_id.auth import KumbaJWTAuth
from .models import Product, StockMovement

# ============ SCHEMAS ============

class ProductSchema(Schema):
    name: str
    category: Optional[str] = ''
    unit: Optional[str] = 'Unité'
    current_stock: Decimal = 0
    min_stock: Decimal = 0
    unit_price: Decimal = 0

class ProductOutSchema(Schema):
    id: int
    name: str
    category: str
    unit: str
    min_stock: Decimal
    current_stock: Decimal
    unit_price: Decimal
    status: str

class StockMovementSchema(Schema):
    product_id: int
    quantity: Decimal
    type: str # IN, OUT, ADJUST
    reason: Optional[str] = ''
    reference_id: Optional[str] = ''
    
    issued_to_id: Optional[int] = None
    received_from_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    work_site_id: Optional[int] = None
    mission_id: Optional[str] = None
    condition_out: Optional[str] = None
    condition_return: Optional[str] = None
    damage_notes: Optional[str] = None
    team_name: Optional[str] = None
    team_leader_name: Optional[str] = None

class StockMovementOutSchema(Schema):
    id: int
    product_id: int
    product_name: str
    quantity: Decimal
    type: str
    reason: str
    date: str
    reference_id: str
    performed_by_name: str
    product_unit: str
    
    issued_to_name: Optional[str]
    received_from_name: Optional[str]
    approved_by_name: Optional[str]
    work_site_name: Optional[str]
    mission_id: Optional[str]
    team_name: Optional[str]
    team_leader_name: Optional[str]

    @staticmethod
    def resolve_product_unit(obj):
        return obj.product.unit

    @staticmethod
    def resolve_product_name(obj):
        return obj.product.name
    
    @staticmethod
    def resolve_date(obj):
        return obj.date.isoformat()

    @staticmethod
    def resolve_issued_to_name(obj):
        if obj.issued_to:
            if obj.issued_to.employee:
                return f"{obj.issued_to.employee.first_name} {obj.issued_to.employee.last_name}"
            return obj.issued_to.contractor_company or 'Freelance'
        return None

    @staticmethod
    def resolve_received_from_name(obj):
        if obj.received_from:
            if obj.received_from.employee:
                return f"{obj.received_from.employee.first_name} {obj.received_from.employee.last_name}"
            return obj.received_from.contractor_company or 'Freelance'
        return None

    @staticmethod
    def resolve_approved_by_name(obj):
        if obj.approved_by:
            if obj.approved_by.employee:
                return f"{obj.approved_by.employee.first_name} {obj.approved_by.employee.last_name}"
            return obj.approved_by.contractor_company or 'Freelance'
        return None

    @staticmethod
    def resolve_work_site_name(obj):
        return obj.work_site.name if obj.work_site else None

class AssetSchema(Schema):
    product_id: int
    serial_number: str
    internal_id: Optional[str] = None
    status: str = 'AVAILABLE'
    condition: str = 'GOOD'

class AssetOutSchema(Schema):
    id: int
    product_name: str
    serial_number: str
    internal_id: Optional[str]
    status: str
    current_holder_name: Optional[str]
    condition: str
    last_inspection_date: Optional[str]

    @staticmethod
    def resolve_product_name(obj):
        return obj.product.name

    @staticmethod
    def resolve_current_holder_name(obj):
        if obj.current_holder:
            if obj.current_holder.employee:
                return f"{obj.current_holder.employee.first_name} {obj.current_holder.employee.last_name}"
            return obj.current_holder.contractor_company or 'Freelance'
        return None

# ============ API CONTROLLERS ============

@api_controller('/inventory/products', tags=['Inventory'], auth=KumbaJWTAuth())
class ProductController:
    @route.get('', response=List[ProductOutSchema])
    def list_products(self, request):
        from kumba_id.models import KumbaUser
        
        # Get a fresh user instance to ensure all fields are present
        try:
            user = KumbaUser.objects.get(id=request.user.id)
            company = user.company
        except (AttributeError, KumbaUser.DoesNotExist):
            return []

        if not company:
            return []
            
        return Product.objects.filter(company=company)

    @route.get('/{product_id}', response=ProductOutSchema)
    def get_product(self, request, product_id: int):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        return get_object_or_404(Product, id=product_id, company=user.company)

    @route.post('', response={201: ProductOutSchema})
    def create_product(self, request, payload: ProductSchema):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        product = Product.objects.create(
            company=user.company,
            **payload.dict()
        )
        return 201, product

    @route.patch('/{product_id}', response=ProductOutSchema)
    def update_product(self, request, product_id: int, payload: ProductSchema):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        product = get_object_or_404(Product, id=product_id, company=user.company)
        for attr, value in payload.dict().items():
            setattr(product, attr, value)
        product.save()
        return product

    @route.delete('/{product_id}')
    def delete_product(self, request, product_id: int):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        product = get_object_or_404(Product, id=product_id, company=user.company)
        product.delete()
        return {"success": True}

@api_controller('/inventory/movements', tags=['Inventory'], auth=KumbaJWTAuth())
class MovementController:
    @route.get('', response=List[StockMovementOutSchema])
    def list_movements(self, request):
        from kumba_id.models import KumbaUser
        try:
            user = KumbaUser.objects.get(id=request.user.id)
            company = user.company
        except (AttributeError, KumbaUser.DoesNotExist):
            return []

        if not company:
            return []
            
        return StockMovement.objects.filter(product__company=company).order_by('-date')

    @route.post('', response={201: StockMovementOutSchema})
    def create_movement(self, request, payload: StockMovementSchema):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        product = get_object_or_404(Product, id=payload.product_id, company=user.company)
        
        # Validation rules: NO OUT WITHOUT RESOURCE
        if payload.type == 'OUT' and not payload.issued_to_id:
             from ninja.errors import HttpError
             raise HttpError(422, "Toute sortie de matériel doit être rattachée à une ressource identifiable.")
             
        data = payload.dict()
        movement = StockMovement.objects.create(
            product=product,
            performed_by_name=f"{user.first_name} {user.last_name}" if user.first_name or user.last_name else user.username,
            **data
        )
        return 201, movement

@api_controller('/inventory/assets', tags=['Inventory'], auth=KumbaJWTAuth())
class AssetController:
    @route.get('', response=List[AssetOutSchema])
    def list_assets(self, request):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        from .models import Asset
        return Asset.objects.filter(company=user.company)

    @route.post('', response={201: AssetOutSchema})
    def create_asset(self, request, payload: AssetSchema):
        from kumba_id.models import KumbaUser
        user = KumbaUser.objects.get(id=request.user.id)
        from .models import Asset
        product = get_object_or_404(Product, id=payload.product_id, company=user.company)
        asset = Asset.objects.create(
            company=user.company,
            product=product,
            **payload.dict(exclude={'product_id'})
        )
        return 201, asset
