# Spine资源整理脚本 - 最终版
# 编码: UTF-8 with BOM

$MappingFile = 'E:\偶像大师\spine资源\卡牌映射.txt'
$SpineDir = 'E:\偶像大师\spine资源'
$OutputDir = 'E:\偶像大师\闪耀色彩图片-最终版\spine'

Write-Host ('=' * 80) -ForegroundColor Cyan
Write-Host 'Spine资源整理脚本开始执行' -ForegroundColor Cyan
Write-Host ('=' * 80) -ForegroundColor Cyan

# 加载卡牌映射
Write-Host '
步骤1: 加载卡牌映射...' -ForegroundColor Yellow
. $MappingFile
Write-Host "  成功加载 $($cardMapping.Count) 张卡牌映射" -ForegroundColor Green

# 偶像映射
$idolMapping = @{
    '104001' = '樱木真乃'; '104002' = '风野灯织'; '104003' = '八宫惠'
    '104004' = '月冈恋钟'; '104005' = '田中摩美美'; '104006' = '白濑咲耶'
    '104007' = '三峰结华'; '104008' = '幽谷雾子'; '104009' = '小宫果穗'
    '104010' = '园田智代子'; '104011' = '西城树里'; '104012' = '杜野凛世'
    '104013' = '有栖川夏叶'; '104014' = '大崎甘奈'; '104015' = '大崎甜花'
    '104016' = '桑山千雪'; '104017' = '芹泽朝日'; '104018' = '黛冬优子'
    '104019' = '和泉爱依'; '104020' = '浅仓透'; '104021' = '樋口円香'
    '104022' = '福丸小糸'; '104023' = '市川雛菜'; '104024' = '七草花梨'
    '104025' = '绯田美琴'; '104026' = '斑鸠露卡'; '104027' = '铃木羽那'
    '104028' = '郁田春树'; '104801' = 'Ruby'; '104802' = '有马加奈'; '104803' = 'MEMcho'
}

Write-Host '
步骤2: 创建偶像文件夹...' -ForegroundColor Yellow
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null }
foreach ($idol in $idolMapping.Values | Select-Object -Unique) {
    $path = Join-Path $OutputDir $idol
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }
}

Write-Host '
步骤3: 处理文件夹...' -ForegroundColor Yellow
$processed = 0; $errors = 0; $skipped = 0
Get-ChildItem -Path $SpineDir -Directory -Recurse | ForEach-Object {
    if ($_.Name -match '^\d+_(\d+)_stand(_costume)?$') {
        $cardId = $Matches[1]; $isCostume = $Matches[2] -ne $null
        if ($cardMapping.ContainsKey($cardId)) {
            $name = $cardMapping[$cardId]
            if ($isCostume) { $name += ' 偶像服' }
            Write-Host "处理: $($_.Name) -> $name"
            try {
                $temp = Join-Path $_.Parent.FullName "$($_.Name)_tmp$(Get-Random)"
                Copy-Item $_.FullName $temp -Recurse -Force
                $atlas = Join-Path $temp 'data.atlas'
                if (Test-Path $atlas) {
                    (Get-Content $atlas -Raw) -replace 'data\.png', "$name.png" | Set-Content $atlas
                    Move-Item $atlas (Join-Path $temp "$name.atlas") -Force
                }
                if (Test-Path (Join-Path $temp 'data.json')) { Move-Item (Join-Path $temp 'data.json') (Join-Path $temp "$name.json") -Force }
                if (Test-Path (Join-Path $temp 'data.png')) { Move-Item (Join-Path $temp 'data.png') (Join-Path $temp "$name.png") -Force }
                $idolKey = $cardId.Substring(0,6); $idol = $idolMapping[$idolKey]
                if ($idol) { $final = Join-Path (Join-Path $OutputDir $idol) $name } else { $final = Join-Path (Join-Path $OutputDir '未分类') $name }
                if (Test-Path $final) { Remove-Item $final -Recurse -Force }
                Move-Item $temp $final -Force
                Remove-Item $_.FullName -Recurse -Force
                $processed++
            } catch { Write-Host "  错误: $_" -ForegroundColor Red; $errors++; if (Test-Path $temp) { Remove-Item $temp -Recurse -Force } }
        } else { $skipped++ }
    }
}

Write-Host "
完成! 成功:$processed 失败:$errors 跳过:$skipped" -ForegroundColor Green
Read-Host '按Enter退出'