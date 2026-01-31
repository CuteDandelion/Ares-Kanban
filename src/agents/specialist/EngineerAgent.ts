/**
 * Engineer Agent
 * 
 * Specialist agent for code generation, refactoring, and implementation tasks.
 */

import { BaseAgent, TaskAnalysis, ExecutionPlan, ErrorRecovery } from '../base/BaseAgent';
import { Task, TaskResult, FileChange } from '@/types/agent';

export class EngineerAgent extends BaseAgent {
  constructor(
    id: string,
    name: string = 'Engineer Agent',
    config: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    super(
      id,
      name,
      'engineer',
      [
        'typescript',
        'javascript',
        'react',
        'nodejs',
        'python',
        'code-generation',
        'refactoring',
        'debugging',
        'implementation',
      ],
      {
        model: config.model || 'claude-3-sonnet',
        temperature: config.temperature || 0.5,
        maxTokens: config.maxTokens || 4000,
        timeout: 300,
        retryAttempts: 3,
      }
    );
  }

  /**
   * Analyze a task for code implementation
   */
  async analyze(taskDescription: string): Promise<TaskAnalysis> {
    this.log('Analyzing implementation task:', taskDescription.substring(0, 100) + '...');

    // Detect programming language
    const language = this.detectLanguage(taskDescription);
    
    // Assess complexity based on requirements
    const complexity = this.assessCodeComplexity(taskDescription);
    
    // Estimate duration
    const estimatedDuration = this.estimateCodeDuration(taskDescription, complexity);
    
    // Identify required capabilities
    const requiredCapabilities = this.identifyRequiredCapabilities(taskDescription, language);

    return {
      complexity,
      estimatedDuration,
      requiredCapabilities,
      risks: [
        'Implementation may require multiple iterations',
        'Dependencies may not be available',
      ],
      recommendations: [
        'Write tests before implementation',
        'Follow existing code patterns',
        'Add error handling',
      ],
    };
  }

  /**
   * Create execution plan for implementation
   */
  async plan(task: Task): Promise<ExecutionPlan> {
    const analysis = await this.analyze(task.description || '');
    
    return {
      phases: [
        {
          order: 1,
          description: `Implement: ${task.title}`,
          agentType: 'engineer',
          estimatedDuration: analysis.estimatedDuration,
          dependencies: [],
        },
      ],
      estimatedDuration: analysis.estimatedDuration,
      complexity: analysis.complexity,
    };
  }

  /**
   * Execute implementation task
   */
  async execute(task: Task): Promise<TaskResult> {
    this.log('Executing implementation:', task.title);

    try {
      // Mock implementation for Sprint 1
      // In production, this would use LLM to generate code
      const fileChanges = this.generateMockImplementation(task);
      
      // Simulate validation
      const validationResult = this.validateImplementation(fileChanges);
      
      if (!validationResult.valid) {
        return {
          success: false,
          output: 'Implementation validation failed',
          errors: validationResult.errors,
          fileChanges,
        };
      }

      return {
        success: true,
        output: `Successfully implemented: ${task.title}`,
        fileChanges,
        metadata: {
          filesModified: fileChanges.length,
          language: this.detectLanguage(task.description || ''),
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error('Implementation failed:', error as Error);
      
      return {
        success: false,
        output: 'Implementation failed',
        errors: [errorMessage],
      };
    }
  }

  /**
   * Handle errors with specific recovery strategies
   */
  async onError(error: Error): Promise<ErrorRecovery> {
    this.error('Engineer error:', error);

    if (error.message.includes('syntax') || error.message.includes('parse')) {
      return {
        strategy: 'retry',
        reason: 'Syntax error, will retry with corrections',
        retryDelay: 2000,
      };
    }

    if (error.message.includes('timeout')) {
      return {
        strategy: 'retry',
        reason: 'Execution timeout, will retry with shorter task',
        retryDelay: 5000,
      };
    }

    return {
      strategy: 'fail',
      reason: error.message,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private detectLanguage(description: string): string {
    if (/typescript|\.ts|tsx/i.test(description)) return 'typescript';
    if (/javascript|\.js|jsx/i.test(description)) return 'javascript';
    if (/python|\.py/i.test(description)) return 'python';
    if (/go|golang/i.test(description)) return 'go';
    if (/rust|\.rs/i.test(description)) return 'rust';
    return 'typescript'; // default
  }

  private assessCodeComplexity(description: string): 'low' | 'medium' | 'high' {
    const factors = [
      /implement|create|build/i.test(description),
      /multiple|several|many/i.test(description),
      /complex|advanced|sophisticated/i.test(description),
      /integration|api|database/i.test(description),
    ];
    
    const score = factors.filter(Boolean).length;
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private estimateCodeDuration(description: string, complexity: 'low' | 'medium' | 'high'): number {
    const base = { low: 20, medium: 45, high: 90 };
    return base[complexity];
  }

  private identifyRequiredCapabilities(description: string, language: string): string[] {
    const caps = [language, 'code-generation'];
    
    if (/refactor|improve|optimize/i.test(description)) caps.push('refactoring');
    if (/debug|fix|error/i.test(description)) caps.push('debugging');
    if (/test|spec/i.test(description)) caps.push('testing');
    if (/api|endpoint|route/i.test(description)) caps.push('api-development');
    if (/database|model|schema/i.test(description)) caps.push('database');
    
    return caps;
  }

  private generateMockImplementation(task: Task): FileChange[] {
    const description = task.description || '';
    const language = this.detectLanguage(description);
    
    // Generate mock file changes based on task
    const changes: FileChange[] = [];
    
    // Main implementation file
    if (/function|component|class/i.test(description)) {
      const fileName = this.extractFileName(description) || 'implementation';
      const ext = language === 'typescript' ? '.ts' : language === 'python' ? '.py' : '.js';
      
      changes.push({
        path: `src/${fileName}${ext}`,
        operation: 'create',
        content: this.generateMockCode(fileName, language, description),
      });
    }
    
    // Types file if TypeScript
    if (language === 'typescript' && /interface|type/i.test(description)) {
      changes.push({
        path: `src/types/${this.extractFileName(description) || 'types'}.ts`,
        operation: 'create',
        content: `export interface ${this.extractInterfaceName(description) || 'Config'} {\n  // TODO: Define properties\n}`,
      });
    }
    
    return changes;
  }

  private generateMockCode(fileName: string, language: string, description: string): string {
    const comment = language === 'python' ? '#' : '//';
    return `${comment} ${fileName}.${language === 'typescript' ? 'ts' : language}
${comment} Generated by Engineer Agent
${comment} Task: ${description.substring(0, 50)}...

${language === 'typescript' ? 'export ' : ''}function ${fileName}() {
  ${comment} TODO: Implement ${fileName}
  ${language === 'python' ? 'pass' : 'return null;'}
}`;
  }

  private extractFileName(description: string): string | null {
    const match = description.match(/(?:create|implement|add)\s+(?:a|an)?\s*(\w+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  private extractInterfaceName(description: string): string | null {
    const match = description.match(/interface\s+(\w+)/i);
    return match ? match[1] : null;
  }

  private validateImplementation(changes: FileChange[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const change of changes) {
      if (!change.path || change.path.trim() === '') {
        errors.push('Invalid file path');
      }
      if (change.operation === 'create' && (!change.content || change.content.trim() === '')) {
        errors.push(`Empty content for ${change.path}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}
