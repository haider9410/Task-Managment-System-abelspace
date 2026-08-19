<#
.SYNOPSIS
    AbleSpace - Run all services in one VS Code terminal.

.SERVICES
    MCP Server      : stdio
    Express API     : 5000
    AI Server       : 5001
    Next.js Client  : 3000

.USAGE
    .\run.ps1
    .\run.ps1 -Install
    .\run.ps1 -Dev
    .\run.ps1 -Stop

    Ctrl+C also stops all AbleSpace services.
#>

param(
    [switch]$Install,
    [switch]$Dev,
    [switch]$Stop
)

$ErrorActionPreference = "Continue"

$Root = $PSScriptRoot

# ============================================================
# FUNCTION: STOP ABLESPACE PROCESSES
# ============================================================

function Stop-AbleSpace {

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Yellow
    Write-Host "          STOPPING ABLESPACE SERVICES" -ForegroundColor Yellow
    Write-Host "==================================================" -ForegroundColor Yellow
    Write-Host ""

    $found = $false

    # --------------------------------------------------------
    # 1. STOP SERVICES BY PORT
    # --------------------------------------------------------

    $ports = @(3000, 5000, 5001)

    foreach ($port in $ports) {

        $connections = Get-NetTCPConnection `
            -LocalPort $port `
            -State Listen `
            -ErrorAction SilentlyContinue

        foreach ($connection in $connections) {

            $found = $true

            # IMPORTANT:
            # Do NOT use $pid here because PowerShell already
            # has the automatic $PID variable.

            $processId = $connection.OwningProcess

            $process = Get-Process `
                -Id $processId `
                -ErrorAction SilentlyContinue

            if ($process) {

                Write-Host `
                    "[PORT $port] Stopping $($process.ProcessName) (PID $processId)" `
                    -ForegroundColor Yellow

                try {

                    taskkill `
                        /PID $processId `
                        /T `
                        /F | Out-Null

                    Write-Host `
                        "[PORT $port] Stopped." `
                        -ForegroundColor Green

                }
                catch {

                    Write-Host `
                        "[PORT $port] Failed to stop PID $processId" `
                        -ForegroundColor Red
                }
            }
        }
    }

    # --------------------------------------------------------
    # 2. FIND ABLESPACE NODE PROCESSES
    #
    # This is especially important for MCP because MCP uses
    # stdio and therefore does NOT have a listening port.
    # --------------------------------------------------------

    Write-Host ""
    Write-Host "Checking AbleSpace Node processes..." -ForegroundColor Cyan

    $nodeProcesses = Get-CimInstance Win32_Process `
        -Filter "Name = 'node.exe'" `
        -ErrorAction SilentlyContinue

    foreach ($nodeProcess in $nodeProcesses) {

        $commandLine = $nodeProcess.CommandLine

        if ([string]::IsNullOrWhiteSpace($commandLine)) {
            continue
        }

        # Normalize paths so matching works consistently.
        $normalizedCommand = $commandLine.ToLower()
        $normalizedRoot = $Root.ToLower()

        # Only target Node processes belonging to this
        # AbleSpace project.
        if ($normalizedCommand.Contains($normalizedRoot)) {

            $found = $true

            $processId = $nodeProcess.ProcessId

            Write-Host `
                "[NODE] Stopping PID $processId" `
                -ForegroundColor Yellow

            Write-Host `
                "       $commandLine" `
                -ForegroundColor DarkGray

            try {

                taskkill `
                    /PID $processId `
                    /T `
                    /F | Out-Null

                Write-Host `
                    "[NODE] Stopped PID $processId" `
                    -ForegroundColor Green

            }
            catch {

                Write-Host `
                    "[NODE] Could not stop PID $processId" `
                    -ForegroundColor Red
            }
        }
    }

    # --------------------------------------------------------
    # 3. FIND NPM / CMD PROCESSES BELONGING TO CLIENT
    # --------------------------------------------------------

    $otherProcesses = Get-CimInstance Win32_Process `
        -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -in @("npm.cmd", "cmd.exe") -and
            $_.CommandLine -and
            $_.CommandLine.ToLower().Contains($Root.ToLower())
        }

    foreach ($process in $otherProcesses) {

        $found = $true

        $processId = $process.ProcessId

        Write-Host `
            "[CLIENT PROCESS] Stopping PID $processId" `
            -ForegroundColor Yellow

        try {

            taskkill `
                /PID $processId `
                /T `
                /F | Out-Null

            Write-Host `
                "[CLIENT PROCESS] Stopped." `
                -ForegroundColor Green

        }
        catch {
        }
    }

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    Write-Host ""

    if ($found) {

        Write-Host `
            "AbleSpace services stopped successfully." `
            -ForegroundColor Green

    }
    else {

        Write-Host `
            "No AbleSpace services were found running." `
            -ForegroundColor Green
    }

    Write-Host ""
}

# ============================================================
# STOP MODE
# ============================================================

if ($Stop) {

    Stop-AbleSpace

    exit 0
}

# ============================================================
# NODE
# ============================================================

$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "              ABLESPACE STARTUP" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Root: $Root" -ForegroundColor DarkGray
Write-Host "Node: $nodeExe" -ForegroundColor DarkGray

# ============================================================
# SERVICES
# ============================================================

$Services = @(
    @{
        Name = "MCP"
        Folder = "backend/mcp-server"
        Command = "node index.js"
    },
    @{
        Name = "SERVER"
        Folder = "backend/server"
        Command = "node server.js"
    },
    @{
        Name = "AI"
        Folder = "backend/ai-server"
        Command = "node index.js"
    },
    @{
        Name = "CLIENT"
        Folder = "frontend"
        Command = "npm run dev"
    }
)

# ============================================================
# INSTALL
# ============================================================

if ($Install) {

    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Write-Host ""

    foreach ($service in $Services) {

        $folder = Join-Path $Root $service.Folder

        if (-not (Test-Path $folder)) {

            Write-Host `
                "[$($service.Name)] Folder not found: $folder" `
                -ForegroundColor Red

            exit 1
        }

        Write-Host `
            "[$($service.Name)] npm install" `
            -ForegroundColor Yellow

        Push-Location $folder

        try {

            npm install

            if ($LASTEXITCODE -ne 0) {

                Write-Host `
                    "[$($service.Name)] npm install failed." `
                    -ForegroundColor Red

                exit 1
            }

        }
        finally {

            Pop-Location
        }

        Write-Host ""
    }

    Write-Host `
        "All dependencies installed successfully." `
        -ForegroundColor Green
}

# ============================================================
# CHECK NODE_MODULES
# ============================================================

foreach ($service in $Services) {

    $folder = Join-Path $Root $service.Folder

    if (-not (Test-Path $folder)) {

        Write-Host ""
        Write-Host `
            "[$($service.Name)] Folder not found." `
            -ForegroundColor Red

        exit 1
    }

    $modules = Join-Path $folder "node_modules"

    if (-not (Test-Path $modules)) {

        Write-Host ""
        Write-Host `
            "[$($service.Name)] node_modules not found." `
            -ForegroundColor Red

        Write-Host `
            "Run: .\run.ps1 -Install" `
            -ForegroundColor Yellow

        exit 1
    }
}

# ============================================================
# BACKGROUND JOBS
# ============================================================

$jobs = @()

function Start-AbleSpaceJob {

    param(
        [string]$Name,
        [string]$Folder,
        [string]$Command,
        [bool]$DevMode
    )

    $servicePath = Join-Path $Root $Folder

    Write-Host ""
    Write-Host `
        "[$Name] Starting..." `
        -ForegroundColor Green

    $job = Start-Job `
        -Name "AbleSpace-$Name" `
        -ScriptBlock {

            param(
                $ServicePath,
                $Command,
                $DevMode
            )

            Set-Location $ServicePath

            # ------------------------------------------------
            # NEXT.JS
            # ------------------------------------------------

            if ($Command -eq "npm run dev") {

                npm run dev

                return
            }

            # ------------------------------------------------
            # NODE SERVICES
            # ------------------------------------------------

            if ($DevMode) {

                if ($Command -eq "node server.js") {

                    node --watch server.js

                }
                elseif ($Command -eq "node index.js") {

                    node --watch index.js

                }
            }
            else {

                if ($Command -eq "node server.js") {

                    node server.js

                }
                elseif ($Command -eq "node index.js") {

                    node index.js
                }
            }

        } `
        -ArgumentList $servicePath, $Command, $DevMode

    return $job
}

# ============================================================
# START MCP
# ============================================================

$mcpJob = Start-AbleSpaceJob `
    -Name "MCP" `
    -Folder "backend/mcp-server" `
    -Command "node index.js" `
    -DevMode $false

$jobs += $mcpJob

# ============================================================
# START SERVER
# ============================================================

$serverJob = Start-AbleSpaceJob `
    -Name "SERVER" `
    -Folder "backend/server" `
    -Command "node server.js" `
    -DevMode $Dev

$jobs += $serverJob

# ============================================================
# START AI
# ============================================================

$aiJob = Start-AbleSpaceJob `
    -Name "AI" `
    -Folder "backend/ai-server" `
    -Command "node index.js" `
    -DevMode $Dev

$jobs += $aiJob

# ============================================================
# START CLIENT
# ============================================================

$clientJob = Start-AbleSpaceJob `
    -Name "CLIENT" `
    -Folder "frontend" `
    -Command "npm run dev" `
    -DevMode $false

$jobs += $clientJob

# ============================================================
# STARTUP COMPLETE
# ============================================================

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "        ALL ABLESPACE SERVICES STARTED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

Write-Host "[CLIENT]  http://localhost:3000" -ForegroundColor Cyan
Write-Host "[SERVER]  http://localhost:5000" -ForegroundColor Cyan
Write-Host "[AI]      http://localhost:5001" -ForegroundColor Cyan
Write-Host "[MCP]     stdio" -ForegroundColor Cyan

Write-Host ""

if ($Dev) {

    Write-Host `
        "Development mode: ON" `
        -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Live service output:" -ForegroundColor White
Write-Host "--------------------------------------------------" -ForegroundColor DarkGray

# ============================================================
# OUTPUT FUNCTION
# ============================================================

function Write-ServiceOutput {

    param(
        [string]$Name,
        [string]$Text
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return
    }

    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host `
        "[$timestamp][$Name] $Text"
}

# ============================================================
# MONITOR
# ============================================================

try {

    while ($true) {

        foreach ($job in $jobs) {

            $output = Receive-Job `
                -Job $job `
                -ErrorAction SilentlyContinue

            foreach ($line in $output) {

                Write-ServiceOutput `
                    -Name $job.Name.Replace("AbleSpace-", "") `
                    -Text "$line"
            }

            if ($job.State -eq "Failed") {

                Write-Host ""

                Write-Host `
                    "[$($job.Name)] PROCESS FAILED" `
                    -ForegroundColor Red

                $reason = $job.ChildJobs[0].JobStateInfo.Reason

                if ($reason) {

                    Write-Host `
                        $reason `
                        -ForegroundColor Red
                }
            }
        }

        Start-Sleep -Milliseconds 200
    }

}
finally {

    Write-Host ""
    Write-Host "Stopping AbleSpace..." -ForegroundColor Yellow
    Write-Host ""

    # Stop PowerShell jobs
    foreach ($job in $jobs) {

        try {

            Write-Host `
                "Stopping $($job.Name)..." `
                -ForegroundColor Yellow

            Stop-Job `
                -Job $job `
                -ErrorAction SilentlyContinue

            Remove-Job `
                -Job $job `
                -Force `
                -ErrorAction SilentlyContinue

        }
        catch {
        }
    }

    # Stop any remaining AbleSpace Node processes
    # and services on the known ports.

    Stop-AbleSpace

}
