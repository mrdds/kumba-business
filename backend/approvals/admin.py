from django.contrib import admin
from .models import ApprovalDefinition, ApprovalStep, ApprovalRequest, ApprovalLog

class ApprovalStepInline(admin.TabularInline):
    model = ApprovalStep
    extra = 1

@admin.register(ApprovalDefinition)
class ApprovalDefinitionAdmin(admin.ModelAdmin):
    list_display = ('content_type', 'company', 'trigger_amount_min', 'is_active')
    list_filter = ('company', 'is_active')
    inlines = [ApprovalStepInline]

@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'content_type', 'object_id', 'status', 'current_step', 'created_by')
    list_filter = ('status', 'company')
    date_hierarchy = 'created_at'

@admin.register(ApprovalLog)
class ApprovalLogAdmin(admin.ModelAdmin):
    list_display = ('request', 'actor', 'action', 'timestamp')
    list_filter = ('action',)
