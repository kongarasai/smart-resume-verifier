import pandas as pd
import numpy as np
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

MODEL = None

def init_model():
    global MODEL
    # Train model on startup
    csv_path = os.path.join(os.path.dirname(__file__), 'fraud_dataset.csv')
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print("Could not load fraud dataset:", e)
        return
        
    X = df[['test_score', 'github_score', 'skill_score', 'keyword_match_ratio']]
    y = df['is_fraud']
    
    # Train robust Random Forest
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X, y)
    MODEL = rf
    print("AI Fraud Detection Model initialized!")

def predict_fraud(test_score, github_score, skill_score, claimed_skills_text):
    if not MODEL:
        return 0.5
        
    # approximate a keyword match ratio (simplistic NLP extraction proxy for MVP)
    # usually this is (matching_keywords / total_keywords)
    keywords = claimed_skills_text.lower().split(',')
    found = len([k for k in keywords if len(k.strip()) > 1])
    match_ratio = min(1.0, found / 10.0) if found > 0 else 0.5
    
    X_new = pd.DataFrame([[test_score, github_score, skill_score, match_ratio]], 
                         columns=['test_score', 'github_score', 'skill_score', 'keyword_match_ratio'])
    
    # Predict Probability
    prob = float(MODEL.predict_proba(X_new)[0][1])

    reasons = []
    if prob > 0.4:
        if test_score < 40: reasons.append("Low practice/test score")
        if github_score < 30: reasons.append("Insufficient GitHub evidence")
        if match_ratio < 0.4: reasons.append("Skill keyword mismatch")
    if not reasons and prob > 0.4:
        reasons.append("Anomalous pattern detected by ML model")

    return {"probability": prob, "reasons": reasons}
