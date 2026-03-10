This repository uses Nx monorepo architecture.

Important Nx commands:

View project graph:
nx graph

List projects:
nx show projects

Generate new projects:
nx g @nx/react:app <name>
nx g @nx/react:lib <name>

Test projects:
nx test <project>

Build projects:
nx build <project>

Important rules:

apps/ → applications
libs/ → reusable libraries

Libraries should follow this structure:

libs/ui → reusable UI components
libs/feature-* → domain features
libs/data-access-* → backend communication
libs/util-* → utilities

Agents should always check the project graph before modifying dependencies.

Prefer Nx generators instead of manually creating files.