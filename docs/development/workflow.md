# Development Workflow

## 1. Task Management

### Before Starting Work
- [ ] Review the checklist.md for relevant items
- [ ] Create a new branch from main: `feature/description` or `fix/description`
- [ ] Update the checklist.md to mark items you're working on
- [ ] Document any new items discovered during development

### During Development
- [ ] Follow the architectural guidelines in README.md
- [ ] Keep commits atomic and well-described
- [ ] Reference checklist items in commit messages
- [ ] Update documentation as you go

### Before Submitting PR
- [ ] Self-review against checklist items
- [ ] Ensure all new code follows architectural guidelines
- [ ] Update any relevant documentation
- [ ] Test all changes thoroughly

## 2. Code Organization

### Server Components (Pages)
- [ ] Keep pages in `src/app/(pages)`
- [ ] Use server components by default
- [ ] Place page-specific components in local `components` directory
- [ ] Follow the projects folder structure pattern

### Client Components
- [ ] Mark with `'use client'` only when necessary
- [ ] Keep close to where they're used
- [ ] Use DaisyUI components directly for simple elements
- [ ] Document why client-side functionality is needed

## 3. Development Process

### Daily Tasks
1. Start with a clear goal from the checklist
2. Review any existing related code
3. Implement changes following guidelines
4. Document any new requirements
5. Update checklist with progress

### Weekly Review
1. Review completed checklist items
2. Identify any new requirements
3. Update documentation as needed
4. Plan next week's priorities

## 4. Quality Checks

### Code Review Checklist
- [ ] Follows server/client component guidelines
- [ ] Uses DaisyUI components appropriately
- [ ] Maintains proper component organization
- [ ] Includes necessary documentation
- [ ] Updates checklist.md if needed

### Documentation Updates
- [ ] README.md guidelines followed
- [ ] Component documentation updated
- [ ] API documentation updated
- [ ] Checklist.md updated

## 5. Staying on Track

### Daily Routine
1. Start with a clear task from checklist.md
2. Focus on one feature/fix at a time
3. Document any blockers immediately
4. Update progress in checklist.md

### Avoiding Scope Creep
1. Stick to the current checklist item
2. Document new ideas for future tasks
3. Don't mix multiple features in one PR
4. Keep changes focused and atomic

### Progress Tracking
1. Regular updates to checklist.md
2. Clear commit messages
3. Documentation updates
4. Regular team syncs

## 6. Communication

### Team Updates
- Daily standup with progress
- Weekly review of checklist
- Document any blockers
- Share knowledge and findings

### Documentation
- Keep README.md updated
- Document architectural decisions
- Update component documentation
- Maintain API documentation

## 7. Review Process

### Code Review
1. Architectural guidelines followed
2. Server/client component usage correct
3. DaisyUI components used appropriately
4. Documentation updated
5. Checklist items completed

### Testing
1. Server components tested
2. Client components tested
3. Integration tests added
4. Documentation tested

## 8. Maintenance

### Regular Tasks
1. Review and update checklist.md
2. Update documentation
3. Review architectural decisions
4. Clean up technical debt

### Documentation
1. Keep README.md current
2. Update component docs
3. Maintain API docs
4. Update checklist.md 