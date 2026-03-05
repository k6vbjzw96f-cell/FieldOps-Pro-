#!/usr/bin/env python3

import requests
import sys
import uuid
from datetime import datetime, timezone
import json

class FieldOpsAPITester:
    def __init__(self, base_url="https://fieldflow-19.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET", 
            "/api/",
            200
        )
        return success

    def test_plans_endpoint(self):
        """Test plans endpoint (public)"""
        success, response = self.run_test(
            "Get Plans",
            "GET",
            "/api/plans",
            200
        )
        if success and 'plans' in response:
            print(f"   Found {len(response['plans'])} plans")
            expected_plans = ['free', 'starter', 'pro', 'enterprise']
            for plan in expected_plans:
                if plan in response['plans']:
                    print(f"   ✓ {plan} plan available")
                else:
                    print(f"   ✗ {plan} plan missing")
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/api/auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": f"Test User {timestamp}",
                "role": "technician",
                "phone": "+1-555-0123"
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.test_data['user'] = response['user']
            print(f"   ✓ Token received: {self.token[:20]}...")
            print(f"   ✓ User ID: {self.user_id}")
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.test_data.get('user'):
            print("   ⚠️  No test user available for login test")
            return False
            
        success, response = self.run_test(
            "User Login",
            "POST",
            "/api/auth/login",
            200,
            data={
                "email": self.test_data['user']['email'],
                "password": "TestPass123!"
            }
        )
        
        if success and 'access_token' in response:
            print(f"   ✓ Login successful")
        
        return success

    def test_get_user_profile(self):
        """Test get current user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "/api/auth/me",
            200
        )
        
        if success:
            print(f"   ✓ User: {response.get('name', 'N/A')}")
            print(f"   ✓ Role: {response.get('role', 'N/A')}")
        
        return success

    def test_create_task(self):
        """Test task creation"""
        task_data = {
            "title": f"Test Repair Task {datetime.now().strftime('%H%M%S')}",
            "description": "Test task for API validation",
            "priority": "medium",
            "status": "pending",
            "customer_name": "Test Customer",
            "customer_phone": "+1-555-9876",
            "estimated_duration": 60,
            "location": {
                "address": "123 Test St, Test City, TC 12345",
                "lat": 40.7128,
                "lng": -74.0060
            },
            "notes": "Test notes"
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "/api/tasks",
            200,
            data=task_data
        )
        
        if success and 'id' in response:
            self.test_data['task_id'] = response['id']
            print(f"   ✓ Task ID: {self.test_data['task_id']}")
        
        return success

    def test_get_tasks(self):
        """Test get all tasks"""
        success, response = self.run_test(
            "Get Tasks",
            "GET",
            "/api/tasks",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} tasks")
        
        return success

    def test_get_task_by_id(self):
        """Test get specific task"""
        if not self.test_data.get('task_id'):
            print("   ⚠️  No test task available")
            return False
            
        success, response = self.run_test(
            "Get Task by ID",
            "GET",
            f"/api/tasks/{self.test_data['task_id']}",
            200
        )
        
        if success:
            print(f"   ✓ Task: {response.get('title', 'N/A')}")
        
        return success

    def test_update_task(self):
        """Test task update"""
        if not self.test_data.get('task_id'):
            print("   ⚠️  No test task available")
            return False
            
        success, response = self.run_test(
            "Update Task",
            "PUT",
            f"/api/tasks/{self.test_data['task_id']}",
            200,
            data={
                "status": "in_progress",
                "priority": "high"
            }
        )
        
        return success

    def test_create_inventory_item(self):
        """Test inventory item creation"""
        item_data = {
            "name": "Test Equipment",
            "sku": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "description": "Test equipment for API validation",
            "quantity": 10,
            "min_quantity": 2,
            "unit": "pcs",
            "category": "tools",
            "price": 99.99,
            "location": "Warehouse A"
        }
        
        success, response = self.run_test(
            "Create Inventory Item",
            "POST",
            "/api/inventory",
            200,
            data=item_data
        )
        
        if success and 'id' in response:
            self.test_data['inventory_id'] = response['id']
            print(f"   ✓ Inventory ID: {self.test_data['inventory_id']}")
        
        return success

    def test_get_inventory(self):
        """Test get inventory"""
        success, response = self.run_test(
            "Get Inventory",
            "GET",
            "/api/inventory",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} inventory items")
        
        return success

    def test_update_inventory_item(self):
        """Test inventory item update"""
        if not self.test_data.get('inventory_id'):
            print("   ⚠️  No test inventory item available")
            return False
            
        success, response = self.run_test(
            "Update Inventory Item",
            "PUT",
            f"/api/inventory/{self.test_data['inventory_id']}",
            200,
            data={
                "quantity": 15,
                "price": 89.99
            }
        )
        
        return success

    def test_get_team_members(self):
        """Test get team members"""
        success, response = self.run_test(
            "Get Team Members",
            "GET",
            "/api/team",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} team members")
        
        return success

    def test_analytics_overview(self):
        """Test analytics overview"""
        success, response = self.run_test(
            "Analytics Overview",
            "GET",
            "/api/analytics/overview",
            200
        )
        
        if success and 'tasks' in response:
            print(f"   ✓ Total tasks: {response['tasks'].get('total', 0)}")
            print(f"   ✓ Pending: {response['tasks'].get('pending', 0)}")
            print(f"   ✓ Completed: {response['tasks'].get('completed', 0)}")
        
        return success

    def test_analytics_performance(self):
        """Test analytics performance data"""
        success, response = self.run_test(
            "Analytics Performance",
            "GET",
            "/api/analytics/performance?days=7",
            200
        )
        
        if success and 'chart_data' in response:
            print(f"   ✓ Chart data points: {len(response['chart_data'])}")
        
        return success

    def test_weather_api(self):
        """Test weather API"""
        success, response = self.run_test(
            "Weather API",
            "GET",
            "/api/weather?lat=40.7128&lon=-74.0060",
            200
        )
        
        if success and 'temp' in response:
            print(f"   ✓ Temperature: {response['temp']}°F")
            print(f"   ✓ Description: {response.get('description', 'N/A')}")
        
        return success

    def test_subscription_api(self):
        """Test subscription API"""
        success, response = self.run_test(
            "Get Subscription",
            "GET",
            "/api/subscription",
            200
        )
        
        if success:
            print(f"   ✓ Plan: {response.get('plan_name', 'N/A')}")
            print(f"   ✓ Status: {response.get('status', 'N/A')}")
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test task
        if self.test_data.get('task_id'):
            self.run_test(
                "Delete Test Task",
                "DELETE",
                f"/api/tasks/{self.test_data['task_id']}",
                200
            )
        
        # Delete test inventory item
        if self.test_data.get('inventory_id'):
            self.run_test(
                "Delete Test Inventory Item",
                "DELETE",
                f"/api/inventory/{self.test_data['inventory_id']}",
                200
            )

def main():
    print("🚀 Starting FieldOps Pro API Tests...")
    print("=" * 60)
    
    tester = FieldOpsAPITester()
    
    # Test sequence
    tests = [
        tester.test_api_root,
        tester.test_plans_endpoint,
        tester.test_user_registration,
        tester.test_user_login,
        tester.test_get_user_profile,
        tester.test_create_task,
        tester.test_get_tasks,
        tester.test_get_task_by_id,
        tester.test_update_task,
        tester.test_create_inventory_item,
        tester.test_get_inventory,
        tester.test_update_inventory_item,
        tester.test_get_team_members,
        tester.test_analytics_overview,
        tester.test_analytics_performance,
        tester.test_weather_api,
        tester.test_subscription_api,
    ]
    
    # Run tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
        print("-" * 40)
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Results
    print("\n📊 Test Results:")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())