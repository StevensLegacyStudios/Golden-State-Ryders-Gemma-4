"""
H.A.Y.L.I.E. — Highly Adaptive Yoked Learning Intelligence Entity
GSR Context: Hyper-Adaptive Yielding Logistics Intelligence Engine
Stevens Legacy Studios | Sacramento, CA

Silent back-of-house dispatch layer.
Never speaks to users. Governs everything Goldie does.
Priority stack is immutable. Safety first. Always.
"""

MEDICAL_KEYWORDS = [
    "chemo", "chemotherapy", "dialysis", "surgery", "hospital",
    "oncology", "cancer", "radiation", "transplant", "emergency",
    "clinic", "physical therapy", "rehab", "doctor", "appointment",
    "treatment", "infusion", "biopsy", "prescription", "pharmacy",
    "wheelchair", "walker", "oxygen", "nurse", "medical"
]

FLEET = {
    "BASIC":   {"seats": 5, "max_age": 12, "rate_mult": 1.00},
    "COMFORT": {"seats": 5, "max_age": 7,  "rate_mult": 1.25},
    "XL":      {"seats": 6, "max_age": 12, "rate_mult": 1.40},
    "GOLD":    {"seats": 5, "max_age": 5,  "rate_mult": 1.75},
    "XL GOLD": {"seats": 6, "max_age": 7,  "rate_mult": 2.00},
    "ELITE":   {"seats": 5, "max_age": 3,  "rate_mult": 2.50},
}

BASE_RATE_PER_MILE = 2.50
BASE_FEE = 2.50


class HAYLIEDispatch:
    """
    Silent dispatch intelligence. Governs all ride classification and routing.
    Never visible to end users. Goldie is the voice. H.A.Y.L.I.E. is the brain.
    """

    PRIORITY_STACK = {
        "ABSOLUTE": 1,   # Human safety — overrides everything
        "CRITICAL": 2,   # Medical urgency
        "HIGH":     3,   # Financial integrity
        "MEDIUM":   4,   # Operational continuity
        "LOW":      5,   # Performance optimization
        "ADVISORY": 6,   # Recommendations only
    }

    def classify(self, message: str) -> dict:
        """Classify ride request. Medical triggers CRITICAL priority instantly."""
        msg = message.lower()
        is_medical = any(kw in msg for kw in MEDICAL_KEYWORDS)

        if is_medical:
            return {
                "priority": "CRITICAL",
                "priority_level": self.PRIORITY_STACK["CRITICAL"],
                "category": "MEDICAL_FREE",
                "patient_cost": 0.00,
                "angel_dryver": True,
                "haylie_directive": (
                    "BNB Fund activated. Angel Dryver pool only. "
                    "Zero cost to patient. Confirm pickup details, "
                    "destination, date, time, and mobility needs."
                ),
            }
        return {
            "priority": "MEDIUM",
            "priority_level": self.PRIORITY_STACK["MEDIUM"],
            "category": "COMMERCIAL",
            "angel_dryver": False,
            "haylie_directive": (
                "Standard commercial ride. "
                "Apply Sovereign Corridor split. Show fare to rider."
            ),
        }

    def estimate_fare(self, miles: float, vehicle: str = "BASIC") -> float:
        """Estimate fare based on distance and vehicle class."""
        mult = FLEET.get(vehicle, FLEET["BASIC"])["rate_mult"]
        return round((miles * BASE_RATE_PER_MILE * mult) + BASE_FEE, 2)

