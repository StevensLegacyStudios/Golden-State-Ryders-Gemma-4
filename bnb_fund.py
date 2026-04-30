"""
Golden State Ryders — Bent Not Broken Fund
Sovereign Corridor Economics Engine
Stevens Legacy Studios | Sacramento, CA

Every commercial fare feeds this fund.
This fund pays for free medical transportation.
No grants. No charity. The math does the mission.
"""


class BNBFund:

    TIERS = [
        {"name": "Floor",       "min": 0,       "max": 15000,        "driver_pct": 0.50, "fund_pct": 0.50},
        {"name": "Equilibrium", "min": 15000,   "max": 50000,        "driver_pct": 0.65, "fund_pct": 0.35},
        {"name": "Growth",      "min": 50000,   "max": 100000,       "driver_pct": 0.75, "fund_pct": 0.25},
        {"name": "Legacy",      "min": 100000,  "max": float("inf"), "driver_pct": 0.80, "fund_pct": 0.20},
    ]

    def __init__(self, balance: float = 0.0):
        self.balance = balance
        self.funded_miles = 0.0
        self.free_rides = 0
        self.commercial_rides = 0

    def get_tier(self) -> dict:
        for t in self.TIERS:
            if t["min"] <= self.balance < t["max"]:
                return t
        return self.TIERS[-1]

    def process_commercial_fare(self, gross: float) -> dict:
        """
        Fee-First Financial Law — immutable order:
        1. Stripe fee (2.9% + $0.30) off the top
        2. Sovereign Corridor split on the remainder
        """
        stripe = round((gross * 0.029) + 0.30, 2)
        net = round(gross - stripe, 2)
        tier = self.get_tier()
        driver = round(net * tier["driver_pct"], 2)
        fund = round(net * tier["fund_pct"], 2)
        self.balance = round(self.balance + fund, 2)
        self.commercial_rides += 1
        return {
            "gross": gross,
            "stripe_fee": stripe,
            "net": net,
            "tier": tier["name"],
            "driver_pay": driver,
            "fund_contribution": fund,
            "bnb_balance": self.balance,
            "driver_pct": int(tier["driver_pct"] * 100),
            "fund_pct": int(tier["fund_pct"] * 100),
        }

    def process_medical_ride(self, cost: float, miles: float) -> dict:
        """Medical rides are never denied. Fund absorbs cost. Patient pays zero."""
        self.balance = round(self.balance - cost, 2)
        self.funded_miles += miles
        self.free_rides += 1
        return {
            "approved": True,
            "patient_cost": 0.00,
            "fund_absorbed": cost,
            "miles_funded": miles,
            "bnb_balance": self.balance,
            "total_free_rides": self.free_rides,
            "total_funded_miles": round(self.funded_miles, 1),
        }

    def status(self) -> dict:
        tier = self.get_tier()
        return {
            "balance": f"${self.balance:,.2f}",
            "tier": tier["name"],
            "driver_rate": f"{int(tier['driver_pct']*100)}%",
            "fund_rate": f"{int(tier['fund_pct']*100)}%",
            "free_rides_completed": self.free_rides,
            "funded_miles": f"{self.funded_miles:.1f} mi",
            "commercial_rides": self.commercial_rides,
        }
