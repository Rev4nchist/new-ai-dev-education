import { Metadata } from "next"
import { ContentTemplate, CodeBlock, Callout } from "@/components/content"
import { generateMetadata } from "@/lib/content-utils"

export const metadata: Metadata = generateMetadata({
  title: "AI-Assisted Code Review Best Practices",
  description: "Learn effective strategies and techniques for reviewing code generated or modified with AI assistance.",
  keywords: ["code review", "AI-generated code", "review checklist", "quality assurance", "code validation", "MCP", "safety checks"],
  section: "best-practices/code-review"
})

export default function CodeReviewPage() {
  return (
    <ContentTemplate
      title="AI-Assisted Code Review Best Practices"
      description="Learn effective strategies and techniques for reviewing code generated or modified with AI assistance."
      metadata={{
        difficulty: "intermediate",
        timeToComplete: "15 minutes",
        prerequisites: [
          {
            title: "Introduction to AI-Assisted Development",
            href: "/introduction/concepts"
          },
          {
            title: "Practical LLM Usage",
            href: "/best-practices/practical-llm-usage"
          }
        ]
      }}
      tableOfContents={[
        {
          id: "introduction",
          title: "Introduction",
          level: 2
        },
        {
          id: "unique-challenges",
          title: "Unique Challenges of AI-Generated Code",
          level: 2,
          children: [
            {
              id: "hallucinations",
              title: "Hallucinations and Non-Existent APIs",
              level: 3
            },
            {
              id: "overconfidence",
              title: "Overconfidence in Implementation",
              level: 3
            },
            {
              id: "context-limitations",
              title: "Context Limitations",
              level: 3
            }
          ]
        },
        {
          id: "review-checklist",
          title: "Code Review Checklist for AI-Generated Code",
          level: 2,
          children: [
            {
              id: "functionality",
              title: "Functionality Verification",
              level: 3
            },
            {
              id: "edge-cases",
              title: "Edge Case Analysis",
              level: 3
            },
            {
              id: "performance",
              title: "Performance Considerations",
              level: 3
            },
            {
              id: "security",
              title: "Security Implications",
              level: 3
            },
            {
              id: "maintainability",
              title: "Maintainability and Style",
              level: 3
            }
          ]
        },
        {
          id: "review-techniques",
          title: "Effective Review Techniques",
          level: 2,
          children: [
            {
              id: "socratic-method",
              title: "Using the Socratic Method with AI",
              level: 3
            },
            {
              id: "mcp-integration",
              title: "Leveraging MCP for Better Reviews",
              level: 3
            },
            {
              id: "ai-assisted-review",
              title: "AI-Assisted Review of AI-Generated Code",
              level: 3
            }
          ]
        },
        {
          id: "workflow-integration",
          title: "Integrating into Development Workflow",
          level: 2
        },
        {
          id: "common-pitfalls",
          title: "Common Pitfalls and How to Avoid Them",
          level: 2
        }
      ]}
      relatedContent={[
        {
          title: "Testing AI-Generated Code",
          href: "/best-practices/testing",
          description: "Learn strategies for effectively testing code produced by AI assistants."
        },
        {
          title: "Security Considerations",
          href: "/best-practices/security",
          description: "Understand security implications and best practices for AI-generated code."
        },
        {
          title: "Practical LLM Usage",
          href: "/best-practices/practical-llm-usage",
          description: "Strategies for effectively using Large Language Models in your development workflow."
        }
      ]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        Reviewing code generated by AI assistants presents unique challenges and opportunities compared to traditional 
        code review. While AI can produce functional code quickly, it requires specialized review techniques to ensure 
        quality, security, and maintainability. This guide offers a structured approach to reviewing AI-generated code, 
        helping you identify common issues and implement effective review practices.
      </p>
      <p>
        Code review has always been a critical part of software development, but with AI-generated code, the focus shifts from 
        catching simple bugs to evaluating broader concerns like API hallucinations, security implications, and alignment with 
        project requirements. Understanding these differences will help you develop more effective review strategies.
      </p>

      <Callout type="info" title="AI Code Review Statistics">
        According to recent studies, developers spend 30-40% less time writing code when using AI assistants, 
        but the time spent on code review increases by 15-20%. Effective review practices help maximize the 
        overall productivity gains from AI-assisted development.
      </Callout>

      <h2 id="unique-challenges">Unique Challenges of AI-Generated Code</h2>
      <p>
        AI-generated code presents several unique challenges that traditional code review processes may not adequately address.
        Understanding these challenges is the first step in developing effective review strategies.
      </p>

      <h3 id="hallucinations">Hallucinations and Non-Existent APIs</h3>
      <p>
        One of the most common issues with AI-generated code is "hallucinations" — references to functions, libraries, 
        or APIs that don't actually exist. These can be particularly troublesome because they often look plausible at first glance.
      </p>

      <CodeBlock 
        language="javascript"
        code={`// Example of AI hallucination
// The AI invented a non-existent "formatCurrency" method
const price = 19.99;
const formattedPrice = Number.formatCurrency(price, 'USD');  // This method doesn't exist

// The correct implementation might be:
const formattedPrice = new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD' 
}).format(price);`}
      />

      <p>
        When reviewing AI-generated code, always verify that imported libraries and called methods actually exist in 
        the project's dependencies or standard libraries.
      </p>

      <h3 id="overconfidence">Overconfidence in Implementation</h3>
      <p>
        AI tends to present its code with high confidence, even when the implementation may be flawed or incomplete. 
        This "overconfidence" can lead reviewers to assume correctness without sufficient scrutiny.
      </p>

      <CodeBlock 
        language="python"
        code={`# Example of overconfident but flawed implementation
def find_largest_file(directory):
    """Find the largest file in a directory."""
    largest_file = None
    largest_size = 0
    
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        size = os.path.getsize(filepath)
        
        if size > largest_size:
            largest_size = size
            largest_file = filepath
            
    return largest_file  # Looks confident, but doesn't handle subdirectories or non-file items`}
      />

      <p>
        Always approach AI-generated code with healthy skepticism, regardless of how confident or complete it appears.
      </p>

      <h3 id="context-limitations">Context Limitations</h3>
      <p>
        AI may not fully understand the broader context of your project without the benefit of MCP. This can lead to code 
        that, while syntactically correct, doesn't align with project architecture, conventions, or business requirements.
      </p>

      <CodeBlock 
        language="typescript"
        code={`// AI might generate code that doesn't follow project patterns
// If your project uses a specific state management pattern:
function handleUserUpdate(data) {
  // AI-generated approach that doesn't use your state management
  localStorage.setItem('user', JSON.stringify(data));
  document.dispatchEvent(new CustomEvent('userUpdated', { detail: data }));
  
  // When your project actually uses Redux:
  // dispatch(updateUser(data));
}`}
      />

      <p>
        When reviewing, ensure the generated code aligns with your project's architectural patterns, coding standards, 
        and business rules.
      </p>

      <h2 id="review-checklist">Code Review Checklist for AI-Generated Code</h2>
      <p>
        Use this checklist as a starting point for reviewing AI-generated code. While general code review practices still 
        apply, these items address the specific concerns related to AI-generated code.
      </p>

      <h3 id="functionality">Functionality Verification</h3>
      <ul>
        <li><strong>Execution Check</strong>: Does the code run without errors? Many hallucinations will fail immediately.</li>
        <li><strong>Import Verification</strong>: Are all imported libraries actually installed and available?</li>
        <li><strong>Method Existence</strong>: Do all called methods and functions exist in the referenced objects?</li>
        <li><strong>Requirements Fulfillment</strong>: Does the code actually accomplish what was requested?</li>
      </ul>

      <Callout type="tip" title="Verification Tip">
        Run the code in a controlled environment before integrating it into your main codebase. 
        Use a sandbox or create a simple test case to verify basic functionality.
      </Callout>

      <h3 id="edge-cases">Edge Case Analysis</h3>
      <p>
        AI-generated code often focuses on the happy path but may miss important edge cases.
      </p>
      <ul>
        <li><strong>Input Validation</strong>: Does the code handle invalid, unexpected, or malicious inputs?</li>
        <li><strong>Boundary Conditions</strong>: Does it handle boundary values (empty arrays, maximum values, etc.)?</li>
        <li><strong>Error Handling</strong>: Does it catch and properly handle exceptions?</li>
        <li><strong>Resource Management</strong>: Does it properly manage resources (close files, release connections)?</li>
      </ul>

      <CodeBlock 
        language="javascript"
        code={`// AI-generated function missing edge case handling
function divideArray(arr, divisor) {
  // Missing checks for:
  // - Empty array
  // - Divisor being zero
  // - Non-numeric elements
  
  return arr.map(item => item / divisor);
}

// Improved version with edge case handling
function divideArraySafely(arr, divisor) {
  if (!Array.isArray(arr)) {
    throw new TypeError('Expected an array');
  }
  
  if (divisor === 0) {
    throw new Error('Cannot divide by zero');
  }
  
  return arr.map(item => {
    if (typeof item !== 'number') {
      return NaN;
    }
    return item / divisor;
  });
}`}
      />

      <h3 id="performance">Performance Considerations</h3>
      <p>
        AI tools often prioritize readability and correctness over performance optimization.
      </p>
      <ul>
        <li><strong>Algorithmic Efficiency</strong>: Is the chosen algorithm appropriate for the expected data size?</li>
        <li><strong>Resource Usage</strong>: Does the code use memory and CPU resources efficiently?</li>
        <li><strong>Unnecessary Operations</strong>: Are there redundant computations or unnecessary iterations?</li>
        <li><strong>Caching Potential</strong>: Could results be cached to avoid repeated calculations?</li>
      </ul>

      <h3 id="security">Security Implications</h3>
      <p>
        AI may inadvertently introduce security vulnerabilities by following common patterns without security awareness.
      </p>
      <ul>
        <li><strong>Input Sanitization</strong>: Is user input properly sanitized before use?</li>
        <li><strong>SQL Injection</strong>: Are database queries parameterized rather than constructed via string concatenation?</li>
        <li><strong>XSS Prevention</strong>: Is output properly escaped when displayed to users?</li>
        <li><strong>Sensitive Data</strong>: Is sensitive data handled securely (not logged, properly encrypted)?</li>
        <li><strong>Dependency Issues</strong>: Are introduced dependencies secure and up-to-date?</li>
      </ul>

      <CodeBlock 
        language="php"
        code={`// Vulnerable code that AI might generate
$username = $_POST['username'];
$query = "SELECT * FROM users WHERE username = '$username'";  // SQL injection vulnerability

// Safer version with parameterized query
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$_POST['username']]);`}
      />

      <h3 id="maintainability">Maintainability and Style</h3>
      <p>
        AI-generated code should adhere to the same maintainability standards as human-written code.
      </p>
      <ul>
        <li><strong>Code Standards</strong>: Does the code follow project style guidelines and conventions?</li>
        <li><strong>Documentation</strong>: Are functions and complex logic adequately documented?</li>
        <li><strong>Naming</strong>: Are variables, functions, and classes named clearly and consistently?</li>
        <li><strong>Modularity</strong>: Is the code properly modularized with appropriate separation of concerns?</li>
        <li><strong>Tests</strong>: Are tests included or at least considered for the generated code?</li>
      </ul>

      <h2 id="review-techniques">Effective Review Techniques</h2>
      <p>
        Beyond the checklist, these techniques can help you more effectively review AI-generated code.
      </p>

      <h3 id="socratic-method">Using the Socratic Method with AI</h3>
      <p>
        When you're uncertain about a piece of AI-generated code, engage with the AI using a Socratic approach:
        ask it detailed questions about its implementation choices, potential edge cases, and security implications.
      </p>

      <CodeBlock 
        language="text"
        code={`// Example dialogue with AI
Developer: Why did you choose this specific algorithm?
AI: I selected quicksort because it provides O(n log n) time complexity on average, which is efficient for the expected data size. However, if you expect already sorted or nearly sorted data, we might want to consider mergesort instead.

Developer: What edge cases should we handle for this function?
AI: We should handle: empty inputs, extremely large inputs, non-numeric values, and potential integer overflow for large sums.`}
      />

      <p>
        This approach leverages the AI's ability to explain its own reasoning and often reveals issues 
        or considerations that weren't apparent in the initial code review.
      </p>

      <h3 id="mcp-integration">Leveraging MCP for Better Reviews</h3>
      <p>
        The Model Context Protocol provides significant advantages during code review by ensuring the AI has full context.
      </p>

      <ul>
        <li><strong>Contextual Understanding</strong>: MCP-enabled tools understand your project architecture and conventions</li>
        <li><strong>Dependency Awareness</strong>: They know which libraries are actually available in your project</li>
        <li><strong>Pattern Recognition</strong>: They can match existing code patterns in your project</li>
        <li><strong>History Awareness</strong>: They understand the evolution of your codebase</li>
      </ul>

      <Callout type="success" title="MCP Review Benefit">
        Using MCP-enabled tools can reduce hallucinations by up to 70% in code generation and review, 
        as the AI has accurate information about your project's structure and dependencies.
      </Callout>

      <h3 id="ai-assisted-review">AI-Assisted Review of AI-Generated Code</h3>
      <p>
        You can actually use AI to help review AI-generated code, creating a complementary check:
      </p>

      <ol>
        <li>Have one AI generate the initial code implementation</li>
        <li>Ask another AI instance (or the same one with a "reviewer" prompt) to review the generated code</li>
        <li>Specifically request identification of potential issues, edge cases, and improvements</li>
        <li>Use your own judgment to evaluate both the original code and the AI's review</li>
      </ol>

      <CodeBlock 
        language="text"
        code={`// Example prompt for AI-assisted review
"Review the following code for potential issues, edge cases, security vulnerabilities, 
and performance concerns. Highlight anything that needs improvement, considering that 
this code will be used in a production environment:

[paste generated code here]"`}
      />

      <p>
        This approach often surfaces different types of issues than you might catch on your own, as different 
        AI models or prompting strategies can have different blind spots.
      </p>

      <h2 id="workflow-integration">Integrating into Development Workflow</h2>
      <p>
        To maximize the benefits of AI-assisted development while maintaining code quality, consider these workflow integration strategies:
      </p>

      <ul>
        <li>
          <strong>Dedicated AI Review Stage</strong>: Add a specific step in your workflow for reviewing AI-generated code, 
          separate from traditional peer review.
        </li>
        <li>
          <strong>Pairing Strategy</strong>: Pair developers with AI tools, with the human focusing primarily on review and guidance 
          rather than initial implementation.
        </li>
        <li>
          <strong>Progressive Automation</strong>: Start with heavy review of AI-generated code, then gradually reduce oversight 
          as you establish confidence in specific types of tasks.
        </li>
        <li>
          <strong>Continuous Feedback</strong>: Provide feedback to the AI when it generates problematic code to improve future results.
        </li>
        <li>
          <strong>Automation in CI/CD</strong>: Implement automated checks specifically designed to catch common AI coding issues.
        </li>
      </ul>

      <Callout type="info" title="Workflow Example">
        Many teams find success with a "propose-review-refine" workflow: 
        the AI proposes a solution, the developer reviews and identifies issues, 
        and then the AI refines based on that feedback.
      </Callout>

      <h2 id="common-pitfalls">Common Pitfalls and How to Avoid Them</h2>
      <p>
        Even experienced developers can fall into traps when reviewing AI-generated code. Here are some common pitfalls and how to avoid them:
      </p>

      <ul>
        <li>
          <strong>Over-Reliance Trap</strong>: Assuming AI-generated code is correct without verification.
          <br /><em>Solution</em>: Always verify functionality, especially for critical components.
        </li>
        <li>
          <strong>Confirmation Bias</strong>: Only looking for evidence that confirms the code works, rather than trying to break it.
          <br /><em>Solution</em>: Actively look for ways the code could fail or have issues.
        </li>
        <li>
          <strong>Neglecting Context</strong>: Reviewing code in isolation without considering project context.
          <br /><em>Solution</em>: Use MCP-enabled tools and review code in the context of the larger system.
        </li>
        <li>
          <strong>Skipping Basic Checks</strong>: Assuming AI handles basics like input validation or error handling.
          <br /><em>Solution</em>: Apply the same thoroughness as you would with human-written code.
        </li>
        <li>
          <strong>Ignoring Comments/Documentation</strong>: Not reviewing generated comments and documentation.
          <br /><em>Solution</em>: Review comments as carefully as code; they may contain misunderstandings.
        </li>
      </ul>

      <p>
        By understanding these common pitfalls, you can establish a more effective review process for AI-generated code, 
        balancing the productivity benefits of AI with the quality requirements of professional software development.
      </p>

      <Callout type="tip" title="Final Recommendation">
        Develop a specialized code review checklist for your team that addresses the specific patterns and issues 
        you encounter with AI-generated code in your domain. Review and refine this checklist regularly as AI tools evolve.
      </Callout>
    </ContentTemplate>
  )
}