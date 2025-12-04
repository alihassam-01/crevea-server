# Service Template Generator Script
# This script helps create new microservices quickly

$serviceName = $args[0]
if (-not $serviceName) {
    Write-Host "Usage: .\create-service.ps1 <service-name>"
    exit 1
}

$servicePort = $args[1]
if (-not $servicePort) {
    Write-Host "Usage: .\create-service.ps1 <service-name> <port>"
    exit 1
}

$servicePath = "services\$serviceName"

# Create directory structure
New-Item -ItemType Directory -Force -Path "$servicePath\src\config"
New-Item -ItemType Directory -Force -Path "$servicePath\src\routes"
New-Item -ItemType Directory -Force -Path "$servicePath\src\controllers"
New-Item -ItemType Directory -Force -Path "$servicePath\src\services"
New-Item -ItemType Directory -Force -Path "$servicePath\src\models"

Write-Host "✅ Created service structure for $serviceName"
Write-Host "📝 Next steps:"
Write-Host "   1. Update package.json"
Write-Host "   2. Create database schema in config/database.ts"
Write-Host "   3. Add routes in routes/"
Write-Host "   4. Implement controllers and services"
