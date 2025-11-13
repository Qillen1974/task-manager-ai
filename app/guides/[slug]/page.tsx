'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

interface GuideContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
  content: string;
  tableOfContents: { id: string; title: string; level: number }[];
}

const guides: Record<string, GuideContent> = {
  'task-management-guide': {
    id: 'task-management-guide',
    slug: 'task-management-guide',
    title: 'The Ultimate Guide to Task Management: Strategies, Tools & Best Practices',
    description:
      'Comprehensive guide covering task management strategies, the Eisenhower Matrix framework, prioritization techniques, and actionable best practices.',
    category: 'Productivity',
    readTime: '25-30 min',
    publishedDate: 'November 2024',
    author: 'TaskQuadrant Team',
    tableOfContents: [
      { id: 'introduction', title: 'Introduction', level: 1 },
      { id: 'understanding', title: 'Understanding Task Management', level: 1 },
      { id: 'eisenhower', title: 'The Eisenhower Matrix Framework', level: 1 },
      { id: 'core-principles', title: 'Core Task Management Principles', level: 1 },
      { id: 'advanced', title: 'Advanced Task Management Techniques', level: 1 },
      { id: 'team', title: 'Team Collaboration & Delegation', level: 1 },
      { id: 'tools', title: 'Tools & Technology', level: 1 },
      { id: 'measuring', title: 'Measuring Success', level: 1 },
      { id: 'pitfalls', title: 'Common Pitfalls & Solutions', level: 1 },
      { id: 'implementation', title: 'Actionable Implementation Plan', level: 1 },
    ],
    content: `# The Ultimate Guide to Task Management: Strategies, Tools & Best Practices

## Introduction

Task management is the foundation of personal and professional productivity. In today's fast-paced work environment, the ability to organize, prioritize, and execute tasks effectively can mean the difference between thriving and merely surviving.

This comprehensive guide provides **in-depth analysis, actionable strategies, and data-driven insights** to help you master task management. Whether you're managing personal goals, leading a team, or scaling an organization, the principles outlined here will transform how you work.

### What You'll Learn
- Strategic frameworks for task prioritization
- Proven techniques used by high-performing teams
- How to integrate task management into your daily workflow
- Best practices for delegation and collaboration
- Tools and technologies that maximize productivity

---

## Understanding Task Management

### What is Task Management?

Task management is the process of managing the entire lifecycle of a task—from inception and planning through to completion and analysis. It involves:

- **Defining** clear objectives and deliverables
- **Planning** work breakdown and timelines
- **Assigning** ownership and accountability
- **Tracking** progress and identifying blockers
- **Executing** with discipline and focus
- **Reviewing** outcomes and lessons learned

### Why Task Management Matters

**Statistics on Task Management:**
- Professionals spend an average of 28% of their workday managing email and interruptions (McKinsey)
- Organizations with formal task management processes see 25-30% improvement in project delivery
- Teams using structured task management report 40% higher employee satisfaction
- Proper prioritization can increase productivity by up to 50%

---

## The Eisenhower Matrix Framework

The Eisenhower Matrix (also called the Priority Matrix) is one of the most powerful tools for task prioritization. It was popularized by President Dwight D. Eisenhower and later formalized by Stephen Covey.

### The Four Quadrants

The matrix divides tasks into four quadrants based on two dimensions:
- **Urgency**: Does this need immediate attention?
- **Importance**: Does this align with strategic goals?

#### Quadrant 1: Urgent & Important (Do First)

**Characteristics:**
- Crisis situations
- Pressing problems
- Deadline-driven projects
- Emergency issues

**Action:**
- Handle immediately
- Mobilize resources
- Document learnings to prevent future crises

#### Quadrant 2: Important, Not Urgent (Schedule)

**Characteristics:**
- Strategic initiatives
- Personal development
- Relationship building
- Long-term planning
- Prevention activities

**Why It Matters:** This is where real success happens. High performers spend 70% of time here.

#### Quadrant 3: Urgent, Not Important (Delegate)

**Characteristics:**
- Others' priorities
- Interruptions
- Time-sensitive but low-impact
- Administrative tasks

**Action:**
- Delegate when possible
- Batch handle (set specific times)
- Learn to say "no" politely

#### Quadrant 4: Not Urgent, Not Important (Eliminate)

**Characteristics:**
- Time wasters
- Procrastination activities
- Low-value busy work
- Entertainment

**Action:**
- Eliminate entirely
- Minimize exposure
- Set strict boundaries

---

## Core Task Management Principles

### 1. Clarity of Purpose

Every task must have a clear purpose tied to a larger goal.

**Best Practice:**
- Write tasks with clear, actionable language
- Include context: "Why are we doing this?"
- Ensure alignment with strategic objectives

### 2. Specific, Measurable Outcomes

Tasks should have clear success criteria.

**Best Practice:**
- Use SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound
- Define "Done" explicitly
- Include acceptance criteria

### 3. Realistic Time Estimation

Accurate time estimates prevent bottlenecks and unrealistic expectations.

**Best Practice:**
- Add 20-30% buffer for unknowns
- Break tasks into smaller components
- Learn from past projects
- Account for interruptions and meetings

### 4. Regular Review Cycles

Consistent review ensures you stay on track.

**Daily Review Checklist:**
- [ ] Review yesterday's completion rate
- [ ] Identify today's top 3 priorities
- [ ] Check for blockers from yesterday
- [ ] Adjust priorities if needed

### 5. Ruthless Prioritization

You cannot do everything. Prioritization is about choosing what not to do.

**Prioritization Framework:**
1. **Value**: How much value does this create?
2. **Effort**: How much work is required?
3. **Timeline**: When is it needed?
4. **Dependencies**: What else depends on this?
5. **Resources**: Do we have capacity?

---

## Advanced Task Management Techniques

### 1. The Two-List Method

Maintain two lists:
- **Strategic List**: Major projects and goals (reviewed monthly)
- **Tactical List**: Daily and weekly tasks (reviewed daily)

### 2. Task Dependencies Mapping

Understand how tasks relate to each other:
- **Sequential**: Task B cannot start until Task A completes
- **Parallel**: Tasks can occur simultaneously
- **Resource**: Tasks share a limited resource
- **Conditional**: Task B only happens if Task A has specific outcome

### 3. The "Waiting For" List

Maintain a separate list for tasks blocked by external dependencies:
- Awaiting client feedback
- Waiting for team member input
- Pending approval
- Blocked on third-party delivery

### 4. Time Blocking

Allocate specific calendar time to task categories.

**Example Weekly Schedule:**
- Monday AM: Strategy & planning
- Monday PM: Meetings & collaboration
- Tuesday-Thursday: Deep work on core projects
- Friday AM: Weekly review & planning
- Friday PM: Wrap-up and preparation

### 5. The "Shutdown Ritual"

End-of-day process to close out work:
1. Review completed tasks
2. Check email one final time
3. Move incomplete tasks to next day
4. Identify tomorrow's top 3 priorities
5. Clear desk and close applications

---

## Team Collaboration & Delegation

### Effective Delegation

Delegation multiplies your impact and develops team members.

**Delegation Decision Tree:**
\`\`\`
Is this task essential to my role?
    ├─ NO → Delegate or Eliminate
    └─ YES → Can someone else do it?
            ├─ YES → Delegate with clear expectations
            └─ NO → Do it yourself
\`\`\`

### Accountability Systems

**Accountability Principles:**
- One person owns each task
- Clear decision-making authority
- Regular status communication
- Consequences for non-completion
- Recognition for completion

### Synchronous vs. Asynchronous Communication

**Use Synchronous (Meetings) for:**
- Complex decisions requiring discussion
- Conflict resolution
- Team alignment and brainstorming

**Use Asynchronous (Email, Documents) for:**
- Status updates
- Information sharing
- Simple decisions
- Documentation

---

## Tools & Technology for Task Management

### Tool Selection Criteria

Choose tools based on:
1. **Integration**: Works with your existing systems
2. **Simplicity**: Team adopts it readily
3. **Scalability**: Grows with your needs
4. **Flexibility**: Customizable to your workflow
5. **Cost**: ROI justifies expense

### TaskQuadrant for Task Management

TaskQuadrant provides powerful features:

**Core Features:**
- **Eisenhower Matrix**: Visual prioritization using four-quadrant system
- **Project Organization**: Group related tasks
- **Gantt Charts**: Timeline visualization
- **Mind Maps**: Visual brainstorming
- **Recurring Tasks**: Automate repetitive work
- **Team Collaboration**: Assign and track together
- **AI Butler**: Get assistance from AI

---

## Measuring Success & Continuous Improvement

### Key Performance Indicators

**Task Completion Rate:**
- Formula: (Completed Tasks / Total Planned Tasks) × 100
- Target: 80-90%

**On-Time Delivery Rate:**
- Formula: (Tasks Completed by Deadline / Total Tasks) × 100
- Target: 85%+

**Quality Score:**
- Measure: Tasks requiring rework
- Target: <10% of completed tasks

**Time Estimation Accuracy:**
- Target: 85-115% (slight overestimation is good)

---

## Common Pitfalls & Solutions

### Pitfall 1: Lack of Prioritization
**Solution:** Apply Eisenhower Matrix rigorously, create waiting list for non-essential items

### Pitfall 2: Scope Creep
**Solution:** Define scope explicitly, create separate tasks for additions

### Pitfall 3: Poor Estimation
**Solution:** Break tasks into smaller components, add 20-30% buffer, track actual vs. estimated

### Pitfall 4: Context Switching
**Solution:** Block deep work time, batch handle emails, communicate focus hours

### Pitfall 5: Neglecting Quadrant 2
**Solution:** Schedule Quadrant 2 time first, make it non-negotiable

### Pitfall 6: Team Misalignment
**Solution:** Weekly planning meetings, shared roadmap, regular standups

---

## Actionable Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Objective:** Establish basic task management system

**Actions:**
1. Audit current state - list all active work items
2. Choose a tool (if needed)
3. Setup basic structure - create projects, establish naming conventions
4. Training - brief all stakeholders

### Phase 2: Eisenhower Matrix (Week 3-4)

**Objective:** Implement quadrant-based prioritization

**Actions:**
1. Categorize all tasks into quadrants
2. Establish Quadrant 2 practice with scheduled time
3. Create Quadrant 3/4 policy
4. Establish weekly review ritual

### Phase 3: Execution Excellence (Week 5-8)

**Objective:** Establish sustainable workflow and rhythm

**Actions:**
1. Implement time blocking
2. Establish daily rituals
3. Create weekly rhythm
4. Measure and refine

### Phase 4: Team Optimization (Week 9-12)

**Objective:** Optimize team collaboration

**Actions:**
1. Establish delegation framework
2. Optimize meetings
3. Create cross-team alignment
4. Establish continuous improvement cycle

---

## Conclusion

Task management is not about doing more—it's about doing the right things effectively. By implementing these principles and practices, you will:

- **Increase Productivity**: More focused work, less waste
- **Reduce Stress**: Clearer expectations, less anxiety
- **Improve Quality**: Better focus leads to better output
- **Develop Team**: Clear ownership and delegation
- **Achieve Goals**: Strategic work gets the attention it deserves

Remember: The best task management system is the one you will actually use. Start simple, be consistent, and continuously improve.

---

## Additional Resources

### Books
- "The 7 Habits of Highly Effective People" - Stephen Covey
- "Getting Things Done" - David Allen
- "Essentialism" - Greg McKeown
- "Deep Work" - Cal Newport

### Tools Mentioned
- TaskQuadrant - Comprehensive task and project management
- Asana, Monday.com, Jira - Project management platforms
- Todoist, Things 3, OmniFocus - Personal task managers
`,
  },
};

interface GuidePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GuidePage({ params }: GuidePageProps): Promise<ReactNode> {
  const { slug } = await params;
  const guide = guides[slug];

  if (!guide) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/guides" className="text-blue-100 hover:text-white transition-colors mb-4 inline-block">
            ← Back to Guides
          </Link>
          <span className="inline-block bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {guide.category}
          </span>
          <h1 className="text-4xl font-bold mb-4">{guide.title}</h1>
          <p className="text-xl text-blue-100 mb-6">{guide.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-blue-100">
            <span>📅 {guide.publishedDate}</span>
            <span>•</span>
            <span>⏱️ {guide.readTime} read</span>
            <span>•</span>
            <span>✍️ {guide.author}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h2>
              <nav className="space-y-2">
                {guide.tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: guide.content
                    .split('\n')
                    .map((line: string) => {
                      if (line.startsWith('# ')) {
                        const id = line
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-');
                        return `<h1 id="${id}" className="text-3xl font-bold mt-8 mb-4">${line.substring(2)}</h1>`;
                      }
                      if (line.startsWith('## ')) {
                        const id = line
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-');
                        return `<h2 id="${id}" className="text-2xl font-bold mt-6 mb-3">${line.substring(3)}</h2>`;
                      }
                      if (line.startsWith('### ')) {
                        return `<h3 className="text-xl font-bold mt-4 mb-2">${line.substring(4)}</h3>`;
                      }
                      if (line.startsWith('- ')) {
                        return `<li>${line.substring(2)}</li>`;
                      }
                      if (line === '') return '<br />';
                      return `<p>${line}</p>`;
                    })
                    .join(''),
                }}
              />
            </div>

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share this guide</h3>
              <div className="flex gap-4">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(guide.title + ' - TaskQuadrant Guides')}&url=${encodeURIComponent(`https://taskquadrant.io/guides/${guide.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors"
                >
                  Share on Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://taskquadrant.io/guides/${guide.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Share on LinkedIn
                </a>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to implement these strategies?</h3>
              <p className="text-gray-700 mb-6">
                Use TaskQuadrant to apply the principles from this guide. With features like the Eisenhower Matrix, Gantt charts, and AI Butler assistance, you can transform your productivity today.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started with TaskQuadrant →
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
