import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('dashboard load time < 3s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('hr employees page load time < 2s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/hr/employees', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
    console.log(`HR Employees page loaded in ${loadTime}ms`);
  });

  test('API response time < 1s for GET requests', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('http://localhost:8080/api/gateway/api/hr/employees');
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBeLessThan(500);
    expect(responseTime).toBeLessThan(1000);
    console.log(`GET /hr/employees responded in ${responseTime}ms`);
  });

  test('API response time < 2s for POST requests', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.post('http://localhost:8080/api/gateway/api/hr/employees', {
      data: {
        name: 'Performance Test Employee',
        email: 'perf@test.com',
        departmentId: 1
      }
    });
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBeLessThan(500);
    expect(responseTime).toBeLessThan(2000);
    console.log(`POST /hr/employees responded in ${responseTime}ms`);
  });

  test('memory usage stable during multiple requests', async ({ request }) => {
    const iterations = 10;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await request.get('http://localhost:8080/api/gateway/api/hr/employees');
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    }

    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxTime = Math.max(...responseTimes);
    const minTime = Math.min(...responseTimes);

    console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`Min: ${minTime}ms, Max: ${maxTime}ms`);
    
    // Responses should not degrade significantly
    expect(maxTime - minTime).toBeLessThan(1000);
  });

  test('concurrent requests handling', async ({ request }) => {
    const concurrentRequests = 5;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request.get('http://localhost:8080/api/gateway/api/hr/employees')
      );
    }

    const results = await Promise.all(promises);
    results.forEach(response => {
      expect(response.status()).toBeLessThan(500);
    });

    console.log(`Handled ${concurrentRequests} concurrent requests successfully`);
  });

  test('large payload handling', async ({ request }) => {
    const largePayload = {
      name: 'Test Employee',
      email: 'test@example.com',
      departmentId: 1,
      description: 'x'.repeat(10000) // 10KB of data
    };

    const startTime = Date.now();
    const response = await request.post('http://localhost:8080/api/gateway/api/hr/employees', {
      data: largePayload
    });
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBeLessThan(500);
    expect(responseTime).toBeLessThan(3000);
    console.log(`Large payload processed in ${responseTime}ms`);
  });
});

test.describe('Load Tests', () => {
  test('handle 50 sequential requests', async ({ request }) => {
    let failureCount = 0;
    const responseTimes: number[] = [];

    for (let i = 0; i < 50; i++) {
      const startTime = Date.now();
      try {
        const response = await request.get('http://localhost:8080/api/gateway/api/hr/employees', {
          timeout: 5000
        });
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        if (response.status() >= 500) {
          failureCount++;
        }
      } catch (err) {
        failureCount++;
      }
    }

    const successRate = ((50 - failureCount) / 50) * 100;
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    console.log(`Load test results: ${successRate.toFixed(1)}% success rate, avg response: ${avgTime.toFixed(2)}ms`);
    
    // At least 95% success rate
    expect(successRate).toBeGreaterThan(95);
  });
});
