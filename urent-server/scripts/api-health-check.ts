import { env } from '../src/config/env';

const BASE_URL = `http://localhost:${process.env.PORT || env.port}`;

const ENDPOINTS = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/api-docs.json' },
  { 
    method: 'POST', 
    path: '/api/v1/auth/check-login-identity',
    body: { identifier: 'test@example.com' }
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    body: { email: 'nonexistent@example.com', password: 'password123' },
    // 401 Unauthorized means the route is working and validated the request correctly
    expectedStatus: 401
  },
  {
    method: 'GET',
    path: '/api/v1/auth/me',
    // 401 Unauthorized because we don't send a token
    expectedStatus: 401 
  },
  {
    method: 'GET',
    path: '/api/v1/products', 
    expectedStatus: [401] // Bị chặn bởi authGuard
  },
  {
    method: 'POST',
    path: '/debug-post',
    body: { test: 123 },
    expectedStatus: 200
  }
];

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testEndpoints() {
  console.log(`\n${colors.blue}🚀 Bắt đầu kiểm tra API tại: ${BASE_URL}${colors.reset}\n`);
  
  let passed = 0;
  let failed = 0;

  for (const endpoint of ENDPOINTS) {
    const url = `${BASE_URL}${endpoint.path}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: AbortSignal.timeout(15000) // 15 giây timeout
      });

      const duration = Date.now() - startTime;
      const status = response.status;
      
      let isSuccess = false;
      if (endpoint.expectedStatus) {
        if (Array.isArray(endpoint.expectedStatus)) {
          isSuccess = endpoint.expectedStatus.includes(status);
        } else {
          isSuccess = status === endpoint.expectedStatus;
        }
      } else {
        isSuccess = status >= 200 && status < 300;
      }

      if (isSuccess) {
        passed++;
        console.log(`${colors.green}✅ [PASS]${colors.reset} ${endpoint.method} ${endpoint.path} (${status}) - ${duration}ms`);
      } else {
        failed++;
        console.log(`${colors.red}❌ [FAIL]${colors.reset} ${endpoint.method} ${endpoint.path} (Nhận được: ${status}, Mong đợi: ${endpoint.expectedStatus || '2xx'}) - ${duration}ms`);
        
        // In thêm body để debug nếu cần
        try {
          const body = await response.json();
          console.log(`   ${colors.yellow}Phản hồi:${colors.reset}`, body);
        } catch {
          console.log(`   ${colors.yellow}Phản hồi:${colors.reset} Không phải JSON`);
        }
      }
    } catch (error: any) {
      failed++;
      const duration = Date.now() - startTime;
      console.log(`${colors.red}❌ [ERROR]${colors.reset} ${endpoint.method} ${endpoint.path} - ${error.message} - ${duration}ms`);
    }
  }

  console.log(`\n${colors.blue}📊 KẾT QUẢ TỔNG QUAN:${colors.reset}`);
  console.log(`Tổng số: ${ENDPOINTS.length}`);
  console.log(`${colors.green}Thành công: ${passed}${colors.reset}`);
  
  if (failed > 0) {
    console.log(`${colors.red}Thất bại: ${failed}${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}Tất cả các API được chỉ định đều hoạt động ổn định! 🎉${colors.reset}`);
    process.exit(0);
  }
}

testEndpoints();
