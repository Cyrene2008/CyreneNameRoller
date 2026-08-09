use serde_json::Value;
use std::collections::{HashMap, HashSet};

const TARGET_GAP: f64 = 2.0;
const COLD_START_ROUNDS: f64 = 2.0;
const INTERNAL_SENSITIVITY: f64 = 0.7;
const INTERNAL_MAX_RATIO: f64 = 3.0;
const OVERFLOW_PENALTY: f64 = 0.2;
const RECOVERY_DECAY: f64 = 0.08;
const GUARD_FLOOR: f64 = 0.01;
const MAX_SELECTION_PROBABILITY: f64 = 0.3;

fn person_key(person: &Value) -> String {
    person.get("id").and_then(Value::as_str).or_else(|| person.get("cn").and_then(Value::as_str)).unwrap_or("").to_string()
}

fn count_for(counts: &HashMap<String, f64>, person: &Value) -> f64 {
    counts.get(&person_key(person)).copied().filter(|value| value.is_finite() && *value > 0.0).unwrap_or(0.0)
}

fn cap_weight_shares(weights: HashMap<String, f64>, names: &[Value]) -> HashMap<String, f64> {
    if names.len() <= 1 { return weights; }
    let max_share = MAX_SELECTION_PROBABILITY.max(1.0 / names.len() as f64);
    let mut remaining: HashSet<String> = names.iter().map(person_key).collect();
    let mut shares = HashMap::new();
    let mut remaining_mass = 1.0;
    while !remaining.is_empty() {
        let remaining_names: Vec<String> = remaining.iter().cloned().collect();
        let total_weight: f64 = remaining_names.iter().map(|name| weights.get(name).copied().unwrap_or(0.0)).sum();
        let newly_capped: Vec<String> = remaining_names.iter().filter(|name| {
            let share = if total_weight > 0.0 { weights.get(*name).copied().unwrap_or(0.0) / total_weight * remaining_mass } else { remaining_mass / remaining.len() as f64 };
            share > max_share
        }).cloned().collect();
        if newly_capped.is_empty() {
            for name in remaining_names {
                let share = if total_weight > 0.0 { weights.get(&name).copied().unwrap_or(0.0) / total_weight * remaining_mass } else { remaining_mass / remaining.len() as f64 };
                shares.insert(name, share);
            }
            break;
        }
        for name in newly_capped {
            shares.insert(name.clone(), max_share);
            remaining.remove(&name);
            remaining_mass -= max_share;
        }
    }
    shares
}

fn create_weight_map(names: &[Value], white_list: &[Value], counts: &HashMap<String, f64>, enabled: bool) -> HashMap<String, f64> {
    let white_list: HashSet<String> = white_list.iter().map(person_key).collect();
    let regular: Vec<&Value> = names.iter().filter(|name| !white_list.contains(&person_key(name))).collect();
    let mut weights: HashMap<String, f64> = names.iter().map(|name| (person_key(name), 1.0)).collect();
    if !enabled || regular.is_empty() { return weights; }
    let values: Vec<f64> = regular.iter().map(|name| count_for(counts, name)).collect();
    let total_draws: f64 = values.iter().sum();
    let expected = total_draws / regular.len() as f64;
    let min_count = values.iter().copied().fold(f64::INFINITY, f64::min);
    let max_count = values.iter().copied().fold(f64::NEG_INFINITY, f64::max);
    let gap = max_count - min_count;
    let warmup = (total_draws / (regular.len() as f64 * COLD_START_ROUNDS)).clamp(0.0, 1.0);
    let gap_pressure = (gap / TARGET_GAP).clamp(0.0, 2.0);
    let adaptive_gain = INTERNAL_SENSITIVITY * (0.35 + 0.65 * gap_pressure);
    let raw_log: Vec<f64> = values.iter().map(|count| -adaptive_gain * (count - expected)).collect();
    let raw_min = raw_log.iter().copied().fold(f64::INFINITY, f64::min);
    let raw_max = raw_log.iter().copied().fold(f64::NEG_INFINITY, f64::max);
    let midpoint = (raw_min + raw_max) / 2.0;
    let half_log_range = INTERNAL_MAX_RATIO.ln() / 2.0;
    let min_occurrences = values.iter().filter(|value| **value == min_count).count();
    let second_min = values.iter().copied().filter(|value| *value > min_count).fold(f64::INFINITY, f64::min);
    for (index, person) in regular.iter().enumerate() {
        let bounded = (raw_log[index] - midpoint).clamp(-half_log_range, half_log_range);
        let projected = values[index] + 1.0;
        let projected_min = if values[index] == min_count && min_occurrences == 1 { projected.min(second_min) } else { min_count };
        let projected_gap = max_count.max(projected) - projected_min;
        let guard = if gap > TARGET_GAP && values[index] > min_count {
            GUARD_FLOOR.max(RECOVERY_DECAY.powf(values[index] - min_count))
        } else if gap <= TARGET_GAP && projected_gap > TARGET_GAP {
            OVERFLOW_PENALTY
        } else { 1.0 };
        weights.insert(person_key(person), (bounded * warmup).exp() * guard);
    }
    cap_weight_shares(weights, names)
}

pub fn pick_cyrene_batch<F: FnMut() -> f64>(names: &[Value], white_list: &[Value], raw_counts: &Value, enabled: bool, draw_count: usize, allow_duplicates: bool, mut random: F) -> Vec<Value> {
    let mut counts: HashMap<String, f64> = raw_counts.as_object().map(|object| object.iter().filter_map(|(key, value)| value.as_f64().map(|value| (key.clone(), value))).collect()).unwrap_or_default();
    let white_list_set: HashSet<String> = white_list.iter().map(person_key).collect();
    let mut excluded = HashSet::new();
    let mut picks = Vec::new();
    let limit = if allow_duplicates { draw_count } else { draw_count.min(names.len()) };
    for _ in 0..limit {
        let available: Vec<Value> = names.iter().filter(|name| allow_duplicates || !excluded.contains(&person_key(name))).cloned().collect();
        if available.is_empty() { break; }
        let weights = create_weight_map(&available, white_list, &counts, enabled);
        let total: f64 = available.iter().map(|name| weights.get(&person_key(name)).copied().unwrap_or(1.0)).sum();
        let mut threshold = random().clamp(0.0, 1.0 - f64::EPSILON) * total;
        let mut selected = available.last().cloned().unwrap();
        for candidate in &available {
            threshold -= weights.get(&person_key(candidate)).copied().unwrap_or(1.0);
            if threshold < 0.0 { selected = candidate.clone(); break; }
        }
        let key = person_key(&selected);
        if !allow_duplicates { excluded.insert(key.clone()); }
        if !white_list_set.contains(&key) { *counts.entry(key).or_insert(0.0) += 1.0; }
        picks.push(selected);
    }
    picks
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Vector { id: String, names: Vec<Value>, white_list: Vec<Value>, counts: Value, settings: Value, draw_count: usize, allow_duplicates: bool, random: Vec<f64>, expected_ids: Vec<String> }
    #[derive(Deserialize)]
    struct Fixtures { vectors: Vec<Vector> }

    #[test]
    fn matches_shared_js_vectors() {
        let fixtures: Fixtures = serde_json::from_str(include_str!("../../scripts/fixtures/core-algorithm-v3.1.1.json")).unwrap();
        for vector in fixtures.vectors {
            let mut index = 0;
            let picks = pick_cyrene_batch(&vector.names, &vector.white_list, &vector.counts, vector.settings.get("enabled").and_then(Value::as_bool).unwrap_or(true), vector.draw_count, vector.allow_duplicates, || {
                let value = vector.random.get(index).copied().or_else(|| vector.random.last().copied()).unwrap_or(0.0);
                index += 1;
                value
            });
            assert_eq!(picks.iter().map(person_key).collect::<Vec<_>>(), vector.expected_ids, "{}", vector.id);
        }
    }
}
