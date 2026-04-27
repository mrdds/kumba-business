from django.db import models
from companies.models import Company

class Product(models.Model):
    class Status(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'En Stock'
        LOW_STOCK = 'LOW_STOCK', 'Stock Faible'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Rupture'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=50, default='Unité')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.company.name})"

    @property
    def status(self):
        if self.current_stock <= 0:
            return str(self.Status.OUT_OF_STOCK.value)
        if self.current_stock <= self.min_stock:
            return str(self.Status.LOW_STOCK.value)
        return str(self.Status.IN_STOCK.value)

class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        IN = 'IN', 'Entrée'
        OUT = 'OUT', 'Sortie'
        ADJUSTMENT = 'ADJUST', 'Ajustement'

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=10, choices=MovementType.choices)
    reason = models.CharField(max_length=255, blank=True)
    performed_by_name = models.CharField(max_length=255, default='Système')
    
    # Traceability (New Business Rules)
    issued_to = models.ForeignKey('hr.FieldResource', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_movements')
    received_from = models.ForeignKey('hr.FieldResource', on_delete=models.SET_NULL, null=True, blank=True, related_name='returned_movements')
    approved_by = models.ForeignKey('hr.FieldResource', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_movements')
    
    work_site = models.ForeignKey('hr.WorkSite', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_movements')
    mission_id = models.CharField(max_length=50, blank=True, null=True)
    
    condition_out = models.CharField(max_length=50, blank=True, null=True) # GOOD, DAMAGED, NEW
    condition_return = models.CharField(max_length=50, blank=True, null=True)
    damage_notes = models.TextField(blank=True, null=True)
    responsibility_imputed = models.BooleanField(default=False)
    
    team_name = models.CharField(max_length=255, blank=True, null=True)
    team_leader_name = models.CharField(max_length=255, blank=True, null=True)
    
    date = models.DateTimeField(auto_now_add=True)
    reference_id = models.CharField(max_length=100, blank=True, help_text="ID de la commande ou facture associée")

class Asset(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Disponible'
        ISSUED = 'ISSUED', 'Remis / En service'
        MAINTENANCE = 'MAINTENANCE', 'En maintenance'
        LOST = 'LOST', 'Perdu / Volé'
        DAMAGED = 'DAMAGED', 'Endommagé'
        RETIRED = 'RETIRED', 'Réformé'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='assets')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='assets')
    serial_number = models.CharField(max_length=100, unique=True)
    internal_id = models.CharField(max_length=100, blank=True, null=True) # Barcode/QR
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    current_holder = models.ForeignKey('hr.FieldResource', on_delete=models.SET_NULL, null=True, blank=True, related_name='assets_in_possession')
    
    condition = models.CharField(max_length=50, default='GOOD')
    last_inspection_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} ({self.serial_number})"

    def save(self, *args, **kwargs):
        # Update product stock on save
        if not self.pk: # Only on creation
            if self.type == self.MovementType.IN:
                self.product.current_stock += self.quantity
            elif self.type == self.MovementType.OUT:
                self.product.current_stock -= self.quantity
            elif self.type == self.MovementType.ADJUSTMENT:
                # For adjustment, quantity is the NEW absolute value or a delta? 
                # Let's treat it as a delta for now to keep it simple.
                self.product.current_stock += self.quantity
            self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type} - {self.product.name} ({self.quantity})"
