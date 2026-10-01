# doccheck

Check a project's Markdown docs, so that they stay true as the project
changes. It supports the docs structure in the global `AGENTS.md` ("Docs"):
each project has a `docs/` directory, a `docs/README.md` that says what each
doc holds, and an `AGENTS.md` beside `docs/` that says when to read each one.

```bash
doccheck PATH... [--skip NAME]... [--tools DIR]... [--json]
```

Each `PATH` is a Markdown file, or a directory whose `*.md` files are checked
at any depth. Directories whose names start with `.`, `node_modules`, and each
`--skip NAME` are not entered. Give the paths explicitly: do not check a
`tasks/` directory (a finished task is frozen) or a part of the repository
that is itself frozen. It exits 1 if it finds anything, and 2 if the arguments
are wrong. `--json` prints the findings for a program to read.

## What it checks

| Finding          | Means                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `missing file`   | a relative link's file does not exist                                                                                    |
| `missing anchor` | a link's `#anchor` is not a heading (GitHub's slug) or an HTML `id` of that Markdown file                                |
| `no index`       | a `docs/` directory has no `docs/README.md`, or no `AGENTS.md` beside it                                                 |
| `not indexed`    | a doc in `docs/` is not named in one of its two indexes, by a link or in code (`` `docs/theme.md` ``)                   |
| `missing tool`   | code in a doc names a file in a `--tools DIR` that does not exist (`tools/x.py`, `../tools/x.py`, `<parent>/tools/x.py`) |

It does not check links with a scheme (`https:`) or paths that start with `/`
(a web site's own paths), links inside code, or whether a fact in a doc is
still true. A parent's `AGENTS.md` does not have to list its sub-projects.

## Use it in a project

1. Add it as a dev dependency of the project that runs the checks, pinned to
   a commit:

   ```toml
   [dependency-groups]
   dev = ["doccheck"]

   [tool.uv.sources]
   doccheck = { git = "ssh://git@bitbucket.org/martincmartin/init-files.git", subdirectory = "agents/skills/docs-audit/doccheck", rev = "<commit>" }
   ```

   A `path` source works on this machine only. If you use one, say so in the
   project.

2. Run it from the project's validation, with explicit paths: each `docs/`,
   the READMEs and the `AGENTS.md` files. Give `--tools DIR` for each tools
   directory that the docs name.
3. Say in the project's docs that the check runs, and how to upgrade it:
   change `rev`, or run `uv lock --upgrade-package doccheck`.
4. Run it, and fix what it finds.

## Develop it

```bash
uv run validate.py          # ruff format, ruff check, mypy --strict, pyright, pytest
uv run validate.py --fix    # let ruff format and fix first
```

The code: `src/doccheck/markdown.py` reads a file (anchors, links, code),
`checks.py` has the checks and returns findings, `cli.py` finds the files and
prints. A new check is a function in `checks.py` that returns findings, a
`Kind`, a test, and a row in the table above.
