import { runBenchmarkVerificationSuite } from './benchmark.test';
import { runApiDatabaseBenchmarkSuite } from './api_benchmark.test';

async function main() {
  console.log('🧪 Starting NIT Tiruchirappalli Automated Verification Suite...\n');
  
  // 1. Math & Ledger Formula Suite
  const mathResult = await runBenchmarkVerificationSuite();
  mathResult.log.forEach((line) => console.log(line));
  console.log(`\nMathematical Checks: ${mathResult.passed} Passed, ${mathResult.failed} Failed.\n`);

  // 2. Real Database, Prisma, Auth & RBAC Suite
  const dbResult = await runApiDatabaseBenchmarkSuite();
  dbResult.log.forEach((line) => console.log(line));
  console.log(`\nDatabase & Auth Checks: ${dbResult.passed} Passed, ${dbResult.failed} Failed.\n`);

  const totalPassed = mathResult.passed + dbResult.passed;
  const totalFailed = mathResult.failed + dbResult.failed;

  console.log(`================================================================`);
  console.log(`TOTAL AUDIT RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED.`);
  console.log(`================================================================\n`);

  if (totalFailed > 0) {
    console.error('❌ SOME CHECKS FAILED!');
    process.exit(1);
  } else {
    console.log('✨ ALL 45+ NIT TIRUCHIRAPPALLI BENCHMARK & DATABASE TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
