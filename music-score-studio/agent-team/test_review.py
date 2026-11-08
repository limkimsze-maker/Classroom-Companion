"""Offline checks for the independent AI review orchestrator (no credentials)."""
import unittest
from review import ROLES, context_excerpt, gate, response_text, verdict

class ReviewerUnitTests(unittest.TestCase):
    def test_four_distinct_specialists(self):
        self.assertEqual(
            set(ROLES),
            {"Music Subject", "Curriculum and Pupil Experience",
             "Quality Assurance", "UI/UX"}
        )
        self.assertEqual(len(set(ROLES.values())), 4)

    def test_verdict_exact_line(self):
        self.assertEqual(verdict("Evidence...\nVERDICT: REQUEST CHANGES\n"),
                         "REQUEST CHANGES")
        self.assertEqual(verdict("VERDICT: APPROVE"),
                         "APPROVE")
        self.assertEqual(verdict("VERDICT: NEEDS FURTHER TESTING"),
                         "NEEDS FURTHER TESTING")
        self.assertEqual(verdict("I might approve this patch"),
                         "NEEDS FURTHER TESTING")

    def test_gate_is_conservative(self):
        approvals = {k: "APPROVE" for k in ROLES}
        self.assertIn("HUMAN APPROVAL", gate(approvals))
        self.assertIn("BLOCKED", gate(dict(approvals, **{"Music Subject": "REQUEST CHANGES"})))
        self.assertIn("FURTHER TESTING", gate(dict(approvals, **{"UI/UX": "NEEDS FURTHER TESTING"})))
        self.assertIn("FURTHER TESTING", gate({"Music Subject": "APPROVE"}))
        self.assertIn("BLOCKED", gate(approvals, incomplete=True))

    def test_long_source_excerpt_is_hunk_scoped(self):
        source = "\n".join(f"line {i}" for i in range(500))
        patch = "@@ -199,2 +200,4 @@"
        snippet = context_excerpt(source, patch, full_limit=6000)
        self.assertIn("200: line 199", snippet)
        self.assertNotIn("1: line 0", snippet)
        self.assertNotIn("500: line 499", snippet)

    def test_short_source_is_complete(self):
        self.assertEqual(context_excerpt("hello", "@@ -1 +1 @@", 100), "hello")

    def test_response_reads_only_assistant_text(self):
        result = {
            "status": "completed",
            "output": [
                {"type": "reasoning", "summary": []},
                {"type": "message", "content": [
                    {"type": "output_text", "text": "VERDICT: APPROVE"}
                ]},
            ],
        }
        self.assertEqual(response_text(result), "VERDICT: APPROVE")
        with self.assertRaises(RuntimeError):
            response_text({"status": "incomplete", "output": []})

if __name__ == "__main__":
    unittest.main()
