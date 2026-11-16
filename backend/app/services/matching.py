from datetime import datetime


WEIGHTS = {
    "sleep": 20,
    "cleanliness": 15,
    "noise": 15,
    "budget": 15,
    "work_schedule": 10,
    "social": 10,
    "guests": 5,
    "food": 5,
    "pets": 5,
}


def compare_values(value_a, value_b, compatibility_map):
    if value_a is None or value_b is None:
        return None

    return compatibility_map.get(
        (value_a, value_b),
        compatibility_map.get((value_b, value_a), 0),
    )


def compare_sleep(profile_a, profile_b):
    if not all([
        profile_a.sleep_time,
        profile_a.wake_time,
        profile_b.sleep_time,
        profile_b.wake_time,
    ]):
        return None

    try:
        def minutes(value):
            parsed = datetime.strptime(value, "%H:%M")
            return parsed.hour * 60 + parsed.minute

        def circular_difference(a, b):
            difference = abs(a - b)
            return min(difference, 1440 - difference)

        sleep_diff = circular_difference(
            minutes(profile_a.sleep_time),
            minutes(profile_b.sleep_time),
        )

        wake_diff = circular_difference(
            minutes(profile_a.wake_time),
            minutes(profile_b.wake_time),
        )

        average_difference = (sleep_diff + wake_diff) / 2

        return max(0, 100 - (average_difference / 4))

    except ValueError:
        return None


def compare_budget(profile_a, profile_b):
    values = (
        profile_a.budget_min,
        profile_a.budget_max,
        profile_b.budget_min,
        profile_b.budget_max,
    )

    if any(value is None for value in values):
        return None

    a_min, a_max, b_min, b_max = values

    if a_min > a_max or b_min > b_max:
        return None

    if max(a_min, b_min) <= min(a_max, b_max):
        return 100

    gap = max(a_min, b_min) - min(a_max, b_max)
    lower_budget = max(1, min(a_max, b_max))

    return max(0, 100 - (gap / lower_budget * 100))


def calculate_compatibility(profile_a, profile_b):
    scores = {
        "sleep": compare_sleep(profile_a, profile_b),

        "cleanliness": compare_values(
            profile_a.cleanliness_level,
            profile_b.cleanliness_level,
            {
                ("very_clean", "very_clean"): 100,
                ("moderate", "moderate"): 100,
                ("relaxed", "relaxed"): 100,
                ("very_clean", "moderate"): 70,
                ("moderate", "relaxed"): 70,
                ("very_clean", "relaxed"): 20,
            },
        ),

        "noise": compare_values(
            profile_a.noise_tolerance,
            profile_b.noise_tolerance,
            {
                ("low", "low"): 100,
                ("medium", "medium"): 100,
                ("high", "high"): 100,
                ("low", "medium"): 75,
                ("medium", "high"): 75,
                ("low", "high"): 30,
            },
        ),

        "budget": compare_budget(profile_a, profile_b),

        "work_schedule": compare_values(
            profile_a.work_schedule,
            profile_b.work_schedule,
            {
                ("day_shift", "day_shift"): 100,
                ("night_shift", "night_shift"): 100,
                ("flexible", "flexible"): 100,
                ("remote", "remote"): 100,
                ("not_applicable", "not_applicable"): 100,
                ("day_shift", "flexible"): 85,
                ("remote", "flexible"): 85,
            },
        ),

        "social": compare_values(
            profile_a.social_level,
            profile_b.social_level,
            {
                ("introvert", "introvert"): 100,
                ("balanced", "balanced"): 100,
                ("extrovert", "extrovert"): 100,
                ("introvert", "balanced"): 75,
                ("balanced", "extrovert"): 75,
                ("introvert", "extrovert"): 30,
            },
        ),

        "guests": compare_values(
            profile_a.guest_frequency,
            profile_b.guest_frequency,
            {
                ("rarely", "rarely"): 100,
                ("sometimes", "sometimes"): 100,
                ("frequently", "frequently"): 100,
                ("rarely", "sometimes"): 75,
                ("sometimes", "frequently"): 75,
                ("rarely", "frequently"): 25,
            },
        ),

        "food": compare_values(
            profile_a.food_preference,
            profile_b.food_preference,
            {
                ("vegetarian", "vegetarian"): 100,
                ("vegan", "vegan"): 100,
                ("non_vegetarian", "non_vegetarian"): 100,
                ("eggetarian", "eggetarian"): 100,
                ("no_preference", "no_preference"): 100,
                ("vegetarian", "eggetarian"): 85,
                ("vegetarian", "vegan"): 85,
                ("non_vegetarian", "no_preference"): 100,
            },
        ),

        "pets": compare_values(
            profile_a.pets_allowed,
            profile_b.pets_allowed,
            {
                (True, True): 100,
                (False, False): 100,
                (True, False): 0,
            },
        ),
    }

    available_weight = sum(
        WEIGHTS[category]
        for category, score in scores.items()
        if score is not None
    )

    if available_weight == 0:
        return {
            "compatibility_score": None,
            "category_scores": scores,
            "matched_factors": [],
            "conflict_factors": [],
            "message": "Insufficient information to calculate compatibility.",
        }

    weighted_score = sum(
        score * WEIGHTS[category]
        for category, score in scores.items()
        if score is not None
    )

    final_score = round(weighted_score / available_weight, 2)

    matched_factors = [
        category
        for category, score in scores.items()
        if score is not None and score >= 80
    ]

    conflict_factors = [
        category
        for category, score in scores.items()
        if score is not None and score < 50
    ]

    return {
        "compatibility_score": final_score,
        "category_scores": scores,
        "matched_factors": matched_factors,
        "conflict_factors": conflict_factors,
        "message": (
            "Excellent match" if final_score >= 85
            else "Good match" if final_score >= 70
            else "Moderate match" if final_score >= 50
            else "Low compatibility"
        ),
    }