process.env.NODE_ENV = 'test'; // Avoid server.listen
const app = require('./server');

const routes = [];

function printRoutes(stack, prefix = '') {
  stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      paths.forEach(p => {
        routes.push({ method: methods, path: prefix + p });
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      let routerPath = '';
      if (layer.regexp) {
        const match = layer.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace('^\\', '')
          .replace('^', '')
          .replace(/\\\//g, '/')
          .replace('(?=\\/|$)', '');
        routerPath = match;
      }
      printRoutes(layer.handle.stack, prefix + routerPath);
    }
  });
}

printRoutes(app._router.stack);

console.log(`Total Express endpoints mounted: ${routes.length}`);

// Test specific endpoints from frontend calls
const testEndpoints = [
  { m: 'GET', p: '/api/batches/active' },
  { m: 'GET', p: '/api/attendance/batch-roster' },
  { m: 'POST', p: '/api/attendance/mark-batch' },
  { m: 'GET', p: '/api/attendance/monthly-matrix' },
  { m: 'GET', p: '/api/auth/institute-lookup/TEST' },
  { m: 'POST', p: '/api/enquiries/public-submit' },
  { m: 'GET', p: '/api/enquiries/insights' },
  { m: 'POST', p: '/api/enquiries/123/convert-to-admission' },
  { m: 'POST', p: '/api/fees/send-reminder' },
  { m: 'PUT', p: '/api/complaints/123/resolve' },
  { m: 'PUT', p: '/api/leaves/123/status' },
  { m: 'PATCH', p: '/api/live-classes/123/toggle-live' },
  { m: 'GET', p: '/api/exams/123/roster' },
  { m: 'POST', p: '/api/exams/123/broadcast-results' },
  { m: 'GET', p: '/api/exams/student/123/report-card' },
  { m: 'GET', p: '/api/batches/123/students' },
  { m: 'GET', p: '/api/students/next-id' },
  { m: 'GET', p: '/api/reports/daily-register' },
  { m: 'GET', p: '/api/reports/defaulters' },
  { m: 'GET', p: '/api/reports/student-directory' },
  { m: 'GET', p: '/api/reports/financial-summary' },
  { m: 'GET', p: '/api/vault/files' },
  { m: 'POST', p: '/api/vault/chunk-upload' },
  { m: 'GET', p: '/api/exams/my-results' },
  { m: 'GET', p: '/api/homework/student-view' },
  { m: 'GET', p: '/api/announcements/student-view' },
  { m: 'GET', p: '/api/fees/my-ledger' },
  { m: 'GET', p: '/api/attendance/my-attendance' },
  { m: 'POST', p: '/api/attendance/scan-qr' },
  { m: 'POST', p: '/api/fees/student-pay' },
  { m: 'POST', p: '/api/auth/send-mobile-otp' },
  { m: 'POST', p: '/api/auth/student-mobile-login' },
  { m: 'GET', p: '/api/attendance/student-history/123' },
  { m: 'GET', p: '/api/leaves/my-leaves/123' },
  { m: 'GET', p: '/api/complaints/my-complaints/123' },
  { m: 'GET', p: '/api/fees/student/123' }
];

console.log('\n--- Checking Frontend Required Endpoints Against Backend ---');

let mismatches = 0;
testEndpoints.forEach(ep => {
  const pathRegex = new RegExp('^' + ep.p.replace(/123|TEST/g, '[^/]+') + '$');
  const found = routes.some(r => r.method.includes(ep.m) && pathRegex.test(r.path));
  if (found) {
    console.log(`  ✅ ${ep.m} ${ep.p} matched`);
  } else {
    console.log(`  ❌ MISMATCH / MISSING: ${ep.m} ${ep.p}`);
    mismatches++;
  }
});

console.log(`\nResult: ${testEndpoints.length - mismatches} / ${testEndpoints.length} endpoints verified.`);
process.exit(mismatches > 0 ? 1 : 0);
