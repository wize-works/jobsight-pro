# PowerShell script to standardize hook naming from camelCase to kebab-case
# This script will rename hook files and update their imports throughout the codebase

$workspaceRoot = "g:\code\@wizeworks\jobsight-pro-next"
$hooksDir = "$workspaceRoot\src\hooks"

# Define mappings of current camelCase names to kebab-case
$hookMappings = @{
    "useClients.ts" = "use-clients.ts"
    "useProjects.ts" = "use-projects.ts" 
    "useDailyLogs.ts" = "use-daily-logs.ts"
    "useTasks.ts" = "use-tasks.ts"
    "useUsers.ts" = "use-users.ts"
    "useAI.ts" = "use-ai.ts"
    "useBusiness.ts" = "use-business.ts"
    "useBusinessData.ts" = "use-business-data.ts"
    "useSubscriptions.ts" = "use-subscriptions.ts"
    "useStripe.ts" = "use-stripe.ts"
    "useResourceUtilization.ts" = "use-resource-utilization.ts"
    "useRateManagement.ts" = "use-rate-management.ts"
    "usePushSubscriptions.ts" = "use-push-subscriptions.ts"
    "usePdfGeneration.ts" = "use-pdf-generation.ts"
    "useNotificationTypePreferences.ts" = "use-notification-type-preferences.ts"
    "useNotifications.ts" = "use-notifications-api.ts"  # Rename to avoid conflict
    "useNotificationPreferences.ts" = "use-notification-preferences.ts"
    "useMediaTags.ts" = "use-media-tags.ts"
    "useMediaMetadata.ts" = "use-media-metadata.ts"
    "useMedia.ts" = "use-media.ts"
    "useInvoices.ts" = "use-invoices.ts"
    "useInvoiceItems.ts" = "use-invoice-items.ts"
    "useInvoiceAutomation.ts" = "use-invoice-automation.ts"
    "useFeedback.ts" = "use-feedback.ts"
    "useFeatureGate.ts" = "use-feature-gate.ts"
    "useEquipment.ts" = "use-equipment.ts"
    "useEmailVerification.ts" = "use-email-verification.ts"
    "useEmailNotifications.ts" = "use-email-notifications.ts"
    "useDashboard.ts" = "use-dashboard.ts"
}

Write-Host "Hook Standardization Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Function to update import statements in a file
function Update-ImportStatements {
    param(
        [string]$filePath,
        [hashtable]$mappings
    )
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    foreach ($oldName in $mappings.Keys) {
        $newName = $mappings[$oldName]
        $oldImportPattern = "from `"@/hooks/$($oldName.Replace('.ts', ''))`""
        $newImportPattern = "from `"@/hooks/$($newName.Replace('.ts', ''))`""
        
        $content = $content -replace [regex]::Escape($oldImportPattern), $newImportPattern
    }
    
    if ($content -ne $originalContent) {
        Set-Content $filePath $content -NoNewline
        Write-Host "Updated imports in: $filePath" -ForegroundColor Yellow
    }
}

# Phase 1: Rename hook files
Write-Host "`nPhase 1: Renaming hook files..." -ForegroundColor Cyan

foreach ($oldName in $hookMappings.Keys) {
    $newName = $hookMappings[$oldName]
    $oldPath = Join-Path $hooksDir $oldName
    $newPath = Join-Path $hooksDir $newName
    
    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Write-Host "WARNING: Target file already exists: $newName" -ForegroundColor Red
            Write-Host "You may need to manually merge: $oldName -> $newName" -ForegroundColor Red
        } else {
            Move-Item $oldPath $newPath
            Write-Host "Renamed: $oldName -> $newName" -ForegroundColor Green
        }
    } else {
        Write-Host "File not found: $oldName" -ForegroundColor Yellow
    }
}

# Phase 2: Update import statements throughout codebase
Write-Host "`nPhase 2: Updating import statements..." -ForegroundColor Cyan

$sourceFiles = Get-ChildItem -Path "$workspaceRoot\src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.Name -notlike "*.d.ts" }

foreach ($file in $sourceFiles) {
    Update-ImportStatements -filePath $file.FullName -mappings $hookMappings
}

Write-Host "`nHook standardization complete!" -ForegroundColor Green
Write-Host "Please review the changes and test your application." -ForegroundColor Yellow
