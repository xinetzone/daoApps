# push-apps-to-github.ps1
# 将 daoApps/apps 下的每个前端子应用初始化为独立 Git 仓库并推送到 GitHub daoApps 组织
#
# 依赖: GitHub CLI (gh) 已安装并登录
#
# 使用方式（二选一）:
#   方式一: gh auth login 已完成登录，直接运行
#     & ".\scripts\push-apps-to-github.ps1"
#
#   方式二: 通过环境变量传入 Token
#     $env:GITHUB_TOKEN = "your_personal_access_token"
#     & ".\scripts\push-apps-to-github.ps1"
#
# Token 需要具备: repo + read:org 权限

param(
    [string]$AppsDir = "",
    [string]$Org = "daoApps",
    [string]$Branch = "main",
    [string]$CommitMessage = "Initial commit"
)

# ── 颜色输出辅助函数 ──────────────────────────────────────────────────────────
function Write-Step  { param([string]$msg) Write-Host "  >> $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Skip  { param([string]$msg) Write-Host "  [SKIP] $msg" -ForegroundColor Yellow }
function Write-Err   { param([string]$msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }
function Write-Title { param([string]$msg) Write-Host "`n==============================`n $msg`n==============================" -ForegroundColor Magenta }

# ── 检查 gh 是否可用 ──────────────────────────────────────────────────────────
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Err "未找到 gh 命令，请先安装 GitHub CLI: https://cli.github.com/"
    exit 1
}

# ── 检查 gh 认证状态 ──────────────────────────────────────────────────────────
# 若已设置 GITHUB_TOKEN 环境变量，gh 会自动使用；否则依赖 gh auth login 的会话
Write-Step "检查 gh 认证状态"
$AuthStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    if ($env:GITHUB_TOKEN) {
        Write-Skip "gh auth status 检查未通过，但检测到 GITHUB_TOKEN 环境变量，继续执行"
    }
    else {
        Write-Err "gh 未登录，请先执行 'gh auth login' 或设置 GITHUB_TOKEN 环境变量"
        exit 1
    }
}
else {
    Write-Ok "gh 认证正常"
}

# ── 确定 apps 目录 ────────────────────────────────────────────────────────────
if (-not $AppsDir) {
    # 脚本位于 daoApps/scripts/，apps 位于 daoApps/../apps/
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $AppsDir   = Join-Path (Split-Path -Parent $ScriptDir) ".." | Resolve-Path
    $AppsDir   = Join-Path $AppsDir "apps"
}

if (-not (Test-Path $AppsDir)) {
    Write-Err "apps 目录不存在: $AppsDir"
    exit 1
}

Write-Host "`n[配置] Org=$Org  Branch=$Branch  AppsDir=$AppsDir`n" -ForegroundColor DarkGray

# ── gh 辅助：创建组织仓库 ─────────────────────────────────────────────────────
function New-GitHubRepo {
    param([string]$RepoName)

    # 先检查仓库是否已存在
    $CheckOutput = gh repo view "$Org/$RepoName" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Skip "GitHub 仓库已存在，跳过创建: $Org/$RepoName"
        return $true
    }

    # 创建公开仓库（不自动初始化，由本地推送）
    Write-Step "gh repo create $Org/$RepoName --public"
    $CreateOutput = gh repo create "$Org/$RepoName" `
        --public `
        --description "$RepoName - part of daoApps" `
        2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Err "创建 GitHub 仓库失败 ($RepoName): $CreateOutput"
        return $false
    }

    Write-Ok "GitHub 仓库已创建: https://github.com/$Org/$RepoName"
    return $true
}

# ── 主循环 ─────────────────────────────────────────────────────────────────────
$Apps = Get-ChildItem -Path $AppsDir -Directory
$Total = $Apps.Count
$Index = 0
$Success = 0
$Failed  = @()

foreach ($App in $Apps) {
    $Index++
    $AppName = $App.Name
    $AppPath = $App.FullName
    Write-Title "[$Index/$Total] $AppName"

    # 1. git init（若已存在 .git 则跳过）
    $GitDir = Join-Path $AppPath ".git"
    if (Test-Path $GitDir) {
        Write-Skip "已存在 .git 目录，跳过 git init"
    }
    else {
        Write-Step "git init -b $Branch"
        git -C $AppPath init -b $Branch 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Err "git init 失败，跳过该应用"
            $Failed += $AppName
            continue
        }
        Write-Ok "git init 完成"
    }

    # 2. git add .
    Write-Step "git add ."
    git -C $AppPath add . 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Err "git add 失败，跳过该应用"
        $Failed += $AppName
        continue
    }
    Write-Ok "git add 完成"

    # 3. git commit（若已有 commits 则跳过）
    $HasCommits = git -C $AppPath log --oneline -1 2>$null
    if ($HasCommits) {
        Write-Skip "已有提交记录，跳过 commit"
    }
    else {
        Write-Step "git commit -m `"$CommitMessage`""
        git -C $AppPath commit -m $CommitMessage 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Err "git commit 失败（可能没有文件可提交），跳过该应用"
            $Failed += $AppName
            continue
        }
        Write-Ok "git commit 完成"
    }

    # 4. 通过 gh 创建 GitHub 仓库
    $Created = New-GitHubRepo -RepoName $AppName
    if (-not $Created) {
        $Failed += $AppName
        continue
    }

    # 5. 设置 remote origin（使用标准 HTTPS，gh 负责认证）
    $RemoteUrl = "https://github.com/$Org/$AppName.git"
    $ExistingRemote = git -C $AppPath remote 2>&1
    if ($ExistingRemote -contains "origin") {
        Write-Step "更新 remote origin URL"
        git -C $AppPath remote set-url origin $RemoteUrl 2>&1 | Out-Null
    }
    else {
        Write-Step "添加 remote origin"
        git -C $AppPath remote add origin $RemoteUrl 2>&1 | Out-Null
    }
    Write-Ok "remote origin 已设置: $RemoteUrl"

    # 6. git push（gh 的凭据助手会自动处理认证）
    Write-Step "git push -u origin $Branch"
    $PushOutput = git -C $AppPath push -u origin $Branch 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "git push 失败: $PushOutput"
        $Failed += $AppName
        continue
    }
    Write-Ok "推送成功: https://github.com/$Org/$AppName"
    $Success++
}

# ── 汇总报告 ──────────────────────────────────────────────────────────────────
Write-Host "`n=============================="  -ForegroundColor Magenta
Write-Host " 执行完毕  成功: $Success / $Total" -ForegroundColor Magenta
Write-Host "==============================`n"  -ForegroundColor Magenta

if ($Failed.Count -gt 0) {
    Write-Host "以下应用处理失败，请手动检查：" -ForegroundColor Red
    $Failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
else {
    Write-Host "所有应用均已成功推送到 https://github.com/$Org" -ForegroundColor Green
}
