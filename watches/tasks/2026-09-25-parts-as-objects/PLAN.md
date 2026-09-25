# Parts as objects, not strings

The request (2026-09-25): in `art/skeleton-watch.py`, stop using strings such
as `"third"` to refer to a part. Use objects and identifiers such as `THIRD`. A
`name` field can map a part to a string, but nothing should map a string to a
part. Functions such as `tooth_phase()` take a `Wheel`, not a name.

This is a pure refactor. The SVG must not change by one byte.

## What uses strings now

| File                              | String literals that name a part |
| --------------------------------- | -------------------------------: |
| `skeleton-watch.py`               |                               72 |
| `watch_geometry.py`               |                                3 |
| `search-skeleton-watch-layout.py` |                                1 |

The string-keyed structures are:

- `WHEELS` (name → `Wheel`);
- `MESHES` (pairs of names);
- `arbors()` (name → point);
- `part_footprints()` (name → `Footprint`);
- `step` in `build()` (name → degrees);
- `above` in `build()` (name → names);
- the `Layout` dicts in `watch_geometry.py` (keys such as `"fourth-centre"`);
- `FORK_WHEELS` in `watch_geometry.py`.

`build()` reads an arbor's position 28 times.

## The central question: where does per-layout data live?

A wheel has two kinds of data:

- **Fixed:** its teeth, pitch radius, leaves, spokes and the wheel it drives.
- **Per layout:** its arbor's position, and the footprint that follows from it.
  The search makes about 19,000 layouts in one run.

### Options

| Option | Where the arbor lives                                                                                                         | Stale state possible? | Cost                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| A      | a field on `Wheel`, `Point \| None`, set by `set_arbors()`                                                                    | yes                   | a `None` check at each of 28 reads (mypy and pyright reject the reads without one)           |
| B      | a field on `Wheel`, declared in the class body, set by `set_arbors()`                                                         | yes                   | none at the reads; with `__slots__`, an early read or a misspelt write raises an error       |
| C      | as B, with a property that raises "call set_arbors() first"                                                                   | yes                   | about 8 lines per field                                                                      |
| D      | nowhere: a property recomputes it from the layout constants                                                                   | no                    | the angles must move onto the parts, with links to the part each one is placed from          |
| E      | a **side table**: `Wheel` holds only fixed data; each layout is a new object that maps each part to its arbor, and is then discarded | no                    | reads become `layout.arbor[THIRD]`, not `THIRD.arbor`                                         |
| F      | a parallel `WheelGeometry` object for each wheel, with its own `driven` link to the next `WheelGeometry`                       | no                    | the train's links are stored twice, and the two copies must agree                            |

For A and B, I tested the claims with the checkers this repo uses (mypy 2.3.1
`--strict` and pyright 1.1.414).

A, B and C have one risk in common. A value can be **stale**: left over from
an earlier layout. The search changes the layout constants about 19,000 times
in one run. If a change is not followed by a `set_arbors()` call, every gap the
search scores is wrong, and nothing says so. Today `arbors()` recomputes on
each call, so this risk does not exist yet. A, B and C would add it.

E and F have no stale state. Each set of parameters makes a new object, and
the object is discarded at the end. E is better than F because the train's
links stay in one place, on `Wheel`. The side table holds only data, never
links. So an algorithm moves along the fixed links (`wheel.driven`) and looks
up its own data (`layout.arbor[wheel.driven]`). F would need a second copy of
every link.

### Ranking

1. **E.** No stale state, one record of the links, and `Wheel` becomes
   immutable. It is also the smallest change from today: `arbors()` already
   returns a fresh dict for each call. Only the key changes, from a name to the
   part.
2. **F.** No stale state, but it keeps two copies of the links.
3. **B.** Clean reads, but with the stale-state risk. A rule that every entry
   point calls `set_arbors()` controls the risk, but only as long as everyone
   follows the rule.
4. **D.** No stale state, but it redesigns the layout. A part placed from its
   neighbour does not follow the train: the barrel drives the centre wheel, but
   it is placed from it.
5. **C,** then **A.** They have B's risk, plus more code.

## `MESHES` or a `driven` field

The train is a chain, so each wheel can name the wheel it drives:
`FOURTH = Wheel(…, driven=ESCAPE)`. That replaces `MESHES`. The wheels must
then be made in the order escape, fourth, third, centre and barrel, because the
driven wheel must exist first.

Only one piece of code reads from driven to driver: `pinion_of()`
([skeleton-watch.py:812](../../art/skeleton-watch.py)). A pinion's radius, and
the direction in which its gap faces, both depend on the wheel that drives it.
There were two ways to serve it:

- a constant `DRIVER` dict, derived at import from the `driven` links;
- a `driver` field. The driver's constructor sets `driven.driver = self`, so
  the train becomes a doubly linked list.

**Chosen: the `driver` field** (your choice). Both directions are then plain
attributes, and no second structure is needed to go backward. The cost is that
`Wheel` is no longer immutable: a wheel changes once, when its driver is made.
That happens at import, and nothing changes a wheel after that.

The mesh checks in `watch_geometry.py` go forward, from each wheel to the wheel
it drives. So they need only `driven`.

A `driven` field has one more benefit: `step` becomes fixed data, a property
that follows `driven`: `-driven.step * driven.leaves / teeth`. The escape
wheel's step (half a tooth each beat) is the base case, because it drives
nothing. `set_steps()` is then not necessary.

## The target

```python
@dataclass(eq=False)  # eq=False: equal and hashed by identity
class Wheel:
    name: str
    teeth: int
    pitch_radius: float
    spokes: int = 0
    leaves: int = 0
    driven: Wheel | None = field(default=None, repr=False)
    root_radius: float | None = None  # the escape wheel's club teeth
    tip_radius: float | None = None
    driver: Wheel | None = field(default=None, init=False, repr=False)

    def __post_init__(self) -> None:
        if self.driven is not None:
            self.driven.driver = self
    # pitch, depth, inner, outer, step, pinion_radius, mesh_distance: properties

@dataclass(frozen=True, eq=False)
class Balance:
    name: str
    radius: float

@dataclass(frozen=True, eq=False)
class Fork:
    name: str

ESCAPE = Wheel("escape", teeth=15, pitch_radius=27, spokes=5, leaves=8,
               root_radius=23, tip_radius=33)
FOURTH = Wheel("fourth", teeth=16, pitch_radius=32, spokes=4, leaves=4, driven=ESCAPE)
...
BARREL = Wheel("barrel", teeth=36, pitch_radius=74, driven=CENTRE)
TRAIN = [BARREL, CENTRE, THIRD, FOURTH, ESCAPE]
BALANCE, FORK = Balance("balance", radius=56), Fork("fork")
STACK = [ESCAPE, FOURTH, THIRD, CENTRE, BARREL, BALANCE]  # back to front

Part = Wheel | Balance | Fork
Round = Wheel | Balance  # hides what is below it inside inner

@dataclass(frozen=True)
class Placement:
    """Where the parts are, for one set of layout constants."""
    arbor: dict[Part, Point]
    def hole(self, part: Round) -> str: ...  # the clip path under it

def place() -> Placement: ...  # was arbors(); reads the layout constants
```

`build()` starts with `placement = place()` and reads `placement.arbor[THIRD]`.
`watch_geometry.measure()` and the search's `evaluate()` do the same. The
search still sets the layout constants with `setattr`, and then calls `place()`.
`Placement.hole()` uses `part.name` only for the clip path's id.

## Other design choices

### Identity: `eq=False`

Dicts such as `Placement.arbor` use parts as keys, so a part must hash by
identity. A mutable dataclass with the default `eq=True` sets `__hash__` to
`None`, so it cannot be a key (tested). A frozen one compares and hashes by
value: two parts with the same fields would be the same key. With `eq=False`, a
part is equal only to itself, and it hashes by identity. Nothing needs a value
comparison.

`Wheel` also has `slots=True`. It is the one part that changes after it is
made, so a misspelt attribute (`wheel.drivr = …`) must raise an
`AttributeError`, not add a new field (tested).

`driven` and `driver` have `repr=False`. Without it, the repr of one wheel
prints the whole train, in both directions.

### One side-table class, not one per part

Each layout changes only the arbors. The holes and the fork's outline
follow from the arbors. So one `Placement` holds `arbor: dict[Part, Point]`,
and its methods compute the rest. A record for each part, such as
`WheelGeometry`, would hold only one field. The record becomes worth it if a
second value per part appears that cannot be computed from the arbor.

### No `Footprint` class

A first version kept `Footprint(centre, inner, outer)`, computed by a
`Placement` method. But each footprint was `(placement.arbor[part],
part.inner, part.outer)`: two copies of fixed data and one copy from the side
table. So `Footprint` was removed (your suggestion), and code reads the arbor
from the placement and the radii from the part:

```python
# with Footprint
math.dist(footprints[lower].centre, footprints[upper].centre)
< footprints[lower].outer + footprints[upper].inner
# without
math.dist(arbor[lower], arbor[upper]) < lower.outer + upper.inner
```

- **For keeping it:** `watch_geometry.py` needed to know only "a disc: a centre
  and two radii" (one protocol).
- **Against keeping it:** about 25 lines across two files, and a reader had to
  check that a footprint's `outer` could not differ from the part's.
- **The cost of removing it:** `watch_geometry.regions()` takes the stack and
  the arbor table, and it needs a `Round` protocol (`name`, `inner`,
  `outer`). That protocol describes the parts themselves, not a copy of them.

`hole()` became a `Placement` method, because it needs a part and that part's
arbor. `watch_geometry.Region` stays: it is not a copy. It adds the hiders,
the inner discs of the parts above, which are computed from the whole stack.

### The name is written twice

`THIRD = Wheel("third", …)` gives the name twice. The name is used only for
the SVG's clip-path ids (`skeleton-watch-under-third`) and for the reports.
Python has no clean way to get a module-level variable's own name. An `Enum`
gives `.name` for free, but its members would have to mix `Wheel` and `Balance`.
I accept the repetition.

### The escape wheel

Its `inner` and `outer` radii come from its club teeth, not from `depth`. So `Wheel` takes an
optional `root_radius` and `tip_radius`, which replace `ESCAPE_ROOT` and
`ESCAPE_TIP`. An `EscapeWheel` subclass would differ from `Wheel` only in
those two numbers.

### `watch_geometry.py` and the search

- `Layout`'s dicts use parts as keys: `(Part, Part)` for pairs and `Part` for
  one part. The reports make names from `part.name`.
- `FORK_WHEELS` goes. The fork works on the escape wheel and the balance, so it
  must clear `STACK` without `ESCAPE` and `BALANCE`. That list is derived.
- The search's `PARAMETERS` stay strings. They name layout constants for
  `setattr`, not parts.

### `MESHES` and `WHEELS` go

`driven` replaces `MESHES`, and `TRAIN` (a list) replaces `WHEELS`.

## Out of scope (possible follow-ups)

- The drawing arguments that differ from wheel to wheel (`hub`, `rim`,
  `spoke_width`, the loop length) could become `Wheel` fields. Then `build()`
  could draw the train in one loop, not in four blocks.
- `stem/tools/*.py` still uses one-letter names.

## Verification

- `validate-skeleton-watch.py` passes: ruff, mypy `--strict`, pyright, the
  layout and the art checks.
- The regenerated `public/cover/skeleton-watch.svg` is byte-identical to the
  one in commit `3a21042`.
- The validator reports the same gaps as now: escape–third 11.6 px, fork
  11.1 px, ring 13.3 px.
- The search, run with `--balance-distance 110`, prints the same top rows
  before and after the change.
