#!/usr/bin/env python3
"""
EV Usage Dataset Analysis & Decision Tree Training Pipeline
------------------------------------------------------------
Analyzes synthetic EV usage data, generates statistical profiles,
and trains a lightweight Decision Tree classifier for range anxiety risk.

Usage:
    python scripts/analyze_ev_usage.py data/raw/<file>.csv
"""

import sys
import os
import json
from datetime import datetime, timezone
import numpy as np
import pandas as pd

try:
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.metrics import accuracy_score, confusion_matrix
except ImportError:
    print("❌ Error: Missing required packages. Please install them using:")
    print("   pip install pandas numpy scikit-learn")
    sys.exit(1)


def export_tree_recursive(tree, node_id, feature_names, class_names):
    """
    Recursively serialize a scikit-learn DecisionTreeClassifier tree into
    a JSON-compatible dictionary structure.
    """
    is_leaf = (tree.children_left[node_id] == -1 and tree.children_right[node_id] == -1)
    samples = int(tree.n_node_samples[node_id])
    values = tree.value[node_id][0]
    total_val = float(values.sum())
    
    # Probabilities for each class
    class_probs = {
        str(cls): round(float(values[idx] / total_val), 4) if total_val > 0 else 0.0
        for idx, cls in enumerate(class_names)
    }
    pred_idx = int(values.argmax())
    predicted_class = str(class_names[pred_idx])

    if is_leaf:
        return {
            "node_id": int(node_id),
            "is_leaf": True,
            "samples": samples,
            "class_probabilities": class_probs,
            "predicted_class": predicted_class,
        }
    else:
        feature_idx = int(tree.feature[node_id])
        feature_name = feature_names[feature_idx]
        threshold = round(float(tree.threshold[node_id]), 4)
        
        left_child = export_tree_recursive(tree, tree.children_left[node_id], feature_names, class_names)
        right_child = export_tree_recursive(tree, tree.children_right[node_id], feature_names, class_names)
        
        return {
            "node_id": int(node_id),
            "is_leaf": False,
            "feature": feature_name,
            "threshold": threshold,
            "samples": samples,
            "class_probabilities": class_probs,
            "predicted_class": predicted_class,
            "left": left_child,
            "right": right_child,
        }


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/analyze_ev_usage.py <path_to_csv>")
        print("Example: python scripts/analyze_ev_usage.py data/raw/EV_Usage_Dataset_v2.csv")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        sys.exit(1)

    print("=" * 65)
    print("⚡ ChargeHub AI — Synthetic EV Usage Data Analysis & Modeling")
    print("=" * 65)
    print(f"📁 Reading CSV file: {csv_path} ...")

    df = pd.read_csv(csv_path)

    # -------------------------------------------------------------
    # 1. Print row count, columns, null counts, value ranges & warnings
    # -------------------------------------------------------------
    print("\n--- 1. Dataset Overview & Data Quality Checks ---")
    print(f"Total Rows:    {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    print(f"Columns:       {', '.join(df.columns)}")

    print("\nNull Counts per Column:")
    null_counts = df.isnull().sum()
    has_nulls = False
    for col, count in null_counts.items():
        if count > 0:
            has_nulls = True
            pct = (count / len(df)) * 100
            print(f"  • {col.padEnd if hasattr(col, 'padEnd') else col:30s}: {count:5d} nulls ({pct:5.1f}%)")
    if not has_nulls:
        print("  • No missing / null values detected.")

    print("\nNumeric Column Value Ranges:")
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in num_cols:
        col_min = df[col].min()
        col_max = df[col].max()
        print(f"  • {col:30s}: min = {col_min:10.2f}, max = {col_max:10.2f}")

    # Check obvious problems
    print("\n⚠️  Sanity Checks & Problem Detection:")
    problems_found = False

    # Negative values check
    cols_to_check_non_negative = [
        "battery_capacity_kwh", "battery_health_pct", "distance_km",
        "daily_trip_count", "charging_frequency_per_week", "charging_duration_min",
        "charging_station_distance_km", "energy_consumed_kwh", "electricity_cost_per_kwh",
        "range_km_estimated"
    ]
    for col in cols_to_check_non_negative:
        if col in df.columns:
            neg_count = (df[col] < 0).sum()
            if neg_count > 0:
                problems_found = True
                print(f"  ❌ WARNING: Column '{col}' contains {neg_count} negative value(s)!")

    # Zero or negative charging duration check
    if "charging_duration_min" in df.columns:
        zero_or_neg_duration = (df["charging_duration_min"] <= 0).sum()
        if zero_or_neg_duration > 0:
            problems_found = True
            print(f"  ❌ WARNING: Column 'charging_duration_min' has {zero_or_neg_duration} zero or negative duration(s)!")

    # Zero distance check
    if "distance_km" in df.columns:
        zero_dist = (df["distance_km"] <= 0).sum()
        if zero_dist > 0:
            print(f"  ℹ️ Notice: Column 'distance_km' has {zero_dist} non-positive value(s).")

    if not problems_found:
        print("  ✅ No critical negative values or zero duration problems found.")

    # -------------------------------------------------------------
    # 2. Derive ev-usage-profile.json
    # -------------------------------------------------------------
    print("\n--- 2. Computing EV Usage Profile ---")

    # Output directories
    os.makedirs("data/derived", exist_ok=True)
    os.makedirs("lib/models", exist_ok=True)

    # Electricity cost per kWh p10/p50/p90 per city and overall
    cost_clean = df["electricity_cost_per_kwh"].dropna()
    cost_overall = {
        "p10": round(float(cost_clean.quantile(0.10)), 2),
        "p50": round(float(cost_clean.quantile(0.50)), 2),
        "p90": round(float(cost_clean.quantile(0.90)), 2),
    }

    cost_per_city = {}
    if "city" in df.columns:
        for city, cdf in df.groupby("city"):
            c_cost = cdf["electricity_cost_per_kwh"].dropna()
            if len(c_cost) > 0:
                cost_per_city[str(city)] = {
                    "p10": round(float(c_cost.quantile(0.10)), 2),
                    "p50": round(float(c_cost.quantile(0.50)), 2),
                    "p90": round(float(c_cost.quantile(0.90)), 2),
                    "count": int(len(c_cost))
                }

    # Per charging_type: median duration, median energy, implied avg power kW
    # (energy divided by duration in hours, capped at 95th percentile)
    charging_profile = {}
    if "charging_type" in df.columns:
        for ctype, cdf in df.groupby("charging_type"):
            valid = cdf[(cdf["charging_duration_min"] > 0) & (cdf["energy_consumed_kwh"] > 0)].copy()
            if len(valid) > 0:
                med_dur = float(valid["charging_duration_min"].median())
                med_energy = float(valid["energy_consumed_kwh"].median())
                
                # Implied power = energy / (duration_hours)
                power_series = valid["energy_consumed_kwh"] / (valid["charging_duration_min"] / 60.0)
                p95_cap = float(power_series.quantile(0.95))
                capped_power = power_series.clip(upper=p95_cap)
                avg_power = float(capped_power.mean())

                charging_profile[str(ctype)] = {
                    "median_duration_min": round(med_dur, 2),
                    "median_energy_kwh": round(med_energy, 2),
                    "implied_avg_power_kw": round(avg_power, 2),
                    "p95_cap_power_kw": round(p95_cap, 2),
                    "sample_count": int(len(valid))
                }

    # Per vehicle_type_label: median battery capacity and median kWh per km
    vehicle_profile = {}
    if "vehicle_type_label" in df.columns:
        for vtype, vdf in df.groupby("vehicle_type_label"):
            med_bat = float(vdf["battery_capacity_kwh"].median()) if "battery_capacity_kwh" in vdf.columns else 0.0
            
            # kWh per km
            valid_dist = vdf[(vdf["distance_km"] > 0) & (vdf["energy_consumed_kwh"] > 0)]
            if len(valid_dist) > 0:
                kwh_km = (valid_dist["energy_consumed_kwh"] / valid_dist["distance_km"]).median()
            else:
                kwh_km = 0.0

            vehicle_profile[str(vtype)] = {
                "median_battery_capacity_kwh": round(med_bat, 2),
                "median_kwh_per_km": round(float(kwh_km), 4),
                "sample_count": int(len(vdf))
            }

    # charging_station_distance_km p10/p50/p90 per city
    dist_per_city = {}
    if "city" in df.columns and "charging_station_distance_km" in df.columns:
        for city, cdf in df.groupby("city"):
            d = cdf["charging_station_distance_km"].dropna()
            if len(d) > 0:
                dist_per_city[str(city)] = {
                    "p10": round(float(d.quantile(0.10)), 2),
                    "p50": round(float(d.quantile(0.50)), 2),
                    "p90": round(float(d.quantile(0.90)), 2),
                }

    # Share of each range_anxiety_risk class per city
    risk_share_per_city = {}
    if "city" in df.columns and "range_anxiety_risk" in df.columns:
        for city, cdf in df.groupby("city"):
            r = cdf["range_anxiety_risk"].dropna()
            if len(r) > 0:
                val_counts = r.value_counts(normalize=True).to_dict()
                risk_share_per_city[str(city)] = {
                    ("High" if float(k) >= 1.0 else "Low"): round(float(v), 4)
                    for k, v in val_counts.items()
                }

    profile_data = {
        "metadata": {
            "dataset_type": "synthetic dataset",
            "dataset_name": os.path.basename(csv_path),
            "rows_used": int(len(df)),
            "generation_date": datetime.now(timezone.utc).isoformat(),
        },
        "electricity_cost_per_kwh": {
            "overall": cost_overall,
            "per_city": cost_per_city,
        },
        "charging_type_profile": charging_profile,
        "vehicle_type_profile": vehicle_profile,
        "charging_station_distance_km_per_city": dist_per_city,
        "range_anxiety_risk_share_per_city": risk_share_per_city,
    }

    profile_path = "data/derived/ev-usage-profile.json"
    with open(profile_path, "w", encoding="utf-8") as f:
        json.dump(profile_data, f, indent=2)
    print(f"✅ Generated and saved: {profile_path}")

    # -------------------------------------------------------------
    # 3. Train Decision Tree Classifier for range_anxiety_risk
    # -------------------------------------------------------------
    print("\n--- 3. Training Decision Tree Classifier ---")

    required_features = [
        "battery_capacity_kwh",
        "battery_health_pct",
        "range_km_estimated",
        "charging_station_distance_km",
        "vehicle_type_label"
    ]
    target_col = "range_anxiety_risk"

    # Filter rows with target
    clean_model_df = df.dropna(subset=[target_col]).copy()
    print(f"Usable samples with target '{target_col}': {len(clean_model_df)}")

    # Target class (as int: 0 for Low, 1 for High)
    y = clean_model_df[target_col].astype(float).round().astype(int)

    # Impute missing numerical features with median
    num_feat = ["battery_capacity_kwh", "battery_health_pct", "range_km_estimated", "charging_station_distance_km"]
    for nf in num_feat:
        if nf in clean_model_df.columns:
            median_val = clean_model_df[nf].median()
            clean_model_df[nf] = clean_model_df[nf].fillna(median_val)

    # Fill missing vehicle_type_label with mode
    mode_veh = clean_model_df["vehicle_type_label"].mode()[0] if "vehicle_type_label" in clean_model_df.columns else "Four-Wheeler"
    clean_model_df["vehicle_type_label"] = clean_model_df["vehicle_type_label"].fillna(mode_veh)

    # One-hot encode vehicle_type_label with canonical classes
    canonical_vehicle_types = ["Four-Wheeler", "Three-Wheeler", "Two-Wheeler"]
    for vt in canonical_vehicle_types:
        col_name = f"vehicle_type_{vt}"
        clean_model_df[col_name] = (clean_model_df["vehicle_type_label"] == vt).astype(int)

    feature_cols = [
        "battery_capacity_kwh",
        "battery_health_pct",
        "range_km_estimated",
        "charging_station_distance_km",
        "vehicle_type_Four-Wheeler",
        "vehicle_type_Three-Wheeler",
        "vehicle_type_Two-Wheeler",
    ]

    X = clean_model_df[feature_cols]

    # Max depth 5 as requested
    clf = DecisionTreeClassifier(max_depth=5, min_samples_leaf=20, random_state=42)

    # 5-fold cross validation
    cv_scores = cross_val_score(clf, X, y, cv=5)
    print(f"5-Fold CV Accuracy Scores: {[round(float(s), 4) for s in cv_scores]}")
    print(f"Mean CV Accuracy:          {cv_scores.mean():.4f} (±{cv_scores.std():.4f})")

    # Train/Test Split (80/20) for confusion matrix and test accuracy
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred).tolist()
    print(f"Test Accuracy:             {acc:.4f}")
    print(f"Confusion Matrix:\n  {cm}")

    # Retrain on full dataset to get complete tree representation
    clf_full = DecisionTreeClassifier(max_depth=5, min_samples_leaf=20, random_state=42)
    clf_full.fit(X, y)

    # Feature importances
    feat_importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(feature_cols, clf_full.feature_importances_)
    }
    print(f"Feature Importances:       {feat_importances}")

    # Write model report
    model_report = {
        "model_type": "DecisionTreeClassifier",
        "max_depth": 5,
        "features": feature_cols,
        "classes": [str(c) for c in clf_full.classes_],
        "metrics": {
            "test_accuracy": round(acc, 4),
            "cv_5fold_scores": [round(float(s), 4) for s in cv_scores],
            "cv_5fold_mean": round(float(cv_scores.mean()), 4),
            "cv_5fold_std": round(float(cv_scores.std()), 4),
            "confusion_matrix": cm,
            "feature_importances": feat_importances,
        },
        "dataset_metadata": {
            "dataset_name": os.path.basename(csv_path),
            "total_samples": int(len(X)),
            "training_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "trained_at": datetime.now(timezone.utc).isoformat(),
        }
    }

    report_path = "data/derived/model-report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(model_report, f, indent=2)
    print(f"✅ Generated and saved: {report_path}")

    # Export tree to JSON
    tree_dict = {
        "model_name": "range_anxiety_decision_tree",
        "max_depth": 5,
        "features": feature_cols,
        "classes": [str(c) for c in clf_full.classes_],
        "root": export_tree_recursive(clf_full.tree_, 0, feature_cols, clf_full.classes_),
        "metadata": {
            "dataset": os.path.basename(csv_path),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "accuracy": round(acc, 4),
        }
    }

    tree_path = "lib/models/range-anxiety-tree.json"
    with open(tree_path, "w", encoding="utf-8") as f:
        json.dump(tree_dict, f, indent=2)
    print(f"✅ Generated and saved: {tree_path}")

    print("\n" + "=" * 65)
    print("🎉 Data analysis & decision tree training completed successfully!")
    print("=" * 65)


if __name__ == "__main__":
    main()
