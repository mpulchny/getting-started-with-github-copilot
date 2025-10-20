from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_list():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should contain some known activities from the in-memory store
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"], dict)


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "test_student@mergington.edu"

    # Ensure test_email not in initial participants
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {test_email} for {activity}"
    assert test_email in activities[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants/{test_email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {test_email} from {activity}"
    assert test_email not in activities[activity]["participants"]


def test_unregister_nonexistent_participant():
    activity = "Chess Club"
    fake_email = "noone@mergington.edu"

    # Ensure not present
    if fake_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(fake_email)

    resp = client.delete(f"/activities/{activity}/participants/{fake_email}")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Participant not found in this activity"
