#!/usr/bin/env python3

import requests
import json
import time

def test_basic_endpoints():
    """Test basic endpoints that don't require RAG system"""
    base_url = "https://insurtech-ai-eval.preview.emergentagent.com/api"
    
    print("🔍 Testing Basic Backend Endpoints...")
    
    # Test health endpoint
    try:
        print("\n1. Testing Health Endpoint...")
        response = requests.get(f"{base_url}/health", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print("   ❌ Health endpoint failed")
            return False
    except Exception as e:
        print(f"   ❌ Health endpoint error: {str(e)}")
        return False
    
    # Test root endpoint
    try:
        print("\n2. Testing Root Endpoint...")
        response = requests.get(f"{base_url}/", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Root endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print("   ❌ Root endpoint failed")
    except Exception as e:
        print(f"   ❌ Root endpoint error: {str(e)}")
    
    # Test registration
    try:
        print("\n3. Testing Registration...")
        user_data = {
            "email": f"test_{int(time.time())}@test.com",
            "password": "password123",
            "company_name": "Test Company",
            "company_type": "digital_health"
        }
        
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Registration working")
            data = response.json()
            token = data.get('access_token')
            print(f"   Token received: {token[:20] if token else 'None'}...")
            
            # Test dashboard with token
            if token:
                print("\n4. Testing Dashboard with Authentication...")
                headers = {'Authorization': f'Bearer {token}'}
                dashboard_response = requests.get(f"{base_url}/dashboard/stats", headers=headers, timeout=30)
                print(f"   Dashboard Status: {dashboard_response.status_code}")
                if dashboard_response.status_code == 200:
                    print("   ✅ Dashboard working")
                    print(f"   Dashboard data: {dashboard_response.json()}")
                else:
                    print("   ❌ Dashboard failed")
            
            return True
        else:
            print("   ❌ Registration failed")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Registration error: {str(e)}")
        return False

def test_rag_endpoints():
    """Test RAG system endpoints"""
    base_url = "https://insurtech-ai-eval.preview.emergentagent.com/api"
    
    print("\n🧠 Testing RAG System Endpoints...")
    
    # Test document stats (should work even if no documents loaded)
    try:
        print("\n1. Testing Document Stats...")
        response = requests.get(f"{base_url}/documents/stats", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Document stats endpoint working")
            print(f"   Stats: {response.json()}")
        else:
            print("   ❌ Document stats failed")
    except Exception as e:
        print(f"   ❌ Document stats error: {str(e)}")
    
    # Test document categories
    try:
        print("\n2. Testing Document Categories...")
        response = requests.get(f"{base_url}/documents/categories", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Document categories endpoint working")
            print(f"   Categories: {response.json()}")
        else:
            print("   ❌ Document categories failed")
    except Exception as e:
        print(f"   ❌ Document categories error: {str(e)}")
    
    # Test news endpoint
    try:
        print("\n3. Testing News Endpoint...")
        response = requests.get(f"{base_url}/news?limit=5", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ News endpoint working")
            data = response.json()
            print(f"   News items: {len(data.get('news', []))}")
        else:
            print("   ❌ News endpoint failed")
    except Exception as e:
        print(f"   ❌ News endpoint error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Simple Backend Test")
    print("=" * 40)
    
    basic_working = test_basic_endpoints()
    
    if basic_working:
        print("\n✅ Basic system is working!")
        test_rag_endpoints()
    else:
        print("\n❌ Basic system has issues!")
    
    print("\n" + "=" * 40)
    print("Test completed!")