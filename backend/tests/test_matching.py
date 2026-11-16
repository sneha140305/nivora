from types import SimpleNamespace

from app.services.matching import calculate_compatibility, WEIGHTS


def make_profile(**overrides):
    defaults = {
        "sleep_time": "23:00",
        "wake_time": "07:00",
        "cleanliness_level": "moderate",
        "noise_tolerance": "medium",
        "budget_min": 5000,
        "budget_max": 10000,
        "work_schedule": "day_shift",
        "social_level": "balanced",
        "guest_frequency": "sometimes",
        "food_preference": "vegetarian",
        "pets_allowed": True,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def test_weights_total_100():
    assert sum(WEIGHTS.values()) == 100


def test_identical_profiles_have_100_compatibility():
    profile_a = make_profile()
    profile_b = make_profile()

    result = calculate_compatibility(profile_a, profile_b)

    assert result["compatibility_score"] == 100


def test_missing_information_is_ignored():
    profile_a = make_profile()
    profile_b = make_profile(
        sleep_time="23:00",
        wake_time="07:00",
        cleanliness_level=None,
        noise_tolerance=None,
        budget_min=None,
        budget_max=None,
        work_schedule=None,
        social_level=None,
        guest_frequency=None,
        food_preference=None,
        pets_allowed=None,
    )

    result = calculate_compatibility(profile_a, profile_b)

    assert result["compatibility_score"] == 100
    assert result["category_scores"]["sleep"] == 100

def test_no_information_returns_none():
    profile_a = make_profile(
        sleep_time=None,
        wake_time=None,
        cleanliness_level=None,
        noise_tolerance=None,
        budget_min=None,
        budget_max=None,
        work_schedule=None,
        social_level=None,
        guest_frequency=None,
        food_preference=None,
        pets_allowed=None,
    )

    result = calculate_compatibility(profile_a, profile_a)

    assert result["compatibility_score"] is None


def test_overlapping_budgets_have_full_score():
    profile_a = make_profile(budget_min=5000, budget_max=10000)
    profile_b = make_profile(budget_min=8000, budget_max=12000)

    result = calculate_compatibility(profile_a, profile_b)

    assert result["category_scores"]["budget"] == 100


def test_non_overlapping_budgets_have_lower_score():
    profile_a = make_profile(budget_min=5000, budget_max=7000)
    profile_b = make_profile(budget_min=10000, budget_max=12000)

    result = calculate_compatibility(profile_a, profile_b)

    assert result["category_scores"]["budget"] < 100


def test_sleep_times_across_midnight_are_compared_correctly():
    profile_a = make_profile(sleep_time="23:00", wake_time="07:00")
    profile_b = make_profile(sleep_time="00:00", wake_time="08:00")

    result = calculate_compatibility(profile_a, profile_b)

    assert result["category_scores"]["sleep"] == 85