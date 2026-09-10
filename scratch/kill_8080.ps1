$conns = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($conns) {
    foreach ($c in $conns) {
        Write-Host "Killing process on 8080 PID:" $c.OwningProcess
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "Port 8080 is free."
}
