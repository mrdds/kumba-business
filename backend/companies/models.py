from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255)
    sector = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='CI')
    currency = models.CharField(max_length=10, default='USD')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    SUBSCRIPTION_CHOICES = (
        ('FREE', 'Free'),
        ('PRO', 'Pro'),
        ('ENTERPRISE', 'Enterprise'),
    )
    subscription_plan = models.CharField(max_length=20, choices=SUBSCRIPTION_CHOICES, default='FREE')
    
    # New Fields
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True, verbose_name="Compte Contribuable")
    registration_number = models.CharField(max_length=100, blank=True, verbose_name="N° de Registre de Commerce")
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    kumba_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.kumba_id:
            import random
            # Simple Kumba ID generation: KMB + 7 random digits
            self.kumba_id = f"KMB{random.randint(1000000, 9999999)}"
            # Basic collision check (real implementation should be more robust)
            while Company.objects.filter(kumba_id=self.kumba_id).exists():
                self.kumba_id = f"KMB{random.randint(1000000, 9999999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
