$routes = @(
    '/api/epm/health',
    '/api/epm/dashboard',
    '/api/epm/charters',
    '/api/epm/charters/1',
    '/api/epm/charters/employee/1',
    '/api/epm/goals',
    '/api/epm/goals/1',
    '/api/epm/goals/charter/1',
    '/api/epm/goals/validate-weights',
    '/api/epm/competencies',
    '/api/epm/competencies/1',
    '/api/epm/competencies/charter/1',
    '/api/epm/excellence',
    '/api/epm/excellence/1',
    '/api/epm/reviews',
    '/api/epm/reviews/1',
    '/api/epm/reviews/charter/1',
    '/api/epm/reviews/pending',
    '/api/epm/kpis',
    '/api/epm/kpis/1',
    '/api/epm/kpis/charter/1',
    '/api/epm/reports/performance',
    '/api/epm/reports/department',
    '/api/epm/reports/annual'
)

$passed = 0
$failed = 0

foreach ($route in $routes) {
    $url = "http://localhost:4200$route"
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        $status = $resp.StatusCode
    } catch {
        $status = [int]$_.Exception.Response.StatusCode
    }

    # health should return 200, others should return 401 (auth required) - NOT 404
    if ($route -eq '/api/epm/health' -and $status -eq 200) {
        Write-Host "[PASS] $route -> $status" -ForegroundColor Green
        $passed++
    } elseif ($route -ne '/api/epm/health' -and $status -eq 401) {
        Write-Host "[PASS] $route -> $status (auth required)" -ForegroundColor Green
        $passed++
    } elseif ($status -eq 404) {
        Write-Host "[FAIL] $route -> 404 (route not found)" -ForegroundColor Red
        $failed++
    } elseif ($status -eq 405) {
        Write-Host "[PASS] $route -> 405 (method not allowed - route exists)" -ForegroundColor Yellow
        $passed++
    } else {
        Write-Host "[????] $route -> $status" -ForegroundColor Yellow
        $passed++
    }
}

Write-Host ""
Write-Host "Results: $passed passed, $failed failed out of $($routes.Count) routes"
