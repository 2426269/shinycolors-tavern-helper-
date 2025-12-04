# 偶像大师闪耀色彩 - 增加内存限制的打包脚本
# 使用方法：在项目根目录运行 .\build-with-memory.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " 偶像大师闪耀色彩 - 构建脚本" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 设置 Node.js 内存限制为 4GB
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Host "✓ 已设置 Node.js 内存限制: 4 GB" -ForegroundColor Green
Write-Host "✓ 开始构建项目..." -ForegroundColor Green
Write-Host ""

# 运行构建
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host " ✓ 构建成功！" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "构建文件位置: dist/" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host " ✗ 构建失败！" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
}







