import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_root_redirect():
    """Test that root endpoint redirects to static/index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307  # Temporary redirect
    assert response.headers["location"] == "/static/index.html"


def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0
    # Verify activity structure
    for activity_name, details in data.items():
        assert isinstance(activity_name, str)
        assert "description" in details
        assert "schedule" in details
        assert "max_participants" in details
        assert "participants" in details
        assert isinstance(details["participants"], list)


def test_signup_for_activity():
    """Test signing up for an activity"""
    # Get available activities
    activities_response = client.get("/activities")
    activities = activities_response.json()
    test_activity = next(iter(activities))  # Get first activity name
    
    test_email = "test_student@mergington.edu"
    
    # Try signing up
    response = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert test_email in data["message"]
    assert test_activity in data["message"]

    # Verify participant was added
    activities_after = client.get("/activities").json()
    assert test_email in activities_after[test_activity]["participants"]


def test_duplicate_signup():
    """Test that students cannot sign up for the same activity twice"""
    # Get available activities
    activities_response = client.get("/activities")
    activities = activities_response.json()
    test_activity = next(iter(activities))  # Get first activity name
    
    test_email = "duplicate_test@mergington.edu"
    
    # First signup should succeed
    response1 = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert response1.status_code == 200

    # Second signup should fail
    response2 = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert response2.status_code == 400
    assert "already signed up" in response2.json()["detail"]


def test_unregister_from_activity():
    """Test unregistering from an activity"""
    # Get available activities
    activities_response = client.get("/activities")
    activities = activities_response.json()
    test_activity = next(iter(activities))  # Get first activity name
    
    # First sign up a test student
    test_email = "unregister_test@mergington.edu"
    signup_response = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert signup_response.status_code == 200

    # Then unregister them
    unregister_response = client.post(
        f"/activities/{test_activity}/unregister",
        params={"email": test_email}
    )
    assert unregister_response.status_code == 200
    data = unregister_response.json()
    assert "message" in data
    assert test_email in data["message"]
    assert test_activity in data["message"]

    # Verify participant was removed
    activities_after = client.get("/activities").json()
    assert test_email not in activities_after[test_activity]["participants"]


def test_unregister_nonexistent_participant():
    """Test unregistering a participant who isn't registered"""
    # Get available activities
    activities_response = client.get("/activities")
    activities = activities_response.json()
    test_activity = next(iter(activities))  # Get first activity name
    
    test_email = "nonexistent@mergington.edu"
    
    # Try to unregister someone who isn't registered
    response = client.post(
        f"/activities/{test_activity}/unregister",
        params={"email": test_email}
    )
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]