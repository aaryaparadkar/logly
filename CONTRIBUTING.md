# Contributing to Logly

Welcome! We're glad you're interested in contributing to Logly.

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Suggesting Features

1. Open a discussion first
2. Explain the use case
3. Consider alternatives

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting: `pnpm build && pnpm lint`
5. Commit with clear messages
6. Push to your fork
7. Open a pull request

## Development Setup

```bash
# Clone the repo
git clone https://github.com/loglyhq/logly.git
cd logly

# Install dependencies
pnpm install

# Run development
pnpm dev
```

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Run `pnpm format` before committing
- Ensure `pnpm build` passes

## License

By contributing, you agree your code will be licensed under the MIT License.