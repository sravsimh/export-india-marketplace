# Contributing to ExportIndia Marketplace

We welcome contributions to the ExportIndia Marketplace project! This document provides guidelines for contributing.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/export-india-marketplace.git
   cd export-india-marketplace
   ```
3. **Create a branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠 Development Setup

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

## 📝 Making Changes

### Code Style
- Follow existing code style and conventions
- Use meaningful commit messages
- Write clear, readable code with appropriate comments
- Ensure your code passes all linting rules

### Testing
- Add tests for new features
- Ensure all existing tests pass
- Test your changes thoroughly before submitting

### Documentation
- Update README.md if needed
- Add inline documentation for complex functions
- Update API documentation for new endpoints

## 🔄 Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

3. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add user profile management"
   ```

4. **Push to your fork**:
   ```bash
   git push origin your-branch
   ```

5. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

## 🐛 Bug Reports

When filing bug reports, please include:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots if applicable

## 💡 Feature Requests

For feature requests, please:
- Check if the feature already exists
- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider the impact on existing users

## 📋 Coding Standards

### Backend (Node.js)
- Use ES6+ features
- Follow RESTful API conventions
- Implement proper error handling
- Use async/await for asynchronous operations
- Add input validation for all endpoints

### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use proper prop types or TypeScript
- Implement responsive design
- Optimize for performance

### Database
- Use proper indexing
- Follow MongoDB naming conventions
- Implement data validation
- Consider performance implications

## 🏷 Commit Message Format

Use conventional commits format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

## 🎯 Areas for Contribution

We welcome contributions in these areas:
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Testing improvements
- 🌐 Internationalization
- 📱 Mobile responsiveness

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## 📞 Getting Help

If you need help:
- Check existing issues and discussions
- Create a new issue with your question
- Join our community discussions
- Reach out to maintainers

## 🙏 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes for significant contributions
- Special mentions for outstanding contributions

Thank you for contributing to ExportIndia Marketplace! 🎉