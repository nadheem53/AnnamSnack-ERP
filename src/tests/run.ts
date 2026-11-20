import { runBenchmarkVerificationSuite } from './benchmark.test';

async function main() {
  console.log('🧪 Starting NIT Tiruchirappalli Automated Verification Suite...\n');
  const result = await runBenchmarkVerificationSuite();

  result.log.forEach((line) => console.log(line));
  console.log(`\n========================================`);
  console.log(`Summary: ${result.passed} Passed, ${result.failed} Failed.`);
  console.log(`========================================\n`);

  if (result.failed > 0) {
    console.error('❌ SOME BENCHMARK CHECKS FAILED!');
    process.exit(1);
  } else {
    console.log('✨ ALL 25+ NIT TIRUCHIRAPPALLI BENCHMARK TESTS PASSED WITH 100% PRECISION!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

