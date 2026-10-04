"""Check full-path selection and the perpendicular-velocity cost."""

import math
import unittest
from dataclasses import replace
from itertools import pairwise, product

from diving_board import (
    LEADER_DESIGN,
    LeaderDesign,
    Point,
    leader_step_costs,
    minimum_leader_path,
)


def independent_motion_cost(before: Point, after: Point, seconds: float) -> float:
    """Evaluate the squared cross product for an elbow at the origin."""
    middle = ((before[0] + after[0]) / 2, (before[1] + after[1]) / 2)
    length = math.hypot(*middle)
    velocity = ((after[0] - before[0]) / seconds, (after[1] - before[1]) / seconds)
    normal = (velocity[0] * middle[1] - velocity[1] * middle[0]) / length
    return seconds * normal**2


class LeaderPathTests(unittest.TestCase):
    design = LeaderDesign(
        start=(1, 0),
        elbow=(0, 0),
        length_weight=0,
        bend_weight=0,
        normal_velocity_weight=1,
    )

    def test_radial_motion_is_free(self) -> None:
        cost = leader_step_costs([(3, 4)], [(6, 8)], self.design, 1)
        self.assertAlmostEqual(float(cost[0, 0]), 0)

    def test_rotated_perpendicular_motion_and_symmetry(self) -> None:
        # The midpoint direction is (0.6, 0.8); velocity (-4, 3) is normal to it.
        before, after = (8.0, 6.5), (4.0, 9.5)
        forward = float(leader_step_costs([before], [after], self.design, 1)[0, 0])
        reverse = float(leader_step_costs([after], [before], self.design, 1)[0, 0])
        self.assertAlmostEqual(forward, 25)
        self.assertAlmostEqual(reverse, forward)
        shorter = float(leader_step_costs([before], [after], self.design, 0.5)[0, 0])
        self.assertAlmostEqual(shorter, 2 * forward)

    def test_full_path_can_reject_the_cheapest_immediate_step(self) -> None:
        contacts = [[(-1.0, 0.0)], [(-2.0, 0.0), (-1.0, 1.0)], [(-1.0, 2.0)]]
        chosen = minimum_leader_path(contacts, self.design, 2)
        self.assertEqual(chosen, [contacts[0][0], contacts[1][1], contacts[2][0]])

    def test_result_matches_exhaustive_paths(self) -> None:
        contacts = [
            [(-2.0, 0.0)],
            [(-3.0, 0.2), (-2.0, 0.7), (-1.0, 0.9)],
            [(-3.0, 1.0), (-2.0, 1.5), (-1.0, 2.0)],
            [(-2.5, 1.5), (-1.5, 2.0)],
        ]
        seconds = 0.25

        def path_cost(path: tuple[Point, ...]) -> float:
            return sum(
                independent_motion_cost(before, after, seconds)
                for before, after in pairwise(path)
            )

        expected = min(product(*contacts), key=path_cost)
        chosen = minimum_leader_path(contacts, self.design, seconds * 3)
        self.assertEqual(tuple(chosen), expected)

    def test_invalid_duration(self) -> None:
        for duration in (0, -1, math.nan, math.inf):
            with self.subTest(duration=duration), self.assertRaises(ValueError):
                minimum_leader_path([[(-1, 0)], [(-2, 0)]], self.design, duration)

    def test_undefined_segment_is_unusable_even_without_motion_weight(self) -> None:
        for weight in (0, 1):
            design = replace(self.design, normal_velocity_weight=weight)
            for before, after in (((-1, 0), (1, 0)), ((-1, 0), (0, 0))):
                with (
                    self.subTest(weight=weight, after=after),
                    self.assertRaises(ValueError),
                ):
                    minimum_leader_path([[before], [after]], design, 1)

    def test_invalid_contacts_and_weights(self) -> None:
        invalid_contacts: list[list[list[Point]]] = [
            [],
            [[(-1, 0)]],
            [[(-1, 0)], []],
            [[(-1, 0), (-2, 0)], [(-3, 0)]],
        ]
        for contacts in invalid_contacts:
            with self.subTest(contacts=contacts), self.assertRaises(ValueError):
                minimum_leader_path(contacts, self.design, 1)
        for weight in (-1, math.inf, math.nan):
            with self.subTest(weight=weight), self.assertRaises(ValueError):
                minimum_leader_path(
                    [[(-1, 0)], [(-2, 0)]],
                    replace(LEADER_DESIGN, normal_velocity_weight=weight),
                    1,
                )


if __name__ == "__main__":
    unittest.main()
