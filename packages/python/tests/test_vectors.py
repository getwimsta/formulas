import unittest

import wimsta_formulas as W


class Vectors(unittest.TestCase):
    def test_all_vectors(self):
        V = W.vectors["vectors"]
        self.assertTrue(V)
        for v in V:
            r = W.calculate(v["formula_id"], v["inputs"])
            if isinstance(v["value"], (int, float)):
                self.assertLessEqual(abs(r["value"] - v["value"]), 1e-6, (v["formula_id"], v["inputs"], r["value"], v["value"]))
            else:
                self.assertEqual(r["value"], v["value"])
            self.assertEqual(r["unit"], v["unit"])
        print(f"python: {len(V)}/{len(V)} vectors")

    def test_errors(self):
        with self.assertRaisesRegex(W.FormulaInputError, "unknown formula"):
            W.calculate("mifflin-st-jeor", {})
        with self.assertRaisesRegex(W.FormulaInputError, "age must be"):
            W.calculate("fox", {"age": 17})
        with self.assertRaisesRegex(W.FormulaInputError, "women only"):
            W.calculate("gulati", {"sex": "male", "age": 40})
        with self.assertRaisesRegex(W.FormulaInputError, "abdomen_cm"):
            W.calculate("us-navy", {"sex": "male", "height_cm": 180, "neck_cm": 39, "waist_cm": 88})
        self.assertEqual(len(W.list_formulas("bmr")), 3)
        self.assertEqual(W.REGISTRY_VERSION, W.registry["registry_version"])


if __name__ == "__main__":
    unittest.main()
