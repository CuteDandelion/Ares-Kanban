/**
 * Tester Agent
 * 
 * Specialist agent for test generation, test execution, and coverage analysis.
 */

import { BaseAgent, TaskAnalysis, ExecutionPlan, ErrorRecovery } from '../base/BaseAgent';
import { Task, TaskResult, FileChange } from '@/types/agent';

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export interface CoverageReport {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export class TesterAgent extends BaseAgent {
  constructor(
    id: string,
    name: string = 'Tester Agent',
    config: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    super(
      id,
      name,
      'tester',
      [
        'unit-testing',
        'integration-testing',
        'e2e-testing',
        'test-generation',
        'coverage-analysis',
        'quality-assurance',
      ],
      {
        model: config.model || 'claude-3-sonnet',
        temperature: config.temperature || 0.3, // Lower temp for tests
        maxTokens: config.maxTokens || 4000,
        timeout: 300,
        retryAttempts: 3,
      }
    );
  }

  /**
   * Analyze a task for testing
   */
  async analyze(taskDescription: string): Promise<TaskAnalysis> {
    this.log('Analyzing testing task:', taskDescription.substring(0, 100) + '...');

    const testType = this.detectTestType(taskDescription);
    const complexity = this.assessTestComplexity(taskDescription);
    const estimatedDuration = this.estimateTestDuration(complexity, testType);

    return {
      complexity,
      estimatedDuration,
      requiredCapabilities: [testType, 'test-generation', 'coverage-analysis'],
      risks: [
        'Test coverage may not reach target',
        'Edge cases may be missed',
      ],
      recommendations: [
        'Write tests for happy path first',
        'Include edge cases and error scenarios',
        'Aim for >70% coverage',
      ],
    };
  }

  /**
   * Create execution plan for testing
   */
  async plan(task: Task): Promise<ExecutionPlan> {
    const analysis = await this.analyze(task.description || '');
    
    return {
      phases: [
        {
          order: 1,
          description: `Generate tests for: ${task.title}`,
          agentType: 'tester',
          estimatedDuration: analysis.estimatedDuration * 0.6,
          dependencies: [],
        },
        {
          order: 2,
          description: `Run tests and analyze coverage`,
          agentType: 'tester',
          estimatedDuration: analysis.estimatedDuration * 0.4,
          dependencies: [1],
        },
      ],
      estimatedDuration: analysis.estimatedDuration,
      complexity: analysis.complexity,
    };
  }

  /**
   * Execute testing task
   */
  async execute(task: Task): Promise<TaskResult> {
    this.log('Executing tests for:', task.title);

    try {
      // Phase 1: Generate tests
      this.log('Generating tests...');
      const testFiles = this.generateMockTests(task);
      
      // Phase 2: Run tests (mock)
      this.log('Running tests...');
      const testResults = this.runMockTests(testFiles);
      
      // Phase 3: Analyze coverage
      this.log('Analyzing coverage...');
      const coverage = this.calculateMockCoverage();
      
      // Determine success
      const allPassed = testResults.every(r => r.passed);
      const coverageMet = coverage.lines >= 70;
      
      if (!allPassed) {
        const failedTests = testResults.filter(r => !r.passed);
        return {
          success: false,
          output: `${failedTests.length} test(s) failed`,
          errors: failedTests.map(t => `${t.name}: ${t.error}`),
          fileChanges: testFiles,
          metadata: {
            testsRun: testResults.length,
            testsPassed: testResults.filter(r => r.passed).length,
            testsFailed: failedTests.length,
            coverage,
          },
        };
      }

      if (!coverageMet) {
        return {
          success: false,
          output: `Coverage ${coverage.lines}% is below 70% threshold`,
          fileChanges: testFiles,
          metadata: {
            testsRun: testResults.length,
            testsPassed: testResults.length,
            coverage,
          },
        };
      }

      return {
        success: true,
        output: `All ${testResults.length} tests passed with ${coverage.lines}% coverage`,
        fileChanges: testFiles,
        metadata: {
          testsRun: testResults.length,
          testsPassed: testResults.length,
          testsFailed: 0,
          coverage,
          testResults: testResults.map(r => ({
            name: r.name,
            passed: r.passed,
            duration: r.duration,
          })),
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error('Testing failed:', error as Error);
      
      return {
        success: false,
        output: 'Testing failed',
        errors: [errorMessage],
      };
    }
  }

  /**
   * Handle errors with specific recovery strategies
   */
  async onError(error: Error): Promise<ErrorRecovery> {
    this.error('Tester error:', error);

    if (error.message.includes('coverage') || error.message.includes('threshold')) {
      return {
        strategy: 'fail',
        reason: 'Coverage requirements not met',
      };
    }

    if (error.message.includes('test') && error.message.includes('fail')) {
      return {
        strategy: 'fail',
        reason: 'Tests failed - implementation needs fixing',
      };
    }

    return {
      strategy: 'retry',
      reason: error.message,
      retryDelay: 3000,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private detectTestType(description: string): string {
    if (/unit|unit test/i.test(description)) return 'unit-testing';
    if (/integration|e2e|end-to-end/i.test(description)) return 'integration-testing';
    if (/component/i.test(description)) return 'component-testing';
    return 'unit-testing';
  }

  private assessTestComplexity(description: string): 'low' | 'medium' | 'high' {
    const factors = [
      /complex|advanced/i.test(description),
      /integration|e2e/i.test(description),
      /multiple|several/i.test(description),
    ];
    
    const score = factors.filter(Boolean).length;
    if (score >= 2) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  private estimateTestDuration(complexity: 'low' | 'medium' | 'high', testType: string): number {
    const base = { low: 15, medium: 30, high: 60 };
    const multiplier = testType.includes('integration') ? 1.5 : 1;
    return Math.round(base[complexity] * multiplier);
  }

  private generateMockTests(task: Task): FileChange[] {
    const description = task.description || '';
    const targetFile = this.extractTargetFile(description);
    const testType = this.detectTestType(description);
    
    const changes: FileChange[] = [];
    
    if (testType === 'unit-testing') {
      // Generate unit test file
      const testFileName = targetFile 
        ? `${targetFile}.test.ts` 
        : 'implementation.test.ts';
      
      changes.push({
        path: `tests/${testFileName}`,
        operation: 'create',
        content: this.generateUnitTestContent(targetFile || 'implementation'),
      });
    }
    
    if (testType === 'integration-testing') {
      // Generate integration test
      changes.push({
        path: `tests/integration/${targetFile || 'api'}.test.ts`,
        operation: 'create',
        content: this.generateIntegrationTestContent(targetFile || 'api'),
      });
    }
    
    return changes;
  }

  private generateUnitTestContent(targetName: string): string {
    return `import { describe, it, expect } from '@jest/globals';
import { ${targetName} } from '../src/${targetName}';

describe('${targetName}', () => {
  it('should handle happy path correctly', () => {
    // Arrange
    const input = {};
    
    // Act
    const result = ${targetName}(input);
    
    // Assert
    expect(result).toBeDefined();
  });

  it('should handle error cases', () => {
    // Arrange
    const invalidInput = null;
    
    // Act & Assert
    expect(() => ${targetName}(invalidInput)).toThrow();
  });

  it('should handle edge cases', () => {
    // Arrange
    const edgeCase = {};
    
    // Act
    const result = ${targetName}(edgeCase);
    
    // Assert
    expect(result).toBeDefined();
  });
});`;
  }

  private generateIntegrationTestContent(targetName: string): string {
    return `import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('${targetName} Integration', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should complete full workflow', async () => {
    // Integration test implementation
    expect(true).toBe(true);
  });
});`;
  }

  private runMockTests(testFiles: FileChange[]): TestResult[] {
    const results: TestResult[] = [];
    
    for (const file of testFiles) {
      // Mock test results
      const testCount = Math.floor(Math.random() * 5) + 3; // 3-7 tests
      
      for (let i = 0; i < testCount; i++) {
        const passed = Math.random() > 0.1; // 90% pass rate
        results.push({
          name: `${file.path} - test ${i + 1}`,
          passed,
          duration: Math.floor(Math.random() * 100) + 10,
          error: passed ? undefined : 'Assertion failed',
        });
      }
    }
    
    return results;
  }

  private calculateMockCoverage(): CoverageReport {
    // Mock coverage - usually between 60-95%
    return {
      lines: Math.floor(Math.random() * 35) + 60,
      functions: Math.floor(Math.random() * 35) + 60,
      branches: Math.floor(Math.random() * 35) + 60,
      statements: Math.floor(Math.random() * 35) + 60,
    };
  }

  private extractTargetFile(description: string): string | null {
    // Try to extract file/component name from description
    const patterns = [
      /for\s+(\w+)/i,
      /test\s+(\w+)/i,
      /(\w+)\s+function/i,
      /(\w+)\s+component/i,
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) return match[1].toLowerCase();
    }
    
    return null;
  }
}
