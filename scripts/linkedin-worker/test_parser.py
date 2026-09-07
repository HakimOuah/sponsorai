import unittest
from parser import extract_profile, candidates, company_identity

class ParserTest(unittest.TestCase):
    def data(self, date="Apr 2025 - Present", company="air up"):
        return {"url": "https://www.linkedin.com/in/jane-rivers", "sections": {
            "main_profile": "Jane Rivers\nHead of Influencer Marketing", "experience": f"Experience\nHead of Influencer Marketing\n{company} · Full-time\n{date}\nGermany"},
            "references": {"experience": [{"kind": "company", "url": "https://www.linkedin.com/company/35649256/"}]}}
    def test_current_exact(self):
        profile, _ = extract_profile(self.data(), "air up", "https://www.linkedin.com/company/air-up", "35649256")
        self.assertEqual(profile["name"], "Jane Rivers")
    def test_former_or_other(self):
        for data in [self.data("2020 - 2024"), self.data(company="Other")]:
            self.assertIsNone(extract_profile(data, "air up", "https://www.linkedin.com/company/air-up", "35649256")[0])
    def test_optout(self):
        data = self.data()
        data["sections"]["main_profile"] += "\nDO NOT REACH OUT FOR SPONSORSHIPS PLEASE"
        profile, excluded = extract_profile(data, "air up", "https://www.linkedin.com/company/air-up", "35649256")
        self.assertIsNone(profile)
        self.assertTrue(excluded)
    def test_intern(self):
        data = self.data()
        data["sections"]["experience"] = data["sections"]["experience"].replace("Full-time", "Stage")
        self.assertIsNone(extract_profile(data, "air up", "https://www.linkedin.com/company/air-up", "35649256")[0])
    def test_does_not_borrow_old_employer(self):
        data = self.data()
        data["sections"]["experience"] = "Marketing Manager\nair up\n2020 - 2024\nMarketing Director\nAnother company\n2025 - Present"
        self.assertIsNone(extract_profile(data, "air up", "https://www.linkedin.com/company/air-up", "35649256")[0])
    def test_company(self):
        self.assertEqual(company_identity({"sections": {"about": "air up\nAbout"}, "references": {"about": [{"kind": "company_urn", "value": "35649256"}]}}), ("air up", "35649256"))
    def test_mutual_connection(self):
        data = {"sections": {"search_results": "Jane Rivers • 2nd\nInfluencer Marketing\nMutual connections: John Smith"}, "references": {"search_results": [
            {"kind": "person", "text": name, "url": "https://www.linkedin.com/in/" + slug} for name, slug in [("Jane Rivers", "jane-rivers"), ("John Smith", "john-smith")]]}}
        self.assertEqual(candidates(data), ["https://www.linkedin.com/in/jane-rivers"])

if __name__ == "__main__": unittest.main()
