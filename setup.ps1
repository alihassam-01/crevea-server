# Crevea Backend - Quick Setup Script

Write-Host "🚀 Setting up Crevea Backend..." -ForegroundColor Green

# Check if Docker is running
Write-Host "`n📦 Checking Docker..." -ForegroundColor Cyan
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green

# Start infrastructure
Write-Host "`n🐳 Starting infrastructure services..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Infrastructure started" -ForegroundColor Green

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Build shared package
Write-Host "`n🔨 Building shared package..." -ForegroundColor Cyan
npm run build --filter=@crevea/shared
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build shared package" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Shared package built" -ForegroundColor Green

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "`n📝 Creating .env file..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created (please update with your credentials)" -ForegroundColor Green
}

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Update .env with your credentials" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start all services" -ForegroundColor White
Write-Host "3. Or run individual services:" -ForegroundColor White
Write-Host "   - npm run dev --filter=@crevea/auth" -ForegroundColor Gray
Write-Host "   - npm run dev --filter=@crevea/shop" -ForegroundColor Gray
Write-Host "   - npm run dev --filter=@crevea/product" -ForegroundColor Gray
Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md - Quick start guide" -ForegroundColor White
Write-Host "   - STATUS.md - Implementation status" -ForegroundColor White
Write-Host "   - brain/service_guide.md - Service implementation guide" -ForegroundColor White
